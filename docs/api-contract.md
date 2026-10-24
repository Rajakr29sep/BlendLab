# API contract

Base URL: `http://localhost:5000/api`

## `GET /health`
Returns API status and configured ML service URL.

## `GET /dataset/summary`
Returns source row counts, ingredient names, supported blend pairs, metric counts and data limits.

## `GET /dataset/experiments?texture=true`
Returns aggregated Trial 2 experiment-condition groups. Optional query: `protein=Soy`.

## `POST /lab/run`
Example body:

```json
{
  "proteinA": "Soy",
  "proteinB": "Chickpea",
  "feed": 35,
  "ss": 600,
  "mc": 30,
  "texturePreferences": {"hardness": 60, "chewiness": 60, "springiness": 55, "cohesion": 55}
}
```

## `POST /recommendations/rank`
Example body:

```json
{
  "feed": 35,
  "ss": 600,
  "mc": 28,
  "texturePreferences": {"hardness": 60, "chewiness": 60, "springiness": 55, "cohesion": 55},
  "maxCostPerKg": null,
  "minProteinPer100g": null,
  "ingredientProfiles": {
    "Soy": {"pricePerKg": 250, "proteinPer100g": 70, "source": "supplier spec, checked 2026-10-24"},
    "Chickpea": {"pricePerKg": 180, "proteinPer100g": 22, "source": "supplier spec, checked 2026-10-24"}
  }
}
```

The values above are an illustrative request shape, not validated market values. Replace every example with verified data before using cost/nutrition filters.

## `GET /lab/history`
Returns in-memory history in demo mode, or MongoDB history when `MONGODB_URI` is configured.

## `POST /ingredients/profiles/validate`
Checks whether the six ingredient profiles contain valid numeric values and a non-empty source field. It does not verify the source independently.
