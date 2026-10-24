from pathlib import Path
import json
import warnings
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from data_loader import load_training_data

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ARTIFACTS = ROOT / "artifacts"
REPORTS = ROOT / "reports"
ARTIFACTS.mkdir(exist_ok=True)
REPORTS.mkdir(exist_ok=True)

CAT = ["Protein_1", "Protein_2"]
NUM = ["Protein_1_Ratio", "Protein_2_Ratio", "Feed", "SS", "MC"]
FEATURES = CAT + NUM

def build_pipeline(model_name):
    prep = ColumnTransformer([
        ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")),
                          ("onehot", OneHotEncoder(handle_unknown="ignore"))]), CAT),
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), NUM),
    ])
    if model_name == "ExtraTrees":
        reg = ExtraTreesRegressor(n_estimators=400, min_samples_leaf=2, random_state=42)
    elif model_name == "RandomForest":
        reg = RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42)
    else:
        prep = ColumnTransformer([
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")),
                              ("onehot", OneHotEncoder(handle_unknown="ignore"))]), CAT),
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")),
                              ("scale", StandardScaler())]), NUM),
        ])
        reg = Ridge(alpha=3.0)
    return Pipeline([("preprocess", prep), ("model", reg)])

def main():
    df = load_training_data(DATA)
    # Keep one model per metric because values/units differ between metrics.
    summary = []
    all_models = {}
    metric_counts = {}
    for metric, part in df.groupby("Metric"):
        part = part.dropna(subset=FEATURES + ["Value"]).copy()
        n_groups = part["ConditionGroup"].nunique()
        metric_counts[metric] = {"rows": int(len(part)), "unique_conditions": int(n_groups)}
        if len(part) < 12 or n_groups < 4:
            summary.append({"metric": metric, "status": "insufficient_data", "rows": int(len(part)), "unique_conditions": int(n_groups)})
            continue

        X = part[FEATURES]
        y = part["Value"].astype(float)
        groups = part["ConditionGroup"]
        # Group split: no replicates from a condition can leak across train and test.
        splitter = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
        train_idx, test_idx = next(splitter.split(X, y, groups))
        candidates = []
        for name in ["ExtraTrees", "RandomForest", "Ridge"]:
            model = build_pipeline(name)
            model.fit(X.iloc[train_idx], y.iloc[train_idx])
            pred = model.predict(X.iloc[test_idx])
            mae = mean_absolute_error(y.iloc[test_idx], pred)
            rmse = float(np.sqrt(mean_squared_error(y.iloc[test_idx], pred)))
            r2 = r2_score(y.iloc[test_idx], pred) if len(test_idx) > 1 else float("nan")
            candidates.append((mae, name, {"MAE": float(mae), "RMSE": rmse, "R2": float(r2), "test_rows": int(len(test_idx)), "test_conditions": int(groups.iloc[test_idx].nunique())}))
        candidates.sort(key=lambda x: x[0])
        best_name = candidates[0][1]
        best_metrics = candidates[0][2]
        # Refit selected estimator on all available rows for inference.
        final_model = build_pipeline(best_name)
        final_model.fit(X, y)
        artifact_path = ARTIFACTS / f"{safe_name(metric)}.joblib"
        joblib.dump({"model": final_model, "metric": metric, "features": FEATURES, "best_model": best_name}, artifact_path)
        all_models[metric] = {"artifact": str(artifact_path.relative_to(ROOT)), "best_model": best_name, "validation": best_metrics,
                              "comparisons": {name: metrics for _, name, metrics in candidates},
                              "rows": int(len(part)), "unique_conditions": int(n_groups)}
        summary.append({"metric": metric, "status": "trained", "best_model": best_name, "rows": int(len(part)), "unique_conditions": int(n_groups), **best_metrics})
    (ARTIFACTS / "model_manifest.json").write_text(json.dumps(all_models, indent=2), encoding="utf-8")
    (REPORTS / "evaluation_report.json").write_text(json.dumps({"split_method": "GroupShuffleSplit by formulation/process condition", "metrics": summary, "data_counts": metric_counts,
         "important_limitations": [
            "Material is excluded from model features because training data has Material=Extrudate while candidates are labelled Plant_Poultry_Matrix.",
            "Predictions for a poultry product are domain-transfer hypotheses and are not validated chicken-keema measurements.",
            "Ratios and process conditions outside training support are extrapolations and must be flagged.",
            "Holdout scores from one grouped split are preliminary; use repeated grouped cross-validation and physical validation before claims."
         ]}, indent=2), encoding="utf-8")
    print(f"Training data rows: {len(df)}")
    print(f"Metrics trained: {len(all_models)}")
    print(f"Report: {REPORTS / 'evaluation_report.json'}")
    for metric, item in all_models.items():
        print(f"{metric}: {item['best_model']} | MAE={item['validation']['MAE']:.4g} | R2={item['validation']['R2']:.3f} | conditions={item['unique_conditions']}")

def safe_name(name):
    return "".join(c.lower() if c.isalnum() else "_" for c in name).strip("_")

if __name__ == "__main__":
    main()
