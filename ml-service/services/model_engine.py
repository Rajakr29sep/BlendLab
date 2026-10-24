from __future__ import annotations
import math
from typing import Any
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from .data_loader import TEXTURE_METRICS, aggregate_trial2, load_raw_data

CATEGORICAL = ["Protein_1", "Protein_2"]
NUMERIC = ["Feed", "SS", "MC"]
PREFERRED_METRICS = ["Hardness", "Chewiness", "Springiness", "Cohesion"]

class FormulationEngine:
    def __init__(self):
        self.trial1, self.trial2 = load_raw_data()
        self.experiments = aggregate_trial2(self.trial2)
        self.models: dict[str, Pipeline] = {}
        self.metrics_summary: dict[str, dict[str, float]] = {}
        self._fit_models()
        self.supported_pairs = self._supported_pairs()

    def _fit_models(self):
        for metric in TEXTURE_METRICS:
            if metric not in self.experiments.columns:
                continue
            subset = self.experiments.dropna(subset=[metric] + CATEGORICAL + NUMERIC).copy()
            if len(subset) < 8:
                continue
            preprocess = ColumnTransformer(
                transformers=[
                    ("protein_pair", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
                    ("process", "passthrough", NUMERIC),
                ],
                remainder="drop",
            )
            model = Pipeline([
                ("features", preprocess),
                ("regressor", RandomForestRegressor(
                    n_estimators=100, max_depth=4, min_samples_leaf=2,
                    random_state=42, n_jobs=1
                )),
            ])
            model.fit(subset[CATEGORICAL + NUMERIC], subset[metric].astype(float))
            self.models[metric] = model
            values = subset[metric].astype(float).to_numpy()
            self.metrics_summary[metric] = {
                "min": float(np.nanmin(values)),
                "max": float(np.nanmax(values)),
                "median": float(np.nanmedian(values)),
                "std": float(np.nanstd(values)) or 1.0,
                "n": int(len(values)),
            }

    def _supported_pairs(self):
        pairs = {}
        texture_rows = self.experiments.dropna(subset=["Hardness"] if "Hardness" in self.experiments.columns else [])
        for _, row in texture_rows.iterrows():
            key = self._pair_key(row["Protein_1"], row["Protein_2"])
            if key not in pairs:
                pairs[key] = {
                    "proteinA": str(row["Protein_1"]),
                    "proteinB": str(row["Protein_2"]),
                    "groups": [],
                }
            pairs[key]["groups"].append(row)
        return list(pairs.values())

    @staticmethod
    def _pair_key(a: str, b: str) -> tuple[str, str]:
        return tuple(sorted((str(a), str(b))))

    def _pair_rows(self, protein_a: str, protein_b: str) -> pd.DataFrame:
        target_key = self._pair_key(protein_a, protein_b)
        mask = self.experiments.apply(
            lambda row: self._pair_key(row["Protein_1"], row["Protein_2"]) == target_key,
            axis=1,
        )
        return self.experiments.loc[mask].copy()

    def _closest_observed(self, pair_rows: pd.DataFrame, feed: float, ss: float, mc: float):
        if pair_rows.empty:
            return None, float("inf")
        scales = {"Feed": 10.0, "SS": 100.0, "MC": 5.0}
        distances = []
        for _, row in pair_rows.iterrows():
            distance = math.sqrt(sum(
                ((float(row[col]) - target) / scales[col]) ** 2
                for col, target in (("Feed", feed), ("SS", ss), ("MC", mc))
                if pd.notna(row[col])
            ))
            distances.append(distance)
        best_index = int(np.argmin(distances))
        return pair_rows.iloc[best_index], float(distances[best_index])

    def _prediction_for_pair(self, protein_a: str, protein_b: str, feed: float, ss: float, mc: float) -> dict[str, Any]:
        pair_rows = self._pair_rows(protein_a, protein_b)
        texture_rows = pair_rows.dropna(subset=["Hardness"]) if "Hardness" in pair_rows.columns else pd.DataFrame()
        if texture_rows.empty:
            return {"available": False, "proteinA": protein_a, "proteinB": protein_b, "confidence": {"level": "low", "reason": "No measured texture experiments for this exact pair."}}

        closest, distance = self._closest_observed(texture_rows, feed, ss, mc)
        features = pd.DataFrame([{
            "Protein_1": str(closest["Protein_1"]),
            "Protein_2": str(closest["Protein_2"]),
            "Feed": float(feed), "SS": float(ss), "MC": float(mc),
        }])
        predicted = {}
        intervals = {}
        for metric, model in self.models.items():
            raw_prediction = float(model.predict(features)[0])
            predicted[metric] = round(raw_prediction, 3)
            # Tree spread is displayed only as a rough model disagreement indicator, not a calibrated interval.
            transformed = model.named_steps["features"].transform(features)
            forest = model.named_steps["regressor"]
            tree_predictions = np.array([tree.predict(transformed)[0] for tree in forest.estimators_], dtype=float)
            intervals[metric] = {
                "low": round(float(np.percentile(tree_predictions, 10)), 3),
                "high": round(float(np.percentile(tree_predictions, 90)), 3),
            }

        support_count = int(len(texture_rows))
        confidence = "low"
        if support_count >= 3 and distance <= 0.6:
            confidence = "medium"
        if distance > 1.5:
            confidence = "low"
        # Never label this small dataset's estimates as high confidence.
        observed = {metric: round(float(closest[metric]), 3) for metric in TEXTURE_METRICS if metric in closest.index and pd.notna(closest[metric])}
        return {
            "available": True,
            "method": "RandomForest baseline trained on aggregated experiments",
            "recipe": {"proteinA": protein_a, "proteinB": protein_b, "ratioA": 50, "ratioB": 50},
            "requestedProcess": {"Feed": feed, "SS": ss, "MC": mc},
            "nearestObservedProcess": {"Feed": float(closest["Feed"]), "SS": float(closest["SS"]), "MC": float(closest["MC"])},
            "predictedMetrics": predicted,
            "nearestObservedMetrics": observed,
            "treeSpread": intervals,
            "nearestDistance": round(distance, 3),
            "supportExperiments": support_count,
            "confidence": {"level": confidence, "reason": f"Heuristic support indicator, not a calibrated probability: {support_count} measured conditions for this pair; nearest normalized process distance {distance:.2f}. Model training rows are limited."},
            "caveat": "Predictions are a hackathon baseline. Ratios other than 50:50 and untested processing conditions are not validated; physical lab tests are required.",
        }

    def predict(self, request: dict[str, Any]) -> dict[str, Any]:
        a, b = str(request["proteinA"]), str(request["proteinB"])
        if a == b:
            return {"available": False, "message": "This endpoint is for measured 50:50 blends. Select two different proteins.", "confidence": {"level": "low", "reason": "Unsupported recipe type."}}
        if not self._pair_rows(a, b).shape[0]:
            return {"available": False, "message": "This exact protein pair is not present in Trial 2. Choose a supported measured pair.", "confidence": {"level": "low", "reason": "No training/measurement support for this pair."}}
        return self._prediction_for_pair(a, b, float(request.get("feed", 35)), float(request.get("ss", 600)), float(request.get("mc", 28)))

    def _percentile_target(self, metric: str, percent: float) -> float:
        values = self.experiments[metric].dropna().astype(float).to_numpy()
        if len(values) == 0:
            return 0.0
        return float(np.quantile(values, np.clip(percent, 0, 100) / 100.0))

    def _profile_estimates(self, a: str, b: str, profiles: dict[str, Any]) -> tuple[float | None, float | None, bool]:
        pa = profiles.get(a) or {}
        pb = profiles.get(b) or {}
        try:
            price_a, price_b = float(pa["pricePerKg"]), float(pb["pricePerKg"])
            protein_a, protein_b = float(pa["proteinPer100g"]), float(pb["proteinPer100g"])
            if min(price_a, price_b) <= 0 or not (0 <= protein_a <= 100 and 0 <= protein_b <= 100):
                return None, None, False
            if not str(pa.get("source", "")).strip() or not str(pb.get("source", "")).strip():
                return None, None, False
            return (0.5 * price_a + 0.5 * price_b), (0.5 * protein_a + 0.5 * protein_b), True
        except (KeyError, TypeError, ValueError):
            return None, None, False

    def recommend(self, request: dict[str, Any]) -> dict[str, Any]:
        prefs = request.get("texturePreferences") or {}
        if hasattr(prefs, "model_dump"):
            prefs = prefs.model_dump()
        pref_defaults = {"hardness": 60, "chewiness": 60, "springiness": 55, "cohesion": 55}
        pref_defaults.update({k: float(v) for k, v in prefs.items() if k in pref_defaults and v is not None})
        feed, ss, mc = float(request.get("feed", 35)), float(request.get("ss", 600)), float(request.get("mc", 28))
        profiles = request.get("ingredientProfiles") or {}
        max_cost = request.get("maxCostPerKg")
        min_protein = request.get("minProteinPer100g")
        metric_keys = {"hardness": "Hardness", "chewiness": "Chewiness", "springiness": "Springiness", "cohesion": "Cohesion"}
        candidates = []
        profile_data_missing = False
        for pair in self.supported_pairs:
            prediction = self._prediction_for_pair(pair["proteinA"], pair["proteinB"], feed, ss, mc)
            if not prediction.get("available"):
                continue
            pred = prediction.get("predictedMetrics", {})
            sims = []
            for pref_key, metric in metric_keys.items():
                if metric not in pred or metric not in self.metrics_summary:
                    continue
                target_value = self._percentile_target(metric, pref_defaults[pref_key])
                std = max(self.metrics_summary[metric]["std"], 1e-6)
                delta = abs(float(pred[metric]) - target_value) / (2.0 * std)
                sims.append(max(0.0, 1.0 - min(delta, 1.0)))
            texture_score = round(100 * float(np.mean(sims)), 1) if sims else 0.0
            blend_cost, blend_protein, profile_ready = self._profile_estimates(pair["proteinA"], pair["proteinB"], profiles)
            if not profile_ready:
                profile_data_missing = True
            candidate = {
                "recipe": prediction["recipe"],
                "score": texture_score,
                "predictedMetrics": pred,
                "confidence": prediction["confidence"],
                "nearestObservedProcess": prediction["nearestObservedProcess"],
                "supportExperiments": prediction["supportExperiments"],
                "estimatedProteinBlend_g_per_100g": round(blend_protein, 2) if blend_protein is not None else None,
                "estimatedProteinIngredientCost_per_kg": round(blend_cost, 2) if blend_cost is not None else None,
                "costNutritionSourceReady": profile_ready,
                "scoreLabel": "texture similarity score; not a probability",
            }
            candidates.append(candidate)

        constraints_applied = not profile_data_missing and bool(profiles)
        warnings = [
            "Only observed 50:50 blends are ranked; the dataset does not support arbitrary ingredient ratios.",
            "Texture similarity is relative to percentile preferences over this small dataset, not a universal meat-likeness score.",
            "Cost/protein constraints are applied only when both ingredients in every candidate have source-traceable profiles.",
            "Price estimate is for the two protein ingredients only, not full product manufacturing cost.",
        ]
        if (max_cost is not None or min_protein is not None) and not constraints_applied:
            warnings.append("Cost/protein filters were NOT applied because one or more ingredient price/protein profiles are missing or lack a source. Add verified profiles before making cost/nutrition claims.")
        if constraints_applied:
            if max_cost is not None:
                candidates = [c for c in candidates if c["estimatedProteinIngredientCost_per_kg"] is not None and c["estimatedProteinIngredientCost_per_kg"] <= float(max_cost)]
            if min_protein is not None:
                candidates = [c for c in candidates if c["estimatedProteinBlend_g_per_100g"] is not None and c["estimatedProteinBlend_g_per_100g"] >= float(min_protein)]
        candidates.sort(key=lambda c: (c["score"], c["confidence"]["level"] == "medium"), reverse=True)
        candidates = candidates[:5]
        next_tests = []
        if candidates:
            top = candidates[0]
            next_tests = [
                {"priority": 1, "test": f"Repeat the {top['recipe']['proteinA']}–{top['recipe']['proteinB']} 50:50 blend at Feed={feed:g}, SS={ss:g}, MC={mc:g} with at least 3 replicates.", "why": "Confirm repeatability before treating a model estimate as a formulation result."},
                {"priority": 2, "test": "Test one neighbouring MC condition that is within the source dataset's observed MC range, keeping other settings fixed.", "why": "Measure process sensitivity and improve confidence around the chosen blend."},
                {"priority": 3, "test": "Record hardness, chewiness, springiness, cohesion and water-holding capacity under the same test protocol.", "why": "Make the next dataset row directly usable by the virtual-lab model."},
            ]
        return {
            "available": True,
            "recommendations": candidates,
            "constraintsApplied": constraints_applied,
            "texturePreferences": pref_defaults,
            "nextExperiments": next_tests,
            "warnings": warnings,
            "confidenceNote": "Confidence is an evidence-support heuristic and is not a calibrated probability. This MVP intentionally caps confidence at medium because the dataset is small.",
        }
