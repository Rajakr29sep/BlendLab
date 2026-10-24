import { Router } from 'express';
import { validateProfiles } from '../controllers/ingredient.controller.js';
const router = Router();
router.post('/profiles/validate', validateProfiles);
export default router;
