import mongoose from 'mongoose';
import { ExperimentRun } from '../models/ExperimentRun.js';

const memoryHistory = [];
const MAX_HISTORY = 100;

export async function saveExperimentHistory(request, result) {
  const item = { _id: `demo-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, createdAt: new Date().toISOString(), request, result };
  if (mongoose.connection.readyState === 1) {
    const saved = await ExperimentRun.create({ request, result });
    return { _id: saved.id, createdAt: saved.createdAt, request, result };
  }
  memoryHistory.unshift(item);
  if (memoryHistory.length > MAX_HISTORY) memoryHistory.pop();
  return item;
}

export async function getExperimentHistory() {
  if (mongoose.connection.readyState === 1) {
    return ExperimentRun.find().sort({ createdAt: -1 }).limit(MAX_HISTORY).lean();
  }
  return memoryHistory;
}
