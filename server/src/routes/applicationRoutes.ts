import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController';

const router = Router();

// All routes require a valid JWT
router.use(protect);

router.get('/',      getAllApplications);
router.post('/',     createApplication);
router.put('/:id',   updateApplication);
router.delete('/:id', deleteApplication);

export default router;
