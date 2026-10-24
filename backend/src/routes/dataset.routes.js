import { Router } from 'express';
import { datasetSummary, listExperiments } from '../controllers/dataset.controller.js';
const router = Router();
router.get('/summary', datasetSummary);
router.get('/experiments', listExperiments);
export default router;
