import mongoose from 'mongoose';

const experimentRunSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  request: { type: mongoose.Schema.Types.Mixed, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true }
}, { versionKey: false });

export const ExperimentRun = mongoose.models.ExperimentRun || mongoose.model('ExperimentRun', experimentRunSchema);
