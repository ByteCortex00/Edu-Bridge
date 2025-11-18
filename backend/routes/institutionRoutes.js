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
import { protectWithClerk, authorizeRole } from '../middleware/clerkAuth.js';

const router = express.Router();

// Public routes
router.get('/', getInstitutions);
router.get('/:id', getInstitution);
router.get('/:id/stats', getInstitutionStats); // requires debugging

// Protected routes (Admin/Institution roles)
router.post('/', protectWithClerk, authorizeRole('admin', 'institution'), createInstitution);
router.put('/:id', protectWithClerk, authorizeRole('admin', 'institution'), updateInstitution);
router.delete('/:id', protectWithClerk, authorizeRole('admin'), deleteInstitution);

export default router;