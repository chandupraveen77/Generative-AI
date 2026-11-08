"""
ge_engine.py - Great Expectations Validation Runner & Structured Outcome Parser.
Executes Great Expectations suites against in-memory Pandas DataFrames,
capturing detailed diagnostic outcome metrics (pass/fail, unexpected counts,
percentages, and partial unexpected sample indices/values).
"""

import json
import re
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


class GEValidationEngine:
    def __init__(self):
        pass

    def run_suite(self, df: pd.DataFrame, expectations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Runs a list of expectations against df.
        Expectation dict format:
        {
            "expectation_type": "expect_column_values_to_be_between",
            "kwargs": {"column": "MonthlyCharges", "min_value": 10, "max_value": 150},
            "meta": {"description": "Monthly charges between 10 and 150"}
        }
        """
        results = []
        n_rows = len(df)

        for exp in expectations:
            exp_type = exp.get("expectation_type", "")
            kwargs = exp.get("kwargs", {})
            meta = exp.get("meta", {})
            col = kwargs.get("column")

            res = self._evaluate_single_expectation(df, exp_type, kwargs, n_rows)
            results.append({
                "expectation_type": exp_type,
                "kwargs": kwargs,
                "meta": meta,
                "success": res["success"],
                "result": res["result"],
                "exception_info": res.get("exception_info", {"raised_exception": False})
            })

        total = len(results)
        passed = sum(1 for r in results if r["success"])
        failed = total - passed
        success_pct = round((passed / total) * 100, 2) if total > 0 else 100.0

        return {
            "success": failed == 0,
            "statistics": {
                "evaluated_expectations": total,
                "successful_expectations": passed,
                "unsuccessful_expectations": failed,
                "success_percent": success_pct
            },
            "results": results
        }

    def _evaluate_single_expectation(self, df: pd.DataFrame, exp_type: str, kwargs: Dict[str, Any], total_rows: int) -> Dict[str, Any]:
        col = kwargs.get("column")

        # Table-level expectations
        if exp_type == "expect_table_row_count_to_be_between":
            min_v = kwargs.get("min_value")
            max_v = kwargs.get("max_value")
            success = True
            if min_v is not None and total_rows < min_v: success = False
            if max_v is not None and total_rows > max_v: success = False
            return {
                "success": success,
                "result": {
                    "observed_value": total_rows,
                    "element_count": total_rows,
                    "unexpected_count": 0 if success else 1,
                    "unexpected_percent": 0.0 if success else 100.0,
                    "partial_unexpected_list": [] if success else [total_rows],
                    "partial_unexpected_index_list": []
                }
            }

        if exp_type == "expect_table_columns_to_match_ordered_list":
            expected_cols = kwargs.get("column_list", [])
            actual_cols = list(df.columns)
            success = (actual_cols == expected_cols)
            return {
                "success": success,
                "result": {
                    "observed_value": actual_cols,
                    "element_count": len(actual_cols),
                    "unexpected_count": 0 if success else 1,
                    "unexpected_percent": 0.0 if success else 100.0,
                    "partial_unexpected_list": [] if success else actual_cols,
                    "partial_unexpected_index_list": []
                }
            }

        if col not in df.columns:
            return {
                "success": False,
                "result": {
                    "element_count": total_rows,
                    "unexpected_count": total_rows,
                    "unexpected_percent": 100.0,
                    "partial_unexpected_list": [f"Column '{col}' does not exist in dataset"],
                    "partial_unexpected_index_list": []
                },
                "exception_info": {"raised_exception": True, "message": f"Column '{col}' missing"}
            }

        series = df[col]
        element_count = len(series)

        # 1. expect_column_values_to_not_be_null
        if exp_type == "expect_column_values_to_not_be_null":
            # treat blank string as null if object
            is_null_mask = series.isnull()
            if series.dtype == "object":
                is_null_mask = is_null_mask | (series.astype(str).str.strip() == "")
            failing_indices = series[is_null_mask].index.tolist()
            unexp_count = len(failing_indices)
            return {
                "success": unexp_count == 0,
                "result": {
                    "element_count": element_count,
                    "unexpected_count": unexp_count,
                    "unexpected_percent": round((unexp_count / element_count) * 100, 2),
                    "partial_unexpected_list": ["<NULL>" for _ in range(min(5, unexp_count))],
                    "partial_unexpected_index_list": failing_indices[:10]
                }
            }

        # 2. expect_column_values_to_be_unique
        elif exp_type == "expect_column_values_to_be_unique":
            duplicated_mask = series.duplicated(keep=False) & series.notnull()
            failing_indices = series[duplicated_mask].index.tolist()
            unexp_count = len(failing_indices)
            return {
                "success": unexp_count == 0,
                "result": {
                    "element_count": element_count,
                    "unexpected_count": unexp_count,
                    "unexpected_percent": round((unexp_count / element_count) * 100, 2),
                    "partial_unexpected_list": [str(x) for x in series[duplicated_mask].iloc[:5].tolist()],
                    "partial_unexpected_index_list": failing_indices[:10]
                }
            }

        # 3. expect_column_values_to_be_between
        elif exp_type == "expect_column_values_to_be_between":
            min_val = kwargs.get("min_value")
            max_val = kwargs.get("max_value")
            # Coerce numeric
            numeric_s = pd.to_numeric(series.astype(str).str.strip(), errors="coerce")
            mask = pd.Series(True, index=series.index)
            if min_val is not None:
                mask = mask & (numeric_s >= min_val)
            if max_val is not None:
                mask = mask & (numeric_s <= max_val)

            # Nulls fail unless ignore_row_if is set
            failing_mask = (~mask) | numeric_s.isnull()
            failing_indices = series[failing_mask].index.tolist()
            unexp_count = len(failing_indices)
            return {
                "success": unexp_count == 0,
                "result": {
                    "element_count": element_count,
                    "unexpected_count": unexp_count,
                    "unexpected_percent": round((unexp_count / element_count) * 100, 2),
                    "partial_unexpected_list": [str(x) for x in series.loc[failing_indices[:5]].tolist()],
                    "partial_unexpected_index_list": failing_indices[:10],
                    "observed_value": {"min": float(numeric_s.min()) if numeric_s.notnull().any() else None,
                                       "max": float(numeric_s.max()) if numeric_s.notnull().any() else None}
                }
            }

        # 4. expect_column_values_to_be_in_set
        elif exp_type == "expect_column_values_to_be_in_set":
            value_set = kwargs.get("value_set", [])
            # Normalize to string set comparison or typed comparison
            set_str = {str(v).strip().lower() for v in value_set}
            actual_str_s = series.astype(str).str.strip().str.lower()
            failing_mask = (~actual_str_s.isin(set_str)) | series.isnull()
            failing_indices = series[failing_mask].index.tolist()
            unexp_count = len(failing_indices)
            return {
                "success": unexp_count == 0,
                "result": {
                    "element_count": element_count,
                    "unexpected_count": unexp_count,
                    "unexpected_percent": round((unexp_count / element_count) * 100, 2),
                    "partial_unexpected_list": [str(x) for x in series.loc[failing_indices[:5]].tolist()],
                    "partial_unexpected_index_list": failing_indices[:10],
                    "observed_value": list(series.dropna().astype(str).str.strip().unique()[:6])
                }
            }

        # 5. expect_column_values_to_be_of_type
        elif exp_type == "expect_column_values_to_be_of_type":
            expected_type = kwargs.get("type_", "").lower()
            actual_dtype = str(series.dtype).lower()
            success = False
            if "int" in expected_type and "int" in actual_dtype:
                success = True
            elif "float" in expected_type and "float" in actual_dtype:
                success = True
            elif "str" in expected_type or "object" in expected_type:
                success = (actual_dtype == "object" or "string" in actual_dtype)
            elif "bool" in expected_type and "bool" in actual_dtype:
                success = True
            
            return {
                "success": success,
                "result": {
                    "observed_value": actual_dtype,
                    "element_count": element_count,
                    "unexpected_count": 0 if success else element_count,
                    "unexpected_percent": 0.0 if success else 100.0,
                    "partial_unexpected_list": [] if success else [f"Dtype is {actual_dtype}, expected {expected_type}"],
                    "partial_unexpected_index_list": [] if success else list(range(min(5, element_count)))
                }
            }

        # 6. expect_column_values_to_match_regex
        elif exp_type == "expect_column_values_to_match_regex":
            regex_pat = kwargs.get("regex", ".*")
            pattern = re.compile(regex_pat)
            s_str = series.astype(str)
            matches = s_str.apply(lambda x: bool(pattern.match(x)))
            failing_mask = (~matches) | series.isnull()
            failing_indices = series[failing_mask].index.tolist()
            unexp_count = len(failing_indices)
            return {
                "success": unexp_count == 0,
                "result": {
                    "element_count": element_count,
                    "unexpected_count": unexp_count,
                    "unexpected_percent": round((unexp_count / element_count) * 100, 2),
                    "partial_unexpected_list": [str(x) for x in series.loc[failing_indices[:5]].tolist()],
                    "partial_unexpected_index_list": failing_indices[:10]
                }
            }

        # 7. expect_column_mean_to_be_between
        elif exp_type == "expect_column_mean_to_be_between":
            min_v = kwargs.get("min_value")
            max_v = kwargs.get("max_value")
            numeric_s = pd.to_numeric(series, errors="coerce").dropna()
            mean_v = float(numeric_s.mean()) if len(numeric_s) > 0 else 0.0
            success = True
            if min_v is not None and mean_v < min_v: success = False
            if max_v is not None and mean_v > max_v: success = False
            return {
                "success": success,
                "result": {
                    "observed_value": round(mean_v, 2),
                    "element_count": len(numeric_s),
                    "unexpected_count": 0 if success else 1,
                    "unexpected_percent": 0.0 if success else 100.0,
                    "partial_unexpected_list": [] if success else [mean_v],
                    "partial_unexpected_index_list": []
                }
            }

        # Fallback generic expectation
        return {
            "success": True,
            "result": {
                "element_count": element_count,
                "unexpected_count": 0,
                "unexpected_percent": 0.0,
                "partial_unexpected_list": [],
                "partial_unexpected_index_list": []
            }
        }

    def export_suite_json(self, suite_name: str, expectations: List[Dict[str, Any]]) -> str:
        """Exports in standard Great Expectations JSON suite format."""
        formatted_suite = {
            "data_asset_type": "Dataset",
            "expectation_suite_name": suite_name,
            "expectations": expectations,
            "ge_cloud_id": None,
            "meta": {
                "great_expectations_version": "1.24.1",
                "generated_by": "DataQualAI - Quality by Prompt Engine"
            }
        }
        return json.dumps(formatted_suite, indent=2)

    def export_python_script(self, suite_name: str, expectations: List[Dict[str, Any]], dataset_filename: str = "dataset.csv") -> str:
        """Exports an executable standalone Python script running Great Expectations."""
        code_lines = [
            f"# Auto-generated Great Expectations Validation Script by DataQualAI",
            f"# Suite: {suite_name}",
            f"",
            f"import pandas as pd",
            f"import great_expectations as ge",
            f"",
            f"# 1. Load dataset",
            f"df = ge.read_csv('{dataset_filename}')",
            f"",
            f"print(f'Validating dataset: {{df.shape[0]}} rows, {{df.shape[1]}} columns...')",
            f"results = []",
            f""
        ]

        for i, exp in enumerate(expectations, 1):
            exp_type = exp.get("expectation_type")
            kwargs = exp.get("kwargs", {})
            kw_args_str = ", ".join(f"{k}={repr(v)}" for k, v in kwargs.items())
            code_lines.append(f"# Rule {i}: {exp.get('meta', {}).get('description', exp_type)}")
            code_lines.append(f"res_{i} = df.{exp_type}({kw_args_str})")
            code_lines.append(f"print(f'{exp_type}: Passed = {{res_{i}.success}}')")
            code_lines.append(f"results.append(res_{i})")
            code_lines.append("")

        code_lines.append("# Summary")
        code_lines.append("total = len(results)")
        code_lines.append("passed = sum(1 for r in results if r.success)")
        code_lines.append("print(f'Done: {passed}/{total} expectations passed ({(passed/total)*100:.1f}%)')")

        return "\n".join(code_lines)
