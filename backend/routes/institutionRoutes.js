// backend/routes/institutionRoutes.js
import express from 'express';
import {
  getInstitutions,
  getInstitution,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitutionStats
} from '../controllers/institutionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getInstitutions);
router.get('/:id', getInstitution);
router.get('/:id/stats', getInstitutionStats);

// Protected routes (Admin/Institution roles)
router.post('/', protect, authorize('admin', 'institution'), createInstitution);
router.put('/:id', protect, authorize('admin', 'institution'), updateInstitution);
router.delete('/:id', protect, authorize('admin'), deleteInstitution);

export default router;