import { Router } from 'express';
import { protect } from '../middleware/auth';
import { parseJD } from '../controllers/aiController';

const router = Router();

// POST /api/ai/parse  (auth protected)
router.post('/parse', protect, parseJD);

export default router;
