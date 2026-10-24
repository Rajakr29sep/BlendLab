import { Router } from 'express';
import { runLab, history } from '../controllers/lab.controller.js';
const router = Router();
router.post('/run', runLab);
router.get('/history', history);
export default router;
