# Clario — Customer Intelligence, Made Clear.

AI-powered Customer Churn Prediction and Customer Intelligence platform powered by the trained Telco Customer Churn Scikit-Learn pipeline (`churnguard_model.pkl`) and model benchmark analytics (`model_comparison.csv`).

---

## Live Render Deployment Architecture

- **Backend API Service**: `https://customer-guard-ai.onrender.com`
- **Frontend Application**: Deployed via Render Static Site or unified Full-Stack Web Service (`render.yaml`)

---

## Deploying on Render

### Option A: One-Click Blueprint Deployment (`render.yaml`)
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and provision:
   - **`customer-guard-ai`** (Backend Web Service with `/api/health` and `/api/predict`)
   - **`clario-frontend`** (Frontend Static Site pre-configured with `VITE_API_BASE_URL=https://customer-guard-ai.onrender.com`)

---

### Option B: Manual Frontend & Backend Setup on Render

#### 1. Backend Web Service (`https://customer-guard-ai.onrender.com`)
- **Service Type**: Web Service
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `VITE_API_BASE_URL`: `https://customer-guard-ai.onrender.com`

#### 2. Frontend Static Site
- **Service Type**: Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://customer-guard-ai.onrender.com`
- **Redirects / Rewrites**:
  - Source: `/*` → Destination: `/index.html` (Action: `Rewrite`)

---

## API Endpoints (`https://customer-guard-ai.onrender.com`)

- `GET /api/health` or `GET /health` — Service health and model artifact verification.
- `POST /api/predict` or `POST /predict` — Executes customer churn probability inference using the Scikit-Learn model pipeline.
- `GET /api/models` — Returns active model metadata and benchmark status.
