import { Router } from 'express';
import { rank } from '../controllers/recommendation.controller.js';
const router = Router();
router.post('/rank', rank);
export default router;
