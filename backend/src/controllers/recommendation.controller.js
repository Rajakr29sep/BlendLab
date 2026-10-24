import { rankRecommendations } from '../services/mlClient.service.js';

export async function rank(req, res, next) {
  try {
    const body = req.body || {};
    const payload = {
      feed: Number(body.feed ?? 35), ss: Number(body.ss ?? 600), mc: Number(body.mc ?? 28),
      texturePreferences: body.texturePreferences || { hardness: 60, chewiness: 60, springiness: 55, cohesion: 55 },
      maxCostPerKg: body.maxCostPerKg === '' || body.maxCostPerKg == null ? null : Number(body.maxCostPerKg),
      minProteinPer100g: body.minProteinPer100g === '' || body.minProteinPer100g == null ? null : Number(body.minProteinPer100g),
      ingredientProfiles: body.ingredientProfiles || {}
    };
    res.json(await rankRecommendations(payload));
  } catch (error) { next(error); }
}
