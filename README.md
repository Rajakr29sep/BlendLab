# FormuLab — Virtual Food Formulation Studio

Hackathon MVP scaffold. React + Vite frontend, Node/Express backend scaffold, MongoDB-ready model layer, and intentionally empty Python ML service for a later integration phase.

## Run frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on Vite (usually http://localhost:5173). The UI currently uses a clearly labelled demo-mode local dataset summary and demo ranking; it does **not** claim that an ML model is connected.

## Backend (scaffold only)
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The backend has a health route and API route placeholders. Dataset import, persistence and ML proxy are TODOs. Keep secrets in `.env`, never commit them.

## Python ML (intentionally blank)
`ml-service/` has only a README and requirements placeholder. Add data preparation, evaluation, training and prediction here after the formulation UX is agreed. Node should call Python over a private HTTP API later.

## Dataset limitations
- CSVs are stored in `data/raw/`.
- Experimental datasets contain measured outputs, not verified ingredient price/nutrition or consumer sensory scores.
- The `top10_plant_alternative_nonveg_dataset.csv` has 60:40 ratios; other trial data have their own ratio coverage. Do not merge these as if they were identical experiments.
- UI recommendations are illustrative demo candidates until the ranking endpoint and evaluated model are connected.
