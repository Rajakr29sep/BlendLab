from pathlib import Path
import pandas as pd

def load_training_data(data_dir: Path) -> pd.DataFrame:
    """Load Trial 1 and Trial 2 in long format and harmonize their feature schema."""
    t1 = pd.read_csv(data_dir / "6Proteins_Trial1_alldata.csv")
    t2 = pd.read_csv(data_dir / "6Proteins_Trial2_alldata.csv")

    # Trial 1 has single proteins; explicitly represent the second ingredient as absent.
    t1["Protein_2"] = "None"
    t1["Protein_2_Ratio"] = 0
    t1["Sample"] = "trial1_" + t1["Protein_1"].astype(str) + "_" + t1["Feed"].astype(str) + "_" + t1["SS"].astype(str) + "_" + t1["MC"].astype(str)

    t2["Sample"] = "trial2_" + t2["Sample"].astype(str)

    common = [
        "Protein_1", "Protein_1_Ratio", "Protein_2", "Protein_2_Ratio",
        "Feed", "SS", "MC", "Category", "Metric", "Rep", "Value", "Sample"
    ]
    for col in common:
        if col not in t1.columns:
            t1[col] = pd.NA
        if col not in t2.columns:
            t2[col] = pd.NA

    combined = pd.concat([t1[common], t2[common]], ignore_index=True)
    for col in ["Protein_1", "Protein_2", "Category", "Metric"]:
        combined[col] = combined[col].astype(str).str.strip()
    for col in ["Protein_1_Ratio", "Protein_2_Ratio", "Feed", "SS", "MC", "Value"]:
        combined[col] = pd.to_numeric(combined[col], errors="coerce")
    combined = combined.dropna(subset=["Protein_1", "Protein_1_Ratio", "Feed", "SS", "MC", "Metric", "Value"])
    combined = combined[combined["Metric"].ne("nan")].copy()

    # The experimental unit is the formulation + process condition; replicates must stay in the same split.
    combined["ConditionGroup"] = (
        combined["Protein_1"].astype(str) + "|" +
        combined["Protein_1_Ratio"].astype(str) + "|" +
        combined["Protein_2"].astype(str) + "|" +
        combined["Protein_2_Ratio"].astype(str) + "|" +
        combined["Feed"].astype(str) + "|" +
        combined["SS"].astype(str) + "|" +
        combined["MC"].astype(str)
    )
    return combined

def load_candidates(data_dir: Path) -> pd.DataFrame:
    path = data_dir / "top10_poultry_candidates_literature_aligned.csv"
    df = pd.read_csv(path)
    required = ["Candidate_ID", "Protein_1", "Protein_1_Ratio", "Protein_2", "Protein_2_Ratio", "Feed", "SS", "MC", "Material"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Candidate dataset missing columns: {missing}")
    return df
