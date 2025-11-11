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
      console.log('📝 Registration attempt for email:', email, 'role:', role);

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('❌ User already exists:', email);
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
      console.log('✅ Registration successful for user:', email);

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
      console.log('❌ Registration error:', error.message);
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
      console.log('🔐 Login attempt for email:', email);
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        console.log('❌ User not found for email:', email);
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Use the model's method to compare the entered password with the hashed one
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        console.log('❌ Password mismatch for user:', email);
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate token
      const token = this.generateToken(user);
      console.log('✅ Login successful for user:', email);

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
      console.log('❌ Login error:', error.message);
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