"""
app.py - FastAPI Backend Entrypoint for DataQualAI
Intelligent Dataset Diagnosis and Quality Analysis System
"""

import io
import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from core.profiler import calculate_dataset_profile
from core.ge_engine import GEValidationEngine
from core.llm_rule_generator import LLMRuleGenerator
from core.remediator import DatasetRemediator
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(
    title="DataQualAI API",
    description="Intelligent Dataset Diagnosis & Quality Analysis System based on Great Expectations and LLM Rule Generation",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory state for active dataset session
SESSION_DATA = {
    "df": None,
    "filename": "No dataset loaded",
    "profile": None,
    "last_validation": None,
    "cleaned_df": None
}

ge_engine = GEValidationEngine()
remediator = DatasetRemediator()
rule_generator = LLMRuleGenerator()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DATA_DIR = os.path.join(BASE_DIR, "sample_data")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "DataQualAI",
        "version": "1.0.0",
        "has_active_dataset": SESSION_DATA["df"] is not None,
        "dataset_name": SESSION_DATA["filename"],
        "available_presets": ["telco_churn", "healthcare_stroke"]
    }


@app.post("/api/load-preset")
def load_preset(preset: str = Form(...)):
    """Loads built-in benchmark datasets: telco_churn or healthcare_stroke"""
    if preset == "telco_churn":
        path = os.path.join(SAMPLE_DATA_DIR, "telco_churn_sample.csv")
        filename = "telco_churn_sample.csv"
        target_col = "Churn"
    elif preset == "healthcare_stroke":
        path = os.path.join(SAMPLE_DATA_DIR, "healthcare_stroke_sample.csv")
        filename = "healthcare_stroke_sample.csv"
        target_col = "stroke"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown preset '{preset}'")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Preset file '{path}' not found on server.")

    df = pd.read_csv(path)
    SESSION_DATA["df"] = df
    SESSION_DATA["cleaned_df"] = None
    SESSION_DATA["filename"] = filename
    SESSION_DATA["profile"] = calculate_dataset_profile(df, target_column=target_col)
    SESSION_DATA["last_validation"] = None

    return {
        "message": f"Preset '{filename}' loaded successfully",
        "filename": filename,
        "profile": SESSION_DATA["profile"]
    }


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads CSV, XLSX, or Parquet dataset file up to 100MB"""
    contents = await file.read()
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(io.BytesIO(contents))
        elif ext in [".parquet", ".pq"]:
            df = pd.read_parquet(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv, .xlsx, or .parquet.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    SESSION_DATA["df"] = df
    SESSION_DATA["cleaned_df"] = None
    SESSION_DATA["filename"] = filename
    SESSION_DATA["profile"] = calculate_dataset_profile(df)
    SESSION_DATA["last_validation"] = None

    return {
        "message": f"Dataset '{filename}' uploaded successfully",
        "filename": filename,
        "profile": SESSION_DATA["profile"]
    }


class DiagnoseRequest(BaseModel):
    target_column: Optional[str] = None


@app.post("/api/diagnose")
def run_diagnosis(req: DiagnoseRequest):
    df = SESSION_DATA["cleaned_df"] if SESSION_DATA["cleaned_df"] is not None else SESSION_DATA["df"]
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload or load a preset first.")

    profile = calculate_dataset_profile(df, target_column=req.target_column)
    SESSION_DATA["profile"] = profile
    return profile


class PromptRuleRequest(BaseModel):
    prompt: str
    api_key: Optional[str] = None
    model: Optional[str] = "gpt-4o-mini"


@app.post("/api/rules/prompt")
def generate_rules_from_prompt(req: PromptRuleRequest):
    df = SESSION_DATA["df"]
    profile = SESSION_DATA["profile"]
    if df is None or profile is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    gen = LLMRuleGenerator(api_key=req.api_key, model=req.model)
    res = gen.generate_from_prompt(req.prompt, profile["schema"], df)
    return res


@app.post("/api/rules/smart")
def generate_smart_rules():
    df = SESSION_DATA["df"]
    profile = SESSION_DATA["profile"]
    if df is None or profile is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    res = rule_generator.generate_smart_suite(df, profile["schema"])
    return res


class ValidateRulesRequest(BaseModel):
    rules: List[Dict[str, Any]]
    use_cleaned: Optional[bool] = False


@app.post("/api/rules/validate")
def validate_rules(req: ValidateRulesRequest):
    target_df = SESSION_DATA["cleaned_df"] if (req.use_cleaned and SESSION_DATA["cleaned_df"] is not None) else SESSION_DATA["df"]
    if target_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    outcome = ge_engine.run_suite(target_df, req.rules)
    SESSION_DATA["last_validation"] = outcome
    return outcome


class RemediateRequest(BaseModel):
    impute_missing: bool = True
    drop_duplicates: bool = True
    strip_whitespace: bool = True
    fix_negative_values: bool = True
    clip_outliers: bool = True


@app.post("/api/remediate")
def remediate_dataset(req: RemediateRequest):
    df = SESSION_DATA["df"]
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    cleaned_df, summary = remediator.clean_dataset(
        df,
        impute_missing=req.impute_missing,
        drop_duplicates=req.drop_duplicates,
        strip_whitespace=req.strip_whitespace,
        fix_negative_values=req.fix_negative_values,
        clip_outliers=req.clip_outliers
    )

    SESSION_DATA["cleaned_df"] = cleaned_df
    # Recalculate profile on cleaned dataset
    cleaned_profile = calculate_dataset_profile(cleaned_df)

    return {
        "summary": summary,
        "cleaned_profile": cleaned_profile
    }


@app.get("/api/export/dataset")
def export_dataset(version: str = "cleaned"):
    df = SESSION_DATA["cleaned_df"] if (version == "cleaned" and SESSION_DATA["cleaned_df"] is not None) else SESSION_DATA["df"]
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset to export.")

    csv_data = df.to_csv(index=False)
    prefix = "cleaned_" if version == "cleaned" else "original_"
    filename = prefix + SESSION_DATA.get("filename", "dataset.csv")
    if not filename.endswith(".csv"):
        filename += ".csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


class SuiteExportRequest(BaseModel):
    suite_name: str = "dataqualai_suite"
    expectations: List[Dict[str, Any]]


@app.post("/api/export/suite-json")
def export_suite_json(req: SuiteExportRequest):
    json_str = ge_engine.export_suite_json(req.suite_name, req.expectations)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={req.suite_name}.json"}
    )


@app.post("/api/export/script-py")
def export_script_py(req: SuiteExportRequest):
    script_str = ge_engine.export_python_script(req.suite_name, req.expectations, SESSION_DATA.get("filename", "dataset.csv"))
    return Response(
        content=script_str,
        media_type="text/x-python",
        headers={"Content-Disposition": f"attachment; filename={req.suite_name}_validator.py"}
    )


@app.get("/api/export/report-pdf")
def export_report_pdf():
    profile = SESSION_DATA["profile"]
    if profile is None:
        raise HTTPException(status_code=400, detail="No diagnostic profile available to generate report.")

    pdf_bytes = remediator.generate_pdf_report(profile, SESSION_DATA.get("last_validation"))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=DataQualAI_Audit_Report.pdf"}
    )


@app.get("/api/export/report-md")
def export_report_md():
    profile = SESSION_DATA["profile"]
    if profile is None:
        raise HTTPException(status_code=400, detail="No diagnostic profile available to generate report.")

    md_str = remediator.generate_markdown_report(profile, SESSION_DATA.get("last_validation"))
    return Response(
        content=md_str,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=DataQualAI_Audit_Report.md"}
    )


# Mount static frontend build if present
FRONTEND_DIST = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
