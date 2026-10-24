from services.data_loader import load_raw_data, aggregate_trial2

def test_trial_data_loads_and_aggregates():
    trial1, trial2 = load_raw_data()
    assert len(trial1) > 0
    assert len(trial2) > 0
    assert set(["Protein_1", "Protein_1_Ratio", "Feed", "SS", "MC", "Value"]).issubset(trial1.columns)
    aggregated = aggregate_trial2(trial2)
    assert len(aggregated) > 0
    assert "Hardness" in aggregated.columns
