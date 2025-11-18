// backend/routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  syncClerkUser,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { protectWithClerk } from '../middleware/clerkAuth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Clerk protected routes
router.post('/sync-clerk-user', protectWithClerk, syncClerkUser);

// Protected routes
router.get('/me', protectWithClerk, getMe);
router.put('/profile', protectWithClerk, updateProfile);

export default router;