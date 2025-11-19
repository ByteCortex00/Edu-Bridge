// backend/middleware/clerkAuth.js
import { verifyToken } from '@clerk/backend';
import User from '../models/userModel.js'; // Import User model

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

export const verifyClerkToken = async (token) => {
  if (!token) throw new Error('No token provided');
  if (!clerkSecretKey) throw new Error('CLERK_SECRET_KEY not configured');

  try {
    return await verifyToken(token, { secretKey: clerkSecretKey });
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

export const protectWithClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization header provided' });
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const clerkUser = await verifyClerkToken(token);
    req.clerk = clerkUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || 'Authentication failed' });
  }
};

// UPDATED: Check role against MongoDB database
export const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.clerk) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // 1. Find user in DB to get the *real* current role
      const user = await User.findOne({ clerkId: req.clerk.sub });
      
      // 2. Determine role (DB takes precedence, fallback to metadata)
      const userRole = user?.role || req.clerk.publicMetadata?.role || 'viewer';

      // 3. Check authorization
      if (!roles.includes(userRole) && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: `User role '${userRole}' is not authorized to access this resource`
        });
      }

      // Attach full user object to req for controllers to use
      req.user = user; 
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ success: false, message: 'Server error checking authorization' });
    }
  };
};

export const optionalClerkAuth = async (req, res, next) => {
    // ... (keep existing optionalClerkAuth logic if any)
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const clerkUser = await verifyClerkToken(token);
        req.clerk = clerkUser;
      }
      next();
    } catch (error) {
      next();
    }
};

export default { protectWithClerk, optionalClerkAuth, authorizeRole, verifyClerkToken };
