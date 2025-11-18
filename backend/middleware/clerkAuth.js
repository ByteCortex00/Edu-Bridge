// middleware/clerkAuth.js
import { verifyToken } from '@clerk/backend';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

/**
 * Verify Clerk JWT token (expects token without Bearer prefix)
 */
export const verifyClerkToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  if (!clerkSecretKey) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }

  try {
    const decoded = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Middleware to verify Clerk authentication
 * Attaches Clerk user data to req.clerk
 */
export const protectWithClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const clerkUser = await verifyClerkToken(token);
    req.clerk = clerkUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

/**
 * Optional Clerk authentication - doesn't fail if no token
 */
export const optionalClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
  
      const clerkUser = await verifyClerkToken(token);
      req.clerk = clerkUser;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorize specific roles (using Clerk metadata)
 */
export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.clerk) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userRole = req.clerk.publicMetadata?.role || 'viewer';
    
    if (!roles.includes(userRole) && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this resource`
      });
    }

    next();
  };
};

export default {
  protectWithClerk,
  optionalClerkAuth,
  authorizeRole,
  verifyClerkToken
};
