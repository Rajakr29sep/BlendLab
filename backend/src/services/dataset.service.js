import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../../../data/raw');
let cache = null;

function readCsv(fileName) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Dataset not found: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true, bom: true }).map((row) => {
    const out = { ...row };
    for (const key of ['Protein_1_Ratio', 'Protein_2_Ratio', 'Sample', 'Feed', 'SS', 'MC', 'Rep', 'Value']) {
      if (key in out) {
        const value = out[key] === '' ? null : Number(out[key]);
        out[key] = Number.isFinite(value) ? value : null;
      }
    }
    return out;
  });
}

export function getData() {
  if (!cache) {
    cache = {
      trial1: readCsv('6Proteins_Trial1_alldata.csv'),
      trial2: readCsv('6Proteins_Trial2_alldata.csv')
    };
  }
  return cache;
}

const unique = (values) => [...new Set(values.filter((value) => value != null))];
const canonicalPair = (a, b) => [String(a), String(b)].sort((x, y) => x.localeCompare(y)).join('::');

export function getExperimentGroups() {
  const { trial2 } = getData();
  const groupMap = new Map();
  const idKeys = ['Protein_1', 'Protein_1_Ratio', 'Protein_2', 'Protein_2_Ratio', 'Sample', 'Feed', 'SS', 'MC'];
  for (const row of trial2) {
    const key = idKeys.map((key) => String(row[key] ?? '')).join('|');
    if (!groupMap.has(key)) {
      const identity = Object.fromEntries(idKeys.map((field) => [field, row[field]]));
      groupMap.set(key, { ...identity, PairKey: canonicalPair(row.Protein_1, row.Protein_2), metrics: {}, rowCount: 0 });
    }
    const group = groupMap.get(key);
    group.rowCount += 1;
    if (row.Value != null && row.Metric) {
      const current = group.metrics[row.Metric] || { total: 0, count: 0 };
      current.total += row.Value;
      current.count += 1;
      group.metrics[row.Metric] = current;
    }
  }
  return [...groupMap.values()].map((group) => {
    const metrics = Object.fromEntries(Object.entries(group.metrics).map(([name, summary]) => [name, summary.total / summary.count]));
    return { ...group, metrics };
  });
}

export function getDatasetSummary() {
  const { trial1, trial2 } = getData();
  const allProteins = unique([...trial1.map((r) => r.Protein_1), ...trial2.flatMap((r) => [r.Protein_1, r.Protein_2])]).sort();
  const metrics = {};
  for (const row of [...trial1, ...trial2]) {
    const key = `${row.Category} / ${row.Metric}`;
    metrics[key] = (metrics[key] || 0) + 1;
  }
  const groups = getExperimentGroups();
  const blendPairsMap = new Map();
  for (const group of groups) {
    if (!blendPairsMap.has(group.PairKey)) {
      blendPairsMap.set(group.PairKey, { proteinA: group.Protein_1, proteinB: group.Protein_2, ratioA: group.Protein_1_Ratio, ratioB: group.Protein_2_Ratio, experimentCount: 0, hasTexture: false });
    }
    const item = blendPairsMap.get(group.PairKey);
    item.experimentCount += 1;
    if (group.metrics.Hardness != null) item.hasTexture = true;
  }
  return {
    totals: { trial1Rows: trial1.length, trial2Rows: trial2.length, measurements: trial1.length + trial2.length, trial2MissingValues: trial2.filter((r) => r.Value == null).length, aggregatedExperimentGroups: groups.length },
    proteins: allProteins,
    blendPairs: [...blendPairsMap.values()],
    metricCounts: metrics,
    dataLimits: [
      'Trial 1 contains 100% single-protein runs and does not include Texture-category metrics.',
      'Trial 2 measured blends use a 50:50 ratio; do not extrapolate confidently to other ratios.',
      'Purchase costs and ingredient nutrition are not present in these two CSV files.',
      'Feed, SS and MC are preserved as source columns; verify meanings and units from the dataset metadata.'
    ]
  };
}

export function getRawExperiments() {
  return getExperimentGroups();
}

export function getFallbackPrediction(input) {
  const groups = getExperimentGroups();
  const wanted = canonicalPair(input.proteinA, input.proteinB);
  const candidates = groups.filter((group) => group.PairKey === wanted && group.metrics.Hardness != null);
  if (!candidates.length) {
    return { available: false, message: 'No measured texture experiment was found for this exact ingredient pair. Use a supported 50:50 pair from Trial 2.', confidence: { level: 'low', reason: 'No matching measured texture support.' } };
  }
  const scales = { Feed: 10, SS: 100, MC: 5 };
  const target = { Feed: Number(input.feed ?? 35), SS: Number(input.ss ?? 600), MC: Number(input.mc ?? 28) };
  const ranked = candidates.map((group) => {
    const distance = Math.sqrt(['Feed', 'SS', 'MC'].reduce((sum, key) => sum + (((Number(group[key]) - target[key]) / scales[key]) ** 2), 0));
    return { group, distance };
  }).sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const support = candidates.length;
  let level = 'low';
  if (support >= 4 && best.distance <= 0.2) level = 'medium';
  if (support >= 4 && best.distance === 0) level = 'medium'; // Deliberately capped: small dataset.
  return {
    available: true,
    method: 'nearest-observed-experiment fallback',
    recipe: { proteinA: input.proteinA, proteinB: input.proteinB, ratioA: 50, ratioB: 50 },
    requestedProcess: target,
    nearestObservedProcess: { Feed: best.group.Feed, SS: best.group.SS, MC: best.group.MC },
    metrics: best.group.metrics,
    nearestDistance: Number(best.distance.toFixed(3)),
    supportExperiments: support,
    confidence: { level, reason: `Heuristic, not a calibrated probability: ${support} grouped experiments for this pair; nearest normalized process distance ${best.distance.toFixed(2)}.` },
    caveat: 'This result is derived from the closest recorded experiment, not a physical test of the submitted settings.'
  };
}
