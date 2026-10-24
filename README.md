# FormuLab — Virtual Plant Protein Lab (Hackathon MVP)

A MERN-first prototype that turns plant-protein extrusion data into an explorable virtual lab. The first version supports:

- Immersive intro with Three.js molecular scene + GSAP motion
- Dataset explorer for the two supplied CSVs
- Virtual experiment requests using the existing 50:50 blend experiment data
- A Python FastAPI/scikit-learn service for baseline texture estimates and ranked blend candidates
- Optional MongoDB persistence for experiment history
- Ingredient profile inputs (price and protein values must come from a verified source)

## Important data limits

The two CSV files do not contain ingredient purchase prices or nutrition composition. They contain measured extrusion properties. Trial 1 has single-protein extrudate observations; Trial 2 has predominantly 50:50 blends and includes texture measurements. The recommendation engine will not claim validated cost/nutrition ranking unless ingredient price/protein profiles are supplied. The available blends are not enough to claim reliable predictions for arbitrary ratios such as 70:30.

Texture estimates are prototype estimates from a small experimental dataset, not food-safety or commercial formulation advice. Confirm proposed blends with physical lab tests.

## Project layout

```text
formulab-ai/
├── data/raw/                         # supplied CSV datasets
├── data/processed/                   # generated/temporary clean data
├── frontend/                         # React + Vite + Three.js + GSAP
├── backend/                          # Express API + optional MongoDB
├── ml-service/                       # FastAPI + scikit-learn baseline
└── docs/                              # architecture, data dictionary, model limits
```

## Run locally (Windows PowerShell)

Use three terminals. Install a current Node.js version compatible with current Vite (Node 20.19+ or 22.12+ is recommended by the Vite guide).

### 1. Python ML service

```powershell
cd ml-service
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATA_DIR="../data/raw"
uvicorn main:app --reload --port 8000
```

### 2. Node backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Edit backend/.env and keep ML_SERVICE_URL=http://127.0.0.1:8000
npm run dev
```

Set `ML_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`. MongoDB is optional for the demo; without `MONGODB_URI`, the API uses in-memory history which resets on restart.

### 3. React frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`).

## API endpoints

- `GET /api/health`
- `GET /api/dataset/summary`
- `GET /api/dataset/experiments`
- `POST /api/lab/run`
- `POST /api/recommendations/rank`
- `GET /api/lab/history`
- `POST /api/ingredients/profiles/validate`

## Hackathon implementation order

1. Make sure `/api/health` and `/api/dataset/summary` work.
2. Verify the virtual lab returns observed/estimated texture metrics for supported 50:50 blends.
3. Add verified ingredient profile values before demonstrating cost/protein ranking.
4. Record a screen demo and push code frequently; temporary AWS hackathon resources may be deleted when the event ends.
