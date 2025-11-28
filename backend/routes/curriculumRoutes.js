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

// --- 🔒 PROTECTED ROUTES (All routes require login now) ---
// Apply protection globally or per route
router.use(protectWithClerk);

// 1. Read Operations (Now Enforced)
router.get('/', authorizeRole('admin', 'institution'), getCurricula);
router.get('/:id', authorizeRole('admin', 'institution'), getCurriculum);
router.get('/:id/skills', authorizeRole('admin', 'institution'), getCurriculumSkills);

// 2. Write Operations (Admin/Institution)
router.post('/', authorizeRole('admin', 'institution'), createCurriculum);
router.put('/:id', authorizeRole('admin', 'institution'), updateCurriculum);
router.delete('/:id', authorizeRole('admin', 'institution'), deleteCurriculum);
router.post('/:id/courses', authorizeRole('admin', 'institution'), addCourse);

// 3. Admin-Only Operations
router.post('/generate-embeddings', authorizeRole('admin'), generateCurriculumEmbeddings);
router.get('/embedding-status', authorizeRole('admin'), getCurriculumEmbeddingStatus);
router.post('/:id/regenerate-embedding', authorizeRole('admin'), regenerateCurriculumEmbedding);

export default router;