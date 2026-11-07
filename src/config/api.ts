// Clario API Configuration for Render Deployment
// Connects Frontend to the Render Backend: https://customer-guard-ai.onrender.com

export const RENDER_BACKEND_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'https://customer-guard-ai.onrender.com';

export interface PredictionRequestPayload {
  customerId?: string;
  customerName?: string;
  gender?: string;
  seniorCitizen?: number;
  partner?: string;
  dependents?: string;
  tenure: number;
  phoneService?: string;
  multipleLines?: string;
  internet: string;
  onlineSecurity?: string;
  onlineBackup?: string;
  deviceProtection?: string;
  techSupport?: string;
  streamingTV?: string;
  streamingMovies?: string;
  contract: string;
  paperlessBilling?: string;
  payment: string;
  monthlyCharges: number;
  totalCharges: number;
  modelKey?: string;
}

export async function requestBackendPrediction(payload: PredictionRequestPayload) {
  const endpoints = [
    `/api/predict`,
    `${RENDER_BACKEND_URL}/api/predict`,
    `${RENDER_BACKEND_URL}/predict`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.probability === 'number') {
          return { ...data, source: url.startsWith('http') ? RENDER_BACKEND_URL : 'local-api' };
        }
      }
    } catch {
      // Fall through to next endpoint or local pipeline calculation
    }
  }
  return null;
}
