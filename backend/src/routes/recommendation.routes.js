
import { Router } from 'express';
import { rankRecommendations } from '../controllers/recommendation.controller.js';

const router = Router();

router.post('/rank', rankRecommendations);

export default router;
