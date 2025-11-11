// backend/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    try {
      const { name, email, password, role, institutionId } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return {
          success: false,
          message: 'User already exists with this email'
        };
      }
      
      // CRITICAL FIX: Pass plain-text password. Hashing is done by userModel.pre('save').
      const user = await User.create({
        name,
        email,
        password: password, 
        role,
        institutionId
      });
      
      // Generate token
      const token = this.generateToken(user);
      
      return {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            institutionId: user.institutionId
          },
          token
        }
      };
    } catch (error) {
      // Use error handler middleware for validation errors
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
      
      // Use the model's method to compare the entered password with the hashed one
      const isMatch = await user.matchPassword(password); 
      
      if (!isMatch) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
      
      // Generate token
      const token = this.generateToken(user);
      
      return {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            institutionId: user.institutionId
          },
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();