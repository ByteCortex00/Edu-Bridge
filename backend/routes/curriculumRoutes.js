// backend/routes/curriculumRoutes.js
import express from 'express';
import {
  getCurricula,
  getCurriculum,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  addCourse,
  getCurriculumSkills,
  generateCurriculumEmbeddings,
  getCurriculumEmbeddingStatus,
  regenerateCurriculumEmbedding
} from '../controllers/curriculumController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate-embeddings', generateCurriculumEmbeddings);
router.get('/embedding-status', getCurriculumEmbeddingStatus);
router.post('/:id/regenerate-embedding', regenerateCurriculumEmbedding);

// Public routes
router.get('/', getCurricula);
router.get('/:id', getCurriculum);
router.get('/:id/skills', getCurriculumSkills);

// Protected routes (Admin/Institution roles)
router.post('/', protect, authorize('admin', 'institution'), createCurriculum);
router.put('/:id', protect, authorize('admin', 'institution'), updateCurriculum);
router.delete('/:id', protect, authorize('admin', 'institution'), deleteCurriculum);
router.post('/:id/courses', protect, authorize('admin', 'institution'), addCourse);

export default router;