from __future__ import annotations

from pathlib import Path
from typing import Optional, Dict, List, Any

import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = ROOT / "artifacts"
MANIFEST_PATH = ARTIFACTS_DIR / "model_manifest.json"
CANDIDATE_PATH = DATA_DIR / "top10_poultry_candidates_literature_aligned.csv"

FEATURES = [
    "Protein_1", "Protein_2", "Protein_1_Ratio", "Protein_2_Ratio",
    "Feed", "SS", "MC"
]
RANK_METRICS = ["Hardness", "Chewiness", "Springiness", "Cohesion"]
SUPPORTED_MATERIAL = "Plant_Poultry_Matrix"

app = FastAPI(
    title="FormuLab ML Recommendation API",
    description=(
        "Exploratory plant-protein blend predictions. Current poultry mapping "
        "is a proposed target mapping and has not been validated experimentally."
    ),
    version="0.1.0",
)

class TextureTargets(BaseModel):
    hardness: Optional[float] = Field(default=None, description="Target predicted hardness")
    chewiness: Optional[float] = Field(default=None, description="Target predicted chewiness")
    springiness: Optional[float] = Field(default=None, description="Target predicted springiness")
    cohesion: Optional[float] = Field(default=None, description="Target predicted cohesion")

class RecommendationRequest(BaseModel):
    productName: str = Field(default="Plant-based Chicken Keema", min_length=1, max_length=120)
    material: str = Field(default=SUPPORTED_MATERIAL)
    textureTargets: TextureTargets = Field(default_factory=TextureTargets)
    preferredIngredients: List[str] = Field(default_factory=list)
    excludedIngredients: List[str] = Field(default_factory=list)
    topK: int = Field(default=3, ge=1, le=10)

def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        raise RuntimeError("Trained model manifest not found. Run `python src/train_models.py` first.")
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

def load_candidates() -> pd.DataFrame:
    if not CANDIDATE_PATH.exists():
        raise RuntimeError(f"Candidate data not found: {CANDIDATE_PATH.name}")
    df = pd.read_csv(CANDIDATE_PATH)
    required = set(FEATURES + ["Candidate_ID", "Material"])
    missing = required - set(df.columns)
    if missing:
        raise RuntimeError(f"Candidate CSV is missing columns: {sorted(missing)}")
    return df

def load_predictions() -> tuple[pd.DataFrame, dict]:
    manifest = load_manifest()
    candidates = load_candidates()
    missing_features = [c for c in FEATURES if c not in candidates.columns]
    if missing_features:
        raise RuntimeError(f"Candidate data missing features: {missing_features}")

    # Keep this endpoint deliberately limited to the candidate material represented
    # by the generated candidate dataset. A different product label is not data.
    candidates = candidates[candidates["Material"].astype(str).eq(SUPPORTED_MATERIAL)].copy()
    if candidates.empty:
        raise RuntimeError(f"No candidates are available for material {SUPPORTED_MATERIAL}.")

    X = candidates[FEATURES].copy()
    for metric, info in manifest.items():
        artifact_path = ROOT / info["artifact"]
        if not artifact_path.exists():
            continue
        bundle = joblib.load(artifact_path)
        model = bundle["model"] if isinstance(bundle, dict) and "model" in bundle else bundle
        try:
            candidates[f"Predicted_{metric}"] = np.asarray(model.predict(X), dtype=float)
        except Exception as exc:
            raise RuntimeError(f"Could not run the model for metric '{metric}': {exc}") from exc
    return candidates, manifest

def normalized_token(value: str) -> str:
    return " ".join(str(value).strip().lower().replace("_", " ").replace("-", " ").split())

def rank_candidates(
    candidates: pd.DataFrame,
    manifest: dict,
    targets: TextureTargets,
    preferred: List[str],
    excluded: List[str],
) -> tuple[pd.DataFrame, List[str], str]:
    warnings = [
        "Exploratory only: models were trained on extrudate experimental data, not validated chicken-keema products.",
        "Plant_Poultry_Matrix is a proposed target mapping; the candidate conditions have not been experimentally verified as poultry-style formulations.",
        "No cost, nutrition, allergen, sensory-panel, or food-safety predictions are included.",
    ]

    target_map = {
        "Hardness": targets.hardness,
        "Chewiness": targets.chewiness,
        "Springiness": targets.springiness,
        "Cohesion": targets.cohesion,
    }
    active_targets = {
        metric: float(value) for metric, value in target_map.items()
        if value is not None and f"Predicted_{metric}" in candidates.columns
    }

    preferred_norm = [normalized_token(x) for x in preferred if str(x).strip()]
    excluded_norm = [normalized_token(x) for x in excluded if str(x).strip()]

    def ingredient_text(row):
        return f"{row.get('Protein_1', '')} {row.get('Protein_2', '')}".lower()

    if excluded_norm:
        mask = candidates.apply(
            lambda row: not any(token in ingredient_text(row) for token in excluded_norm),
            axis=1
        )
        candidates = candidates.loc[mask].copy()
    if candidates.empty:
        raise HTTPException(
            status_code=422,
            detail="No candidate blends remain after applying excluded ingredients. Remove one or more exclusions."
        )

    if preferred_norm:
        def preference_count(row):
            text = ingredient_text(row)
            return sum(1 for token in preferred_norm if token in text)
        candidates["_preference_matches"] = candidates.apply(preference_count, axis=1)
        warnings.append("Preferred ingredients are used as a tie-breaker, not as a claim of superior nutrition or performance.")

    score_components = []
    if active_targets:
        for metric, target in active_targets.items():
            col = f"Predicted_{metric}"
            values = candidates[col].astype(float)
            # Scale error by the spread of candidate predictions. This avoids mixing
            # units (e.g., hardness vs cohesion) in the score.
            spread = float(values.max() - values.min())
            if spread < 1e-9:
                spread = max(abs(float(values.median())), 1.0)
            score_components.append((values - target).abs() / spread)
        score = 100.0 * (1.0 - pd.concat(score_components, axis=1).mean(axis=1)).clip(0.0, 1.0)
        ranking_basis = "normalized_distance_from_user_texture_targets"
    else:
        # No target specified: give a neutral, explicitly exploratory shortlist around
        # the median of each supported prediction; do not present this as quality.
        for metric in RANK_METRICS:
            col = f"Predicted_{metric}"
            if col not in candidates.columns:
                continue
            values = candidates[col].astype(float)
            spread = float(values.max() - values.min()) or 1.0
            score_components.append((values - values.median()).abs() / spread)
        score = 100.0 * (1.0 - pd.concat(score_components, axis=1).mean(axis=1)).clip(0.0, 1.0)
        ranking_basis = "exploratory_closeness_to_candidate_medians"
        warnings.append("No texture targets were supplied; ranking is only a neutral shortlist near candidate medians.")

    candidates["score"] = score.round(1)
    if preferred_norm and "_preference_matches" in candidates.columns:
        candidates = candidates.sort_values(
            ["score", "_preference_matches", "Candidate_ID"],
            ascending=[False, False, True]
        )
    else:
        candidates = candidates.sort_values(["score", "Candidate_ID"], ascending=[False, True])
    candidates = candidates.head(10).copy()
    return candidates, warnings, ranking_basis

def clean_number(value):
    if pd.isna(value):
        return None
    number = float(value)
    return round(number, 4) if np.isfinite(number) else None

def candidate_to_response(row: pd.Series, rank: int, manifest: dict) -> dict:
    predictions = {}
    errors = {}
    for metric, info in manifest.items():
        col = f"Predicted_{metric}"
        if col in row.index:
            predictions[metric] = clean_number(row[col])
            val = info.get("validation", {}).get("MAE")
            if val is not None:
                errors[metric] = clean_number(val)

    p1 = str(row.get("Protein_1", ""))
    p2 = str(row.get("Protein_2", ""))
    return {
        "rank": rank,
        "candidateId": str(row.get("Candidate_ID", "")),
        "ingredients": [
            {"name": p1, "ratioPercent": clean_number(row.get("Protein_1_Ratio"))},
            {"name": p2, "ratioPercent": clean_number(row.get("Protein_2_Ratio"))},
        ],
        "processConditions": {
            "feed": clean_number(row.get("Feed")),
            "screwSpeed": clean_number(row.get("SS")),
            "moistureContent": clean_number(row.get("MC")),
        },
        "score": clean_number(row.get("score")),
        "predictions": predictions,
        "validationMaeReference": errors,
        "status": "exploratory_unvalidated",
    }

@app.get("/health")
def health():
    try:
        manifest = load_manifest()
        candidates = load_candidates()
        return {
            "status": "ok",
            "service": "formulab-ml",
            "modelCount": len(manifest),
            "candidateCount": int(len(candidates)),
            "supportedMaterial": SUPPORTED_MATERIAL,
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@app.get("/models")
def models():
    try:
        manifest = load_manifest()
        return {
            "models": [
                {
                    "metric": metric,
                    "bestModel": info.get("best_model"),
                    "validation": info.get("validation", {}),
                    "trainingRows": info.get("rows"),
                    "uniqueConditions": info.get("unique_conditions"),
                }
                for metric, info in manifest.items()
            ],
            "note": "Validation metrics are from held-out experimental conditions in the source dataset; they do not validate chicken-keema transfer.",
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

@app.post("/recommendations")
def recommendations(request: RecommendationRequest):
    if request.material != SUPPORTED_MATERIAL:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Currently only {SUPPORTED_MATERIAL} has candidate rows in this service.",
                "requestedMaterial": request.material,
                "supportedMaterial": SUPPORTED_MATERIAL,
            },
        )
    try:
        candidates, manifest = load_predictions()
        ranked, warnings, ranking_basis = rank_candidates(
            candidates,
            manifest,
            request.textureTargets,
            request.preferredIngredients,
            request.excludedIngredients,
        )
        items = [
            candidate_to_response(row, i + 1, manifest)
            for i, (_, row) in enumerate(ranked.head(request.topK).iterrows())
        ]
        return {
            "productName": request.productName,
            "material": request.material,
            "status": "exploratory_unvalidated",
            "rankingBasis": ranking_basis,
            "requestedTargets": {
                "hardness": request.textureTargets.hardness,
                "chewiness": request.textureTargets.chewiness,
                "springiness": request.textureTargets.springiness,
                "cohesion": request.textureTargets.cohesion,
            },
            "recommendations": items,
            "warnings": warnings,
            "modelLimitations": {
                "trainingDomain": "extrudate experimental data",
                "targetProductValidation": "not performed",
                "costAndNutrition": "not modeled",
                "confidence": "low",
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
