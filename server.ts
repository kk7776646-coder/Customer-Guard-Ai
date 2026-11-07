import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  PKL_PIPELINE_WEIGHTS,
  MODEL_COMPARISON_BENCHMARKS,
  computeChurnPrediction
} from './src/data/churnModelData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RENDER_BACKEND_URL = process.env.RENDER_EXTERNAL_URL || 'https://customer-guard-ai.onrender.com';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

function evaluateChurnPipeline(input: Record<string, any>) {
  const modelKey = String(input.modelKey || 'logistic-regression-pkl');
  const normalizedInput = {
    seniorCitizen: input.seniorCitizen ?? input.SeniorCitizen ?? 0,
    tenure: input.tenure ?? 12,
    monthlyCharges: input.monthlyCharges ?? input.MonthlyCharges ?? 70.5,
    totalCharges: input.totalCharges ?? input.TotalCharges,
    gender: input.gender || 'Female',
    partner: input.partner || input.Partner || 'No',
    dependents: input.dependents || input.Dependents || 'No',
    phoneService: input.phoneService || input.PhoneService || 'Yes',
    multipleLines: input.multipleLines || input.MultipleLines || 'No',
    internet: input.internet || input.InternetService || 'Fiber optic',
    onlineSecurity: input.onlineSecurity || input.OnlineSecurity || 'No',
    onlineBackup: input.onlineBackup || input.OnlineBackup || 'No',
    deviceProtection: input.deviceProtection || input.DeviceProtection || 'No',
    techSupport: input.techSupport || input.TechSupport || 'No',
    streamingTV: input.streamingTV || input.StreamingTV || 'No',
    streamingMovies: input.streamingMovies || input.StreamingMovies || 'No',
    contract: input.contract || input.Contract || 'Month-to-month',
    paperlessBilling: input.paperlessBilling || input.PaperlessBilling || 'Yes',
    payment: input.payment || input.PaymentMethod || 'Electronic check'
  };

  const result = computeChurnPrediction(normalizedInput, { medium: 35, high: 65 }, modelKey);
  const riskLevel =
    result.probability >= 65
      ? 'High Risk'
      : result.probability >= 35
      ? 'Medium Risk'
      : 'Low Risk';

  return {
    probability: result.probability,
    riskLevel,
    logit: result.logit,
    modelKey,
    artifact: PKL_PIPELINE_WEIGHTS.artifactFile,
    timestamp: new Date().toISOString()
  };
}

// Health Check Routes (supports both /api/health and /health for Render health checks)
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Clario Customer Intelligence API',
    backendUrl: RENDER_BACKEND_URL,
    modelArtifact: PKL_PIPELINE_WEIGHTS.artifactFile,
    timestamp: new Date().toISOString()
  });
});

// Prediction Routes (supports both /api/predict and /predict)
app.post(['/api/predict', '/predict'], (req, res) => {
  try {
    const result = evaluateChurnPipeline(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      error: 'Invalid prediction payload',
      message: err?.message || 'Unable to compute churn probability'
    });
  }
});

// Model Benchmarks Route
app.get('/api/models', (_req, res) => {
  res.json({
    activeArtifact: PKL_PIPELINE_WEIGHTS.artifactFile,
    benchmarksCount: MODEL_COMPARISON_BENCHMARKS.length,
    benchmarks: MODEL_COMPARISON_BENCHMARKS,
    backendUrl: RENDER_BACKEND_URL
  });
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' || (fs.existsSync(distPath) && process.env.RENDER === 'true');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clario Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
