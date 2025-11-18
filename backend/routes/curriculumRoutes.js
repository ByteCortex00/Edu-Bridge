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
import { protectWithClerk, authorizeRole } from '../middleware/clerkAuth.js';

const router = express.Router();

router.post('/generate-embeddings', generateCurriculumEmbeddings);
router.get('/embedding-status', getCurriculumEmbeddingStatus);
router.post('/:id/regenerate-embedding', regenerateCurriculumEmbedding);

// Public routes
router.get('/', getCurricula);
router.get('/:id', getCurriculum);
router.get('/:id/skills', getCurriculumSkills);

// Protected routes (Admin/Institution roles)
router.post('/', protectWithClerk, authorizeRole('admin', 'institution'), createCurriculum);
router.put('/:id', protectWithClerk, authorizeRole('admin', 'institution'), updateCurriculum);
router.delete('/:id', protectWithClerk, authorizeRole('admin', 'institution'), deleteCurriculum);
router.post('/:id/courses', protectWithClerk, authorizeRole('admin', 'institution'), addCourse);

export default router;