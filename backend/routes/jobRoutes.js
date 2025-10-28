// backend/routes/jobRoutes.js
import express from 'express';
import {
  fetchJobsFromAdzuna,
  getAllJobs,
  getJobById,
  getJobStats,
  deleteJob,
  getAdzunaCategories,
  bulkPopulateJobs,
  getJobCategories,
  generateJobEmbeddings,  // ✅ ADDED
  getEmbeddingStatus,      // ✅ ADDED 
  testMLService

} from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ✅ PUT SPECIFIC ROUTES FIRST
router.get('/test-ml', testMLService);
router.get('/embedding-status', getEmbeddingStatus);
router.post('/generate-embeddings', generateJobEmbeddings);

// ✅ THEN GENERAL ROUTES
router.get('/categories', getJobCategories);
router.get('/adzuna-categories', getAdzunaCategories);
router.get('/fetch', fetchJobsFromAdzuna);
router.post('/bulk-populate', bulkPopulateJobs);
router.get('/', getAllJobs);
router.get('/stats', getJobStats);

// ✅ PUT PARAMETERIZED ROUTES LAST
router.get('/:id', getJobById);
router.delete('/:id', deleteJob);



export default router;