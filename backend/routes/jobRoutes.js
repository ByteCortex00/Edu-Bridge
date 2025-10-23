// backend/routes/jobRoutes.js
import express from 'express';
import {
  fetchJobsFromAdzuna,
  getAllJobs,
  getJobById,
  getJobStats,
  deleteJob
} from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.get('/stats/overview', getJobStats);

// Protected routes (Admin/Institution roles)
router.post('/fetch', protect, authorize('admin', 'institution'), fetchJobsFromAdzuna);
router.delete('/:id', protect, authorize('admin'), deleteJob);

export default router;