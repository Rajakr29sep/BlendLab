import { getDatasetSummary, getRawExperiments } from '../services/dataset.service.js';

export function datasetSummary(_req, res, next) {
  try { res.json(getDatasetSummary()); } catch (error) { next(error); }
}

export function listExperiments(req, res, next) {
  try {
    let rows = getRawExperiments();
    if (req.query.protein) rows = rows.filter((r) => r.Protein_1 === req.query.protein || r.Protein_2 === req.query.protein);
    if (req.query.texture === 'true') rows = rows.filter((r) => r.metrics.Hardness != null);
    res.json({ count: rows.length, experiments: rows });
  } catch (error) { next(error); }
}
