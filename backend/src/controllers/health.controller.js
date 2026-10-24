import { env } from '../config/env.js';

export function getHealth(_req, res) {
  res.json({ status: 'ok', service: 'formulab-backend', mlServiceUrl: env.mlServiceUrl, time: new Date().toISOString() });
}
