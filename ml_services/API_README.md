# FormuLab Phase 1 — ML API

This service wraps the existing trained metric-specific models with FastAPI. It does not retrain models when the API starts.

## Run from the `ml_services` folder

```powershell
pip install -r requirements.txt
python src/train_models.py
uvicorn api:app --app-dir src --reload --host 127.0.0.1 --port 8000
```

Keep this terminal running. API docs are available at `http://127.0.0.1:8000/docs`.

## Endpoints

- `GET /health` — checks model manifest and candidate CSV.
- `GET /models` — lists model names and held-out validation metrics.
- `POST /recommendations` — predicts available metrics for candidate blends and returns a ranked shortlist.

### Example request

```json
{
  "productName": "Plant-based Chicken Keema",
  "material": "Plant_Poultry_Matrix",
  "textureTargets": {
    "hardness": 2500,
    "chewiness": 1100,
    "springiness": 70,
    "cohesion": 0.55
  },
  "preferredIngredients": [],
  "excludedIngredients": [],
  "topK": 3
}
```

The target numbers above are example inputs for testing only, not verified chicken-keema standards. The scale is normalized over the current candidate predictions, so scores are ranking aids, not probabilities or validated quality scores.

## Test with PowerShell

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/models

$body = @{
  productName = "Plant-based Chicken Keema"
  material = "Plant_Poultry_Matrix"
  textureTargets = @{
    hardness = 2500
    chewiness = 1100
    springiness = 70
    cohesion = 0.55
  }
  preferredIngredients = @()
  excludedIngredients = @()
  topK = 3
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri http://127.0.0.1:8000/recommendations `
  -Method Post -ContentType "application/json" -Body $body
```

## Important scientific limitations

- Training data describe extrudate experiments; the poultry-style target label is a proposed mapping, not an experimentally validated product.
- Candidate conditions are derived from observed source-dataset conditions and are for inference/shortlisting, not new ground truth.
- Do not claim the results are validated chicken-keema recipes, food-safety guidance, nutrition facts, or cost-optimized blends.
- `validationMaeReference` reports the source model's held-out MAE as context. It is not a product-specific error guarantee.
- Confidence is reported as low until target-product experiments are run and evaluated.
