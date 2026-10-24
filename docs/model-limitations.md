# Model limits and demo wording

## What the current code does

- Aggregates repeated measurement rows to 29 experiment-condition groups for Trial 2.
- Trains one RandomForestRegressor baseline per available target metric on CPU.
- Produces estimates for supported 50:50 pairs and compares requested process settings with the nearest measured conditions.
- Produces a relative texture similarity score based on the selected percentile targets.
- Labels confidence with a support/distance heuristic capped at `medium`; it is not a calibrated probability.
- Suggests physical experiments to validate repeatability and process sensitivity.

## Do not claim

- Do not claim this dataset trains a reliable universal plant-meat formulation model. Trial 2 has few aggregated conditions (29 total; 25 have hardness values), only 9 unique pairs, and all pair ratios are 50:50.
- Do not claim arbitrary blend ratios (e.g. 70:30) are covered.
- Do not claim cost or nutrition were learned from the supplied CSVs. They are not present. Cost/protein ranking is applied only when ingredient profiles with numeric data and source information have been entered.
- The estimated protein value is a linear blend estimate of ingredient profiles, not a validated finished-product nutrition label. The price is only the protein-ingredient blend estimate, not a finished product cost.
- Do not call the texture score a probability, meat-likeness score, or accuracy percentage.

## Jury-friendly language

"We built a virtual-lab prototype around real extrusion measurements. It aggregates replicate data, estimates texture signals for experimentally represented 50:50 blends, expresses uncertainty based on evidence coverage, and recommends the next physical tests. Cost and nutrition are separate, source-traceable inputs rather than invented values. As we collect more experiments, we can expand the model to additional ratios and product classes."
