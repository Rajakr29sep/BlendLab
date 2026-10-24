# Data dictionary

## Trial 1: `6Proteins_Trial1_alldata.csv`

- 226 measurement rows; 10 columns; no empty cells observed.
- Proteins: Chickpea, Faba, Lentil, Mungbean, Pea, Soy.
- `Protein_1_Ratio` is 100 for all rows.
- Measures cover density, water holding, expansion and colour. No `Texture` category is present in this file.

## Trial 2: `6Proteins_Trial2_alldata.csv`

- 1,780 measurement rows; 13 columns; 7 empty `Value` records observed.
- Ratios are 50:50 for all listed blend records.
- Blend pairs include Soy with Chickpea/Faba/Lentil/Mungbean/Pea and Mungbean with Chickpea/Faba/Lentil/Pea.
- Texture metrics include Hardness, Adhesiveness, Resilience, Cohesion, Springiness, Gumminess and Chewiness.
- Other metrics include apparent/bulk/true density, water-holding capacity, expansion ratio and colour coordinates.
- Process columns are preserved as `Feed`, `SS`, and `MC` because the CSV alone does not provide units/definitions. Confirm their exact meanings and units from the original source metadata before presenting them as physical units.

## Important interpretation

Rows are replicate measurements, not independent recipe candidates. Aggregate replicates to one experiment before training or scoring. Do not randomly split replicate rows across train/test because that can leak nearly identical experiment conditions. This small dataset can support a proof-of-concept, but not a claim of robust commercial accuracy.
