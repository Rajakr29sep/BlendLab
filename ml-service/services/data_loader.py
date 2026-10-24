import os
from pathlib import Path
import pandas as pd

EXPERIMENT_KEYS = [
    "Protein_1", "Protein_1_Ratio", "Protein_2", "Protein_2_Ratio",
    "Sample", "Feed", "SS", "MC"
]
TEXTURE_METRICS = [
    "Hardness", "Chewiness", "Springiness", "Cohesion",
    "Resilience", "Gumminess", "Adhesiveness", "WHC", "ER", "Apparent", "Bulk"
]


def resolve_data_dir() -> Path:
    configured = os.getenv("DATA_DIR", "../data/raw")
    candidate = Path(configured).expanduser()
    if not candidate.is_absolute():
        candidate = (Path.cwd() / candidate).resolve()
    if candidate.exists():
        return candidate
    # Also support launching `uvicorn ml-service.main:app` from repository root.
    return (Path(__file__).resolve().parents[2] / "data" / "raw").resolve()


def load_raw_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    root = resolve_data_dir()
    trial1_path = root / "6Proteins_Trial1_alldata.csv"
    trial2_path = root / "6Proteins_Trial2_alldata.csv"
    if not trial1_path.exists() or not trial2_path.exists():
        raise FileNotFoundError(
            f"Expected both trial CSVs in {root}. Add the supplied data files to data/raw."
        )
    trial1 = pd.read_csv(trial1_path)
    trial2 = pd.read_csv(trial2_path)
    for frame in (trial1, trial2):
        if "Value" in frame.columns:
            frame["Value"] = pd.to_numeric(frame["Value"], errors="coerce")
    return trial1, trial2


def aggregate_trial2(trial2: pd.DataFrame) -> pd.DataFrame:
    """Aggregate replicate measurement rows to one row per experiment condition."""
    df = trial2.copy()
    df["Value"] = pd.to_numeric(df["Value"], errors="coerce")
    pivot = df.pivot_table(
        index=EXPERIMENT_KEYS,
        columns="Metric",
        values="Value",
        aggfunc="mean",
    ).reset_index()
    pivot.columns.name = None
    for column in ("Feed", "SS", "MC", "Protein_1_Ratio", "Protein_2_Ratio", "Sample"):
        if column in pivot:
            pivot[column] = pd.to_numeric(pivot[column], errors="coerce")
    return pivot
