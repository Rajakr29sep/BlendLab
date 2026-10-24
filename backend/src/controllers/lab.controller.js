import { runPrediction } from '../services/mlClient.service.js';
import { saveExperimentHistory, getExperimentHistory } from '../services/history.service.js';

export async function runLab(req, res, next) {
  try {
    const { proteinA, proteinB } = req.body || {};
    if (!proteinA || !proteinB) return res.status(400).json({ error: 'proteinA and proteinB are required.' });
    if (proteinA === proteinB) return res.status(400).json({ error: 'Choose two different ingredients for this 50:50 blend dataset.' });
    const input = {
      proteinA: String(proteinA), proteinB: String(proteinB),
      feed: Number(req.body.feed ?? 35), ss: Number(req.body.ss ?? 600), mc: Number(req.body.mc ?? 28),
      texturePreferences: req.body.texturePreferences || {}
    };
    for (const field of ['feed', 'ss', 'mc']) {
      if (!Number.isFinite(input[field])) return res.status(400).json({ error: `${field} must be numeric.` });
    }
    const result = await runPrediction(input);
    await saveExperimentHistory(input, result);
    res.json(result);
  } catch (error) { next(error); }
}

export async function history(_req, res, next) {
  try { res.json({ experiments: await getExperimentHistory() }); } catch (error) { next(error); }
}
