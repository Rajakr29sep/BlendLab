import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.info('[db] MONGODB_URI not configured; using in-memory experiment history.');
    return false;
  }
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3500 });
    console.info('[db] MongoDB connected.');
    return true;
  } catch (error) {
    console.warn('[db] MongoDB unavailable; API will continue in demo mode:', error.message);
    return false;
  }
}
