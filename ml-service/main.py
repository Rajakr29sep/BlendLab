from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.requests import PredictRequest, RecommendRequest
from services.data_loader import load_raw_data, aggregate_trial2
from services.model_engine import FormulationEngine

app = FastAPI(title="FormuLab ML Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
engine: FormulationEngine | None = None

@app.on_event("startup")
def startup():
    global engine
    engine = FormulationEngine()
    print(f"[ml] loaded {len(engine.trial1)} Trial 1 and {len(engine.trial2)} Trial 2 measurement rows")
    print(f"[ml] aggregated experiment rows: {len(engine.experiments)}; model metrics: {list(engine.models)}")

@app.get("/health")
def health():
    return {"status": "ok", "service": "formulab-ml", "ready": engine is not None}

@app.get("/summary")
def summary():
    if engine is None:
        raise HTTPException(status_code=503, detail="Model engine is not ready")
    return {
        "trial1Rows": int(len(engine.trial1)),
        "trial2Rows": int(len(engine.trial2)),
        "aggregatedExperimentRows": int(len(engine.experiments)),
        "trainedMetrics": list(engine.models.keys()),
        "supportedBlendPairs": [{"proteinA": p["proteinA"], "proteinB": p["proteinB"], "conditions": len(p["groups"])} for p in engine.supported_pairs],
    }

@app.post("/predict")
def predict(request: PredictRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Model engine is not ready")
    result = engine.predict(request.model_dump())
    return result

@app.post("/recommend")
def recommend(request: RecommendRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Model engine is not ready")
    return engine.recommend(request.model_dump())
