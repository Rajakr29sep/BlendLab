import { env } from '../config/env.js';
import { getFallbackPrediction, getDatasetSummary } from './dataset.service.js';

async function callMl(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`${env.mlServiceUrl}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal
    });
    if (!response.ok) throw new Error(`ML service returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function runPrediction(input) {
  try {
    return await callMl('/predict', input);
  } catch (error) {
    console.warn(`[ml] Python service unavailable; using nearest-observed fallback: ${error.message}`);
    return getFallbackPrediction(input);
  }
}

export async function rankRecommendations(input) {
  try {
    return await callMl('/recommend', input);
  } catch (error) {
    console.warn(`[ml] Python recommendation service unavailable: ${error.message}`);
    return {
      available: false,
      recommendations: [],
      message: 'Start the Python ML service to rank candidates. The dataset summary API remains available.',
      dataLimits: getDatasetSummary().dataLimits
    };
  }
}
