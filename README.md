# DataQualAI: Intelligent Dataset Diagnosis and Quality Analysis System

[![Great Expectations](https://img.shields.io/badge/Great%20Expectations-v1.24-blue?logo=python)](https://greatexpectations.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**DataQualAI** is a full-stack, production-grade automated dataset profiling, anomaly diagnosis, and LLM-powered Data Quality Rule (DQR) generation and validation system. It bridges the gap between natural language business requirements and rigorous tabular data assertions using [Great Expectations (GE)](https://greatexpectations.io/).

---

## 1. Research & Theoretical Foundation
DataQualAI is built upon key principles established in recent data quality research:
1. **Base Paper:** *"Quality by Prompt: LLM-Powered Transformation of Data Quality Requirements into Great Expectations"* (Abughazala et al., 2026).
   - Translates human-authored natural language requirements into executable Great Expectations (GE) assertions.
   - Supports both cloud LLMs (OpenAI GPT-4o / GPT-4o-mini) and an embedded offline heuristic NLP parser that runs without API keys.
2. **Multi-Dimensional Diagnostics:** Comprehensive profiling across 6 tabular quality dimensions:
   - **Completeness:** Null and whitespace-only cell detection, missing pattern co-occurrence.
   - **Uniqueness:** Exact duplicate observations, primary key collision detection.
   - **Validity & Data Types:** Type corruption (e.g. string values inside numeric columns), negative domain violations.
   - **Range & Distribution:** Interquartile Range (IQR 1.5×) bounds and Z-Score outlier detection ($|z| > 3$).
   - **Consistency & Categorical Health:** Whitespace anomalies, casing variations (e.g. `FEMALE` vs `Female`), rare classes.
   - **Target / Label Health:** Class imbalance ratio, Shannon entropy, and conflicting label noise warnings (inspired by Relabeler / Cleanlab).

---

## 2. Benchmark Presets (Built-In Datasets)
Pre-loaded and accessible instantly with one click:
1. **Telecom Customer Churn (`telco_churn_sample.csv`):**
   - Features: `CustomerID`, `Gender`, `SeniorCitizen`, `Partner`, `Tenure`, `MonthlyCharges`, `TotalCharges`, `Contract`, `Churn`.
   - Injected real-world anomalies: 15 missing values in `TotalCharges`, negative/zero tenure edge cases, unexpected categories in `Contract`.
2. **Healthcare Stroke Prediction (`healthcare_stroke_sample.csv`):**
   - Features: `id`, `gender`, `age`, `hypertension`, `heart_disease`, `avg_glucose_level`, `bmi`, `smoking_status`, `stroke`.
   - Injected real-world anomalies: Missing `bmi` values, out-of-range systolic/glucose spikes ($> 380$), inconsistent categorical casing.

---

## 3. Architecture & Project File Structure
```text
dataqualai/
├── backend/
│   ├── app.py                      # FastAPI entrypoint & unified static SPA server
│   ├── core/
│   │   ├── profiler.py             # 6-Dimensional Pandas & NumPy diagnostic calculations
│   │   ├── ge_engine.py            # Great Expectations runner & structured parser
│   │   ├── llm_rule_generator.py   # Mode A & Mode B "Quality by Prompt" rule engine
│   │   └── remediator.py           # Auto-cleaning pipeline & ReportLab PDF / Markdown generator
│   ├── sample_data/
│   │   ├── telco_churn_sample.csv
│   │   ├── healthcare_stroke_sample.csv
│   │   └── generate_samples.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header, presets loader, file uploader, API key modal
│   │   │   ├── KPICards.jsx        # Overall composite score & 6 dimension breakdown cards
│   │   │   ├── DataPreview.jsx     # First 15 rows preview, missingness chart & summary stats
│   │   │   ├── FindingsTable.jsx   # Itemized diagnostic anomalies with severity filters
│   │   │   ├── RuleStudio.jsx      # Prompt editor, Mode A/B rule generator & GE suite cards
│   │   │   ├── ValidationReport.jsx# Mode C live execution, failure samples & auto-remediation
│   │   │   ├── ExportCenter.jsx    # CSV, GE JSON, Python script, PDF & MD report downloaders
│   │   │   └── Toast.jsx           # Animated status notification alerts
│   │   ├── App.jsx                 # Main application dashboard controller
│   │   ├── main.jsx
│   │   └── index.css
│   ├── dist/                       # Production compiled static bundle
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── README.md
```

---

## 4. Quick Start & Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend development)

### Option A: Unified Full-Stack Server (Recommended)
The frontend is pre-built into `frontend/dist/` and served directly by FastAPI:
```bash
# In backend directory
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

### Option B: Development Mode (Vite + FastAPI Hot Reload)
1. **Start Backend:**
   ```bash
   cd backend
   python -m uvicorn app:app --port 8000 --reload
   ```
2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 5. Supported Great Expectations Assertions
- `expect_column_values_to_not_be_null`
- `expect_column_values_to_be_unique`
- `expect_column_values_to_be_between(min_value, max_value)`
- `expect_column_values_to_be_in_set(value_set)`
- `expect_column_values_to_be_of_type(type_)`
- `expect_table_row_count_to_be_between(min_value, max_value)`
- `expect_column_values_to_match_regex(regex)`
- `expect_column_mean_to_be_between(min_value, max_value)`

---

## 6. Citation
```bibtex
@article{abughazala2026quality,
  title={Quality by Prompt: LLM-Powered Transformation of Data Quality Requirements into Great Expectations},
  author={Abughazala, R. and Collaborators},
  journal={arXiv preprint arXiv:2601.XXXX},
  year={2026}
}
```
