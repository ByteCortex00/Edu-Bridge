// backend/routes/analyticsRoutes.js
import express from 'express';
import {
  analyzeSkillsGap,
  getLatestAnalysis,
  getGapTrends,
  getTopSkills,
  comparePrograms,
  getDashboardOverview
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (or protected depending on your needs)
router.get('/top-skills', getTopSkills);

// Protected routes
router.post('/analyze/:curriculumId', protect, analyzeSkillsGap);
router.get('/latest/:curriculumId', protect, getLatestAnalysis);
router.get('/trends/:curriculumId', protect, getGapTrends);
router.post('/compare', protect, comparePrograms);
router.get('/dashboard/:institutionId', protect, getDashboardOverview);

export default router;