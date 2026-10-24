import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

await connectDatabase();
app.listen(env.port, () => console.info(`[api] FormuLab backend running at http://localhost:${env.port}`));
