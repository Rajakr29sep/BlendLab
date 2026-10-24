# FormuLab Phase 1 — ML training + candidate ranking

This package implements the first reproducible ML stage for FormuLab.

## Data roles
- `data/6Proteins_Trial1_alldata.csv`: single-protein experimental training observations.
- `data/6Proteins_Trial2_alldata.csv`: two-protein blend experimental training observations.
- `data/top10_poultry_candidates_literature_aligned.csv`: candidate INPUT rows used only for inference/ranking; it is not ground truth.

## Run
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
python src/train_models.py
python src/recommend.py
```

## What it does
- Harmonizes Trial 1 single-protein rows and Trial 2 blend rows.
- Trains separate regressors for each `Metric` because targets have different meanings/units.
- Compares Extra Trees, Random Forest and Ridge using a grouped holdout split. All replicate rows from a formulation/process condition stay in the same split.
- Saves final metric-specific estimators under `artifacts/`.
- Predicts supported metrics for candidate inputs and exports an exploratory ranking.

## Important scientific limitations
1. Training `Material` is `Extrudate`; candidate `Material` is `Plant_Poultry_Matrix`. `Material` is excluded from model features so an unseen category is not silently encoded as if validated. The prediction remains a domain-transfer hypothesis.
2. `top10_poultry_candidates_literature_aligned.csv` contains no measured chicken-keema outcomes. Never use its blank target values as training labels.
3. The initial rank score is an exploratory score based on proximity to median predicted values across the candidate pool. It is not a validated sensory score and does not yet use user-entered targets.
4. Cost/protein constraints are not applied because no verified ingredient cost/nutrition dataset is included.
5. Holdout evaluation is preliminary. Use repeated grouped cross-validation and physical experiments before claiming accuracy.
6. The candidate file was created by selecting observed Trial 2 blend/process conditions and proposing a poultry target mapping. Research papers support ingredient/extrusion relevance, not the exact predictions.

## Next integration step
Expose this logic behind a Python FastAPI `/predict-and-rank` endpoint, then call it from the Node/Express backend. Do not let the React frontend directly load `.joblib` artifacts.
