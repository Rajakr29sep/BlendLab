from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
from data_loader import load_candidates

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ARTIFACTS = ROOT / "artifacts"
REPORTS = ROOT / "reports"

# Candidate target metrics available from training data. The first version ranks
# texture metrics only; metrics absent from a candidate model are not fabricated.
DEFAULT_TARGETS = {"Hardness": 0.5, "Chewiness": 0.5, "Springiness": 0.5, "Cohesion": 0.5}

def safe_name(name):
    return "".join(c.lower() if c.isalnum() else "_" for c in name).strip("_")

def main():
    candidates = load_candidates(DATA)
    manifest_path = ARTIFACTS / "model_manifest.json"
    if not manifest_path.exists():
        raise SystemExit("No trained models found. Run: python src/train_models.py")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    poultry = candidates[candidates["Material"].eq("Plant_Poultry_Matrix")].copy()
    if poultry.empty:
        raise SystemExit("No Plant_Poultry_Matrix candidates found.")

    # Model features mirror training features. Do not pass Material or any Value/target field.
    features = ["Protein_1", "Protein_2", "Protein_1_Ratio", "Protein_2_Ratio", "Feed", "SS", "MC"]
    rows = []
    for metric, model_info in manifest.items():
        artifact = ROOT / model_info["artifact"]
        bundle = joblib.load(artifact)
        model = bundle["model"]
        X = poultry[features].copy()
        poultry[f"Predicted_{metric}"] = model.predict(X)

    # Convert each predicted metric into a within-candidate percentile distance from median.
    available_targets = [m for m in DEFAULT_TARGETS if f"Predicted_{m}" in poultry.columns]
    if not available_targets:
        raise SystemExit("No supported texture metrics found in trained artifacts.")
    score_components = []
    for metric in available_targets:
        col = f"Predicted_{metric}"
        values = poultry[col].astype(float)
        lo, hi = values.min(), values.max()
        # A median target represents a neutral exploratory target in the candidate pool.
        target = values.median()
        scale = (hi - lo) or 1.0
        component = (values - target).abs() / scale
        score_components.append(component)
    poultry["Texture_Match_Score"] = (100 * (1 - pd.concat(score_components, axis=1).mean(axis=1))).clip(0, 100).round(1)
    poultry = poultry.sort_values(["Texture_Match_Score", "Candidate_ID"], ascending=[False, True])
    poultry["Rank"] = range(1, len(poultry) + 1)
    poultry["Recommendation_Status"] = "EXPLORATORY; PRODUCT TRANSFER UNVALIDATED"
    poultry["Evidence_Note"] = "Inputs are observed Trial 2 conditions; poultry matrix is a proposed target mapping. Predictions require product-specific validation."
    outcols = ["Rank", "Candidate_ID", "Protein_1", "Protein_1_Ratio", "Protein_2", "Protein_2_Ratio",
               "Feed", "SS", "MC", "Texture_Match_Score"] + [f"Predicted_{m}" for m in available_targets] + ["Recommendation_Status", "Evidence_Note"]
    output = poultry[outcols].copy()
    output.to_csv(REPORTS / "candidate_rankings.csv", index=False)
    (REPORTS / "top3_recommendations.json").write_text(json.dumps(output.head(3).replace({np.nan: None}).to_dict(orient="records"), indent=2), encoding="utf-8")
    print(output.head(3).to_string(index=False))
    print(f"\nFull ranking saved to {REPORTS / 'candidate_rankings.csv'}")
    print("Warning: score is a within-candidate exploratory ranking, not a validated sensory quality score.")

if __name__ == "__main__":
    main()
