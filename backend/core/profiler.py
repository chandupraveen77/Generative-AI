"""
profiler.py - Automated Multi-Dimensional Dataset Diagnosis Engine for DataQualAI.
Implements theoretical dimensions:
1. Completeness
2. Uniqueness
3. Validity & Types
4. Range & Distribution (IQR + Z-Score)
5. Consistency & Categorical Health
6. Target/Label Health (Class Imbalance & Conflicting Labels)
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


def calculate_dataset_profile(df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
    n_rows, n_cols = df.shape
    total_cells = n_rows * n_cols

    if n_rows == 0:
        return {"error": "Dataset is empty"}

    # Memory usage in MB
    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)

    findings: List[Dict[str, Any]] = []
    finding_counter = 1

    # -------------------------------------------------------------
    # 1. DIMENSION: COMPLETENESS
    # -------------------------------------------------------------
    missing_per_col = df.isnull().sum().to_dict()
    missing_percent_per_col = {col: round((cnt / n_rows) * 100, 2) for col, cnt in missing_per_col.items()}
    total_missing_cells = int(df.isnull().sum().sum())
    total_missing_percent = round((total_missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0

    # Also detect blank string values in object columns
    blank_str_counts = {}
    for col in df.select_dtypes(include=["object"]).columns:
        blanks = int((df[col].astype(str).str.strip() == "").sum())
        if blanks > 0:
            blank_str_counts[col] = blanks
            if col not in missing_per_col or missing_per_col[col] == 0:
                findings.append({
                    "id": f"FIND-{finding_counter:03d}",
                    "dimension": "Completeness",
                    "column": col,
                    "severity": "HIGH" if (blanks / n_rows) > 0.1 else "MEDIUM",
                    "title": f"Blank String Values Detected in '{col}'",
                    "description": f"Column '{col}' has {blanks} blank/whitespace-only values ({(blanks / n_rows)*100:.1f}%). These behave like hidden nulls.",
                    "affected_count": blanks,
                    "affected_percent": round((blanks / n_rows) * 100, 2),
                    "recommended_action": "Convert blank strings to nulls and apply imputation or drop affected records."
                })
                finding_counter += 1

    # Check for missing patterns
    missing_cols = [c for c, cnt in missing_per_col.items() if cnt > 0]
    for col in missing_cols:
        cnt = missing_per_col[col]
        pct = missing_percent_per_col[col]
        severity = "HIGH" if pct > 20 else ("MEDIUM" if pct > 5 else "LOW")
        findings.append({
            "id": f"FIND-{finding_counter:03d}",
            "dimension": "Completeness",
            "column": col,
            "severity": severity,
            "title": f"Missing Values in '{col}'",
            "description": f"Column '{col}' has {cnt} missing values ({pct}% of records).",
            "affected_count": cnt,
            "affected_percent": pct,
            "recommended_action": f"Impute with {'median' if pd.api.types.is_numeric_dtype(df[col]) else 'mode'} or filter rows."
        })
        finding_counter += 1

    # Completely empty rows
    empty_rows_count = int(df.isnull().all(axis=1).sum())
    if empty_rows_count > 0:
        findings.append({
            "id": f"FIND-{finding_counter:03d}",
            "dimension": "Completeness",
            "column": "Dataset-level",
            "severity": "HIGH",
            "title": f"Completely Empty Rows ({empty_rows_count})",
            "description": f"The dataset contains {empty_rows_count} rows that are completely devoid of data.",
            "affected_count": empty_rows_count,
            "affected_percent": round((empty_rows_count / n_rows) * 100, 2),
            "recommended_action": "Immediately drop all completely empty rows."
        })
        finding_counter += 1

    completeness_score = max(0.0, round(100.0 - (total_missing_percent * 2.5), 1))

    # -------------------------------------------------------------
    # 2. DIMENSION: UNIQUENESS
    # -------------------------------------------------------------
    duplicate_rows_count = int(df.duplicated().sum())
    duplicate_rows_percent = round((duplicate_rows_count / n_rows) * 100, 2)

    if duplicate_rows_count > 0:
        findings.append({
            "id": f"FIND-{finding_counter:03d}",
            "dimension": "Uniqueness",
            "column": "Dataset-level",
            "severity": "HIGH" if duplicate_rows_percent > 1 else "MEDIUM",
            "title": f"Exact Duplicate Rows ({duplicate_rows_count})",
            "description": f"Found {duplicate_rows_count} exact duplicate records ({duplicate_rows_percent}%). Redundant observations bias machine learning models and distort analytics.",
            "affected_count": duplicate_rows_count,
            "affected_percent": duplicate_rows_percent,
            "recommended_action": "De-duplicate dataset keeping the first occurrence."
        })
        finding_counter += 1

    # Detect potential primary key (e.g., ID, CustomerID, id)
    primary_key_candidate = None
    pk_violations = 0
    for col in df.columns:
        if col.lower() in ["id", "customerid", "customer_id", "userid", "user_id", "uuid", "guid"]:
            primary_key_candidate = col
            pk_violations = int(df[col].duplicated().sum())
            if pk_violations > 0:
                findings.append({
                    "id": f"FIND-{finding_counter:03d}",
                    "dimension": "Uniqueness",
                    "column": col,
                    "severity": "HIGH",
                    "title": f"Primary Key Uniqueness Violation in '{col}'",
                    "description": f"Primary key column '{col}' has {pk_violations} duplicate values. Primary keys must be strictly unique.",
                    "affected_count": pk_violations,
                    "affected_percent": round((pk_violations / n_rows) * 100, 2),
                    "recommended_action": f"Deduplicate by '{col}' or resolve upstream ID generator collisions."
                })
                finding_counter += 1
            break

    uniqueness_penalty = (duplicate_rows_percent * 3.0) + ((pk_violations / n_rows) * 50.0 if primary_key_candidate else 0)
    uniqueness_score = max(0.0, round(100.0 - uniqueness_penalty, 1))

    # -------------------------------------------------------------
    # 3. DIMENSION: VALIDITY & TYPES
    # -------------------------------------------------------------
    type_mismatches = {}
    format_anomalies = {}
    validity_penalty = 0

    for col in df.columns:
        # Check if numeric column is masquerading as object due to non-numeric strings
        if df[col].dtype == "object":
            # Attempt numeric conversion
            numeric_converted = pd.to_numeric(df[col].astype(str).str.strip(), errors="coerce")
            valid_num_count = numeric_converted.notnull().sum()
            null_count = df[col].isnull().sum()
            # If >70% of non-null entries parse as numeric but some fail, we have a type corruption!
            non_null_total = n_rows - null_count
            if non_null_total > 0 and (valid_num_count / non_null_total) > 0.7 and (valid_num_count < non_null_total):
                corrupted_count = int(non_null_total - valid_num_count)
                type_mismatches[col] = corrupted_count
                validity_penalty += 15
                findings.append({
                    "id": f"FIND-{finding_counter:03d}",
                    "dimension": "Validity",
                    "column": col,
                    "severity": "HIGH",
                    "title": f"Mixed Data Types in Numeric Column '{col}'",
                    "description": f"Column '{col}' is classified as text/object, but {valid_num_count} of {non_null_total} values are numbers. {corrupted_count} values contain invalid non-numeric characters.",
                    "affected_count": corrupted_count,
                    "affected_percent": round((corrupted_count / n_rows) * 100, 2),
                    "recommended_action": f"Coerce '{col}' to numeric and impute or cleanse corrupted text representations."
                })
                finding_counter += 1

        # Check for invalid negative values where domain expects non-negative
        if pd.api.types.is_numeric_dtype(df[col]):
            col_lower = col.lower()
            if any(term in col_lower for term in ["age", "tenure", "charges", "price", "bmi", "glucose", "salary", "count"]):
                negative_count = int((df[col] < 0).sum())
                if negative_count > 0:
                    validity_penalty += 10
                    findings.append({
                        "id": f"FIND-{finding_counter:03d}",
                        "dimension": "Validity",
                        "column": col,
                        "severity": "HIGH",
                        "title": f"Negative Domain Violation in '{col}'",
                        "description": f"Column '{col}' represents a strictly non-negative entity, but contains {negative_count} negative entries (min: {df[col].min()}).",
                        "affected_count": negative_count,
                        "affected_percent": round((negative_count / n_rows) * 100, 2),
                        "recommended_action": f"Filter out or replace negative values in '{col}'."
                    })
                    finding_counter += 1

    validity_score = max(0.0, round(100.0 - validity_penalty, 1))

    # -------------------------------------------------------------
    # 4. DIMENSION: RANGE & DISTRIBUTION (IQR + Z-Score)
    # -------------------------------------------------------------
    distribution_stats = {}
    range_penalty = 0

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 5:
            continue

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        iqr_outliers = series[(series < lower_bound) | (series > upper_bound)]
        iqr_outlier_count = int(len(iqr_outliers))

        # Z-score outliers (|z| > 3)
        mean_val = float(series.mean())
        std_val = float(series.std()) if series.std() > 0 else 1e-6
        z_scores = np.abs((series - mean_val) / std_val)
        z_outlier_count = int((z_scores > 3.0).sum())

        skewness = float(series.skew()) if len(series) > 2 else 0.0

        distribution_stats[col] = {
            "mean": round(mean_val, 2),
            "std": round(std_val, 2),
            "min": round(float(series.min()), 2),
            "q25": round(q1, 2),
            "median": round(float(series.median()), 2),
            "q75": round(q3, 2),
            "max": round(float(series.max()), 2),
            "iqr": round(iqr, 2),
            "skewness": round(skewness, 2),
            "iqr_outlier_count": iqr_outlier_count,
            "iqr_outlier_percent": round((iqr_outlier_count / len(series)) * 100, 2),
            "z_outlier_count": z_outlier_count,
            "z_outlier_percent": round((z_outlier_count / len(series)) * 100, 2)
        }

        if z_outlier_count > 0:
            pct = round((z_outlier_count / len(series)) * 100, 2)
            severity = "HIGH" if (pct > 5 or (series.max() > mean_val + 5 * std_val)) else "MEDIUM"
            range_penalty += (4 if severity == "HIGH" else 2)
            findings.append({
                "id": f"FIND-{finding_counter:03d}",
                "dimension": "Range & Distribution",
                "column": col,
                "severity": severity,
                "title": f"Statistical Outliers in '{col}' (|Z| > 3)",
                "description": f"Detected {z_outlier_count} extreme statistical outliers ({pct}%). Max value is {series.max():.2f} (Domain IQR bounds: [{lower_bound:.2f}, {upper_bound:.2f}]).",
                "affected_count": z_outlier_count,
                "affected_percent": pct,
                "recommended_action": f"Review extreme spikes in '{col}', consider winsorization or boundary clipping."
            })
            finding_counter += 1

    range_score = max(0.0, round(100.0 - min(60, range_penalty * 3), 1))

    # -------------------------------------------------------------
    # 5. DIMENSION: CONSISTENCY & CATEGORICAL HEALTH
    # -------------------------------------------------------------
    consistency_penalty = 0
    categorical_stats = {}

    for col in df.select_dtypes(include=["object"]).columns:
        series = df[col].dropna().astype(str)
        if len(series) == 0:
            continue

        # Whitespace anomalies
        whitespace_count = int((series.str.startswith(" ") | series.str.endswith(" ")).sum())
        if whitespace_count > 0:
            pct = round((whitespace_count / len(series)) * 100, 2)
            consistency_penalty += 8
            findings.append({
                "id": f"FIND-{finding_counter:03d}",
                "dimension": "Consistency",
                "column": col,
                "severity": "MEDIUM",
                "title": f"Inconsistent Whitespace in '{col}'",
                "description": f"Found {whitespace_count} values ({pct}%) with leading or trailing whitespace. For example: \"{series[series.str.startswith(' ') | series.str.endswith(' ')].iloc[0]}\".",
                "affected_count": whitespace_count,
                "affected_percent": pct,
                "recommended_action": f"Apply `.str.strip()` to sanitize all strings in '{col}'."
            })
            finding_counter += 1

        # Case inconsistencies: e.g. "FEMALE", "Female", "female"
        unique_raw = set(series.unique())
        unique_lower = {v.lower().strip(): v for v in unique_raw}
        if len(unique_raw) > len(unique_lower):
            diff = len(unique_raw) - len(unique_lower)
            consistency_penalty += 10
            findings.append({
                "id": f"FIND-{finding_counter:03d}",
                "dimension": "Consistency",
                "column": col,
                "severity": "MEDIUM",
                "title": f"Case Casing Variation in '{col}'",
                "description": f"Column '{col}' has {diff} duplicate semantic categories due to mixed upper/lowercase representations.",
                "affected_count": diff,
                "affected_percent": round((diff / len(unique_raw)) * 100, 2),
                "recommended_action": f"Standardize text casing with `.str.title()` or `.str.lower()`."
            })
            finding_counter += 1

        # Rare categories (< 1% frequency)
        val_counts = series.str.strip().value_counts()
        rare_classes = val_counts[val_counts < max(2, int(0.01 * len(series)))]
        if len(rare_classes) > 0 and len(val_counts) < 30: # only for nominal categorical
            rare_samples = list(rare_classes.index[:3])
            findings.append({
                "id": f"FIND-{finding_counter:03d}",
                "dimension": "Consistency",
                "column": col,
                "severity": "LOW",
                "title": f"Rare/Unexpected Categories in '{col}'",
                "description": f"Detected {len(rare_classes)} rare categories with frequency <1% ({', '.join(repr(x) for x in rare_samples)}). May indicate typos or data leakage.",
                "affected_count": int(rare_classes.sum()),
                "affected_percent": round((rare_classes.sum() / len(series)) * 100, 2),
                "recommended_action": f"Map rare classes into an 'Other' category or verify data entry rules."
            })
            finding_counter += 1

        categorical_stats[col] = {
            "cardinality": int(len(val_counts)),
            "top_categories": val_counts.head(5).to_dict()
        }

    consistency_score = max(0.0, round(100.0 - consistency_penalty, 1))

    # -------------------------------------------------------------
    # 6. DIMENSION: TARGET / LABEL HEALTH
    # -------------------------------------------------------------
    target_stats = {}
    target_penalty = 0

    # Auto-detect target column if not supplied
    detected_target = target_column
    if not detected_target:
        candidate_names = ["churn", "stroke", "target", "label", "is_fraud", "class", "status", "default"]
        for c in df.columns:
            if c.lower() in candidate_names:
                detected_target = c
                break

    if detected_target and detected_target in df.columns:
        target_series = df[detected_target].dropna()
        target_counts = target_series.value_counts().to_dict()
        total_target_obs = len(target_series)

        # Imbalance check
        if len(target_counts) >= 2:
            max_class_cnt = max(target_counts.values())
            min_class_cnt = min(target_counts.values())
            imbalance_ratio = round(max_class_cnt / max(1, min_class_cnt), 2)
            minority_pct = round((min_class_cnt / total_target_obs) * 100, 2)

            # Shannon Entropy
            probs = [cnt / total_target_obs for cnt in target_counts.values()]
            entropy = -sum(p * math.log2(p) for p in probs if p > 0)
            gini = 1.0 - sum(p ** 2 for p in probs)

            target_stats = {
                "target_column": detected_target,
                "class_counts": {str(k): int(v) for k, v in target_counts.items()},
                "imbalance_ratio": imbalance_ratio,
                "minority_percentage": minority_pct,
                "entropy": round(entropy, 3),
                "gini_impurity": round(gini, 3)
            }

            if minority_pct < 10.0:
                severity = "HIGH" if minority_pct < 5.0 else "MEDIUM"
                target_penalty += (25 if severity == "HIGH" else 15)
                findings.append({
                    "id": f"FIND-{finding_counter:03d}",
                    "dimension": "Target Health",
                    "column": detected_target,
                    "severity": severity,
                    "title": f"Severe Class Imbalance in '{detected_target}' ({minority_pct}%)",
                    "description": f"Minority class accounts for only {minority_pct}% ({min_class_cnt} of {total_target_obs} samples). Severe imbalance (ratio {imbalance_ratio}:1) leads to misleading ML performance and biased decision thresholds.",
                    "affected_count": min_class_cnt,
                    "affected_percent": minority_pct,
                    "recommended_action": "Apply SMOTE, class weighting, or balanced resampling techniques."
                })
                finding_counter += 1

            # Detect potential label noise: Duplicate feature sets with different target labels
            feature_cols = [c for c in df.columns if c != detected_target]
            if len(feature_cols) > 0:
                subset_dup = df[df.duplicated(subset=feature_cols, keep=False)]
                if len(subset_dup) > 0:
                    conflicting_count = 0
                    grouped = subset_dup.groupby(feature_cols)[detected_target].nunique()
                    conflicts = grouped[grouped > 1]
                    if len(conflicts) > 0:
                        conflicting_count = int(conflicts.sum())
                        target_penalty += 15
                        findings.append({
                            "id": f"FIND-{finding_counter:03d}",
                            "dimension": "Target Health",
                            "column": detected_target,
                            "severity": "HIGH",
                            "title": f"Conflicting Target Labels for Identical Features",
                            "description": f"Detected {conflicting_count} instances where identical feature rows have contradictory target labels in '{detected_target}'. Strong indicator of label noise (Cleanlab/Relabeler principle).",
                            "affected_count": conflicting_count,
                            "affected_percent": round((conflicting_count / n_rows) * 100, 2),
                            "recommended_action": "Audit data collection source to resolve contradictory labels."
                        })
                        finding_counter += 1
    else:
        target_stats = {"status": "No specific target column detected (Unsupervised tabular mode)"}

    target_score = max(0.0, round(100.0 - target_penalty, 1))

    # -------------------------------------------------------------
    # AGGREGATE DIAGNOSIS QUALITY SCORE
    # -------------------------------------------------------------
    # Dimension weights
    weights = {
        "completeness": 0.22,
        "uniqueness": 0.18,
        "validity": 0.20,
        "range_distribution": 0.15,
        "consistency": 0.13,
        "target_health": 0.12
    }

    overall_score = round(
        completeness_score * weights["completeness"] +
        uniqueness_score * weights["uniqueness"] +
        validity_score * weights["validity"] +
        range_score * weights["range_distribution"] +
        consistency_score * weights["consistency"] +
        target_score * weights["target_health"],
        1
    )

    if overall_score >= 90:
        grade = "A (Excellent Quality)"
        grade_badge = "success"
    elif overall_score >= 75:
        grade = "B (Good Quality with Minor Issues)"
        grade_badge = "info"
    elif overall_score >= 60:
        grade = "C (Fair - Moderate Anomalies Present)"
        grade_badge = "warning"
    else:
        grade = "D (Poor Quality - Remediation Required)"
        grade_badge = "danger"

    # Previews: First 15 rows formatted cleanly
    preview_df = df.head(15).copy()
    # Replace NaN with None for clean JSON serialization
    preview_rows = preview_df.replace({np.nan: None}).to_dict(orient="records")

    # Column metadata summary
    schema_info = []
    for col in df.columns:
        dtype_str = str(df[col].dtype)
        unique_cnt = int(df[col].nunique(dropna=True))
        null_cnt = int(df[col].isnull().sum())
        schema_info.append({
            "name": col,
            "type": dtype_str,
            "null_count": null_cnt,
            "null_percentage": round((null_cnt / n_rows) * 100, 1),
            "unique_count": unique_cnt,
            "is_numeric": bool(pd.api.types.is_numeric_dtype(df[col])),
            "sample_values": [str(x) for x in df[col].dropna().unique()[:3]]
        })

    return {
        "dataset_summary": {
            "total_rows": n_rows,
            "total_columns": n_cols,
            "total_cells": total_cells,
            "memory_usage_mb": memory_mb,
            "duplicate_rows": duplicate_rows_count,
            "duplicate_percent": duplicate_rows_percent,
            "total_missing_cells": total_missing_cells,
            "total_missing_percent": total_missing_percent,
            "primary_key_candidate": primary_key_candidate
        },
        "quality_scores": {
            "overall": overall_score,
            "grade": grade,
            "grade_badge": grade_badge,
            "dimensions": {
                "completeness": {"score": completeness_score, "weight": weights["completeness"]},
                "uniqueness": {"score": uniqueness_score, "weight": weights["uniqueness"]},
                "validity": {"score": validity_score, "weight": weights["validity"]},
                "range_distribution": {"score": range_score, "weight": weights["range_distribution"]},
                "consistency": {"score": consistency_score, "weight": weights["consistency"]},
                "target_health": {"score": target_score, "weight": weights["target_health"]}
            }
        },
        "findings": findings,
        "schema": schema_info,
        "distribution_stats": distribution_stats,
        "categorical_stats": categorical_stats,
        "target_stats": target_stats,
        "preview_rows": preview_rows
    }
