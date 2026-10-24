const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new Error('Cannot reach backend. Start the Node API at http://localhost:5000.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.detail || `Request failed (${response.status}).`);
  return payload;
}

export const api = {
  health: () => request('/health'),
  datasetSummary: () => request('/dataset/summary'),
  experiments: () => request('/dataset/experiments?texture=true'),
  runLab: (body) => request('/lab/run', { method: 'POST', body: JSON.stringify(body) }),
  rankRecommendations: (body) => request('/recommendations/rank', { method: 'POST', body: JSON.stringify(body) }),
  history: () => request('/lab/history'),
  validateProfiles: (profiles) => request('/ingredients/profiles/validate', { method: 'POST', body: JSON.stringify({ profiles }) }),
};
