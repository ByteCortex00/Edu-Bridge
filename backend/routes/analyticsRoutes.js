// backend/routes/analyticsRoutes.js
import express from 'express';
import {
  analyzeSkillsGap,
  getLatestAnalysis,
  getGapTrends,
  getTopSkills,
  comparePrograms,
  getDashboardOverview,
  debugAnalysisSetup,  
  debugSimilarity
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (or protected depending on your needs)
// Root info route so GET /api/analytics returns useful info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics endpoints',
    endpoints: [
      '/api/analytics/top-skills',
      '/api/analytics/analyze/:curriculumId',
      '/api/analytics/latest/:curriculumId',
      '/api/analytics/trends/:curriculumId',
      '/api/analytics/compare',
      '/api/analytics/dashboard/:institutionId'
    ]
  });
});

router.get('/top-skills', getTopSkills);
router.get('/debug-similarity/:curriculumId', protect, debugSimilarity)
// Protected routes
router.post('/analyze/:curriculumId', protect, analyzeSkillsGap);
router.get('/latest/:curriculumId', getLatestAnalysis);
router.get('/trends/:curriculumId', protect, getGapTrends);
router.post('/compare', protect, comparePrograms);
router.get('/dashboard/:institutionId', protect, getDashboardOverview);
router.get('/debug-analysis/:curriculumId', protect, debugAnalysisSetup);


export default router;