from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "src"))

from api import health, models, recommendations, RecommendationRequest, TextureTargets

def main():
    health_result = health()
    assert health_result["status"] == "ok", health_result
    model_result = models()
    assert len(model_result["models"]) > 0, model_result
    request = RecommendationRequest(
        productName="Plant-based Chicken Keema",
        material="Plant_Poultry_Matrix",
        textureTargets=TextureTargets(
            hardness=2500,
            chewiness=1100,
            springiness=70,
            cohesion=0.55,
        ),
        topK=3,
    )
    result = recommendations(request)
    assert len(result["recommendations"]) == 3, result
    assert result["status"] == "exploratory_unvalidated"
    assert all("predictions" in item for item in result["recommendations"])
    print("Smoke test passed.")
    print("Models:", health_result["modelCount"])
    print("Candidates in CSV:", health_result["candidateCount"])
    print("Top 3:", [x["candidateId"] for x in result["recommendations"]])

if __name__ == "__main__":
    main()
