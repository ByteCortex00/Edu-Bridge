// backend/controllers/authController.js
import authService from '../services/authService.js';
import User from '../models/userModel.js';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, institutionId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const result = await authService.register({
      name,
      email,
      password,
      role,
      institutionId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const clerkId = req.clerk?.sub;

    // Find by Clerk ID instead of req.user.id
    const user = await User.findOne({ clerkId })
      .select('-password')
      .populate('institutionId', 'name type');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

/**
 * @desc    Sync Clerk user with database
 * @route   POST /api/auth/sync-clerk-user
 * @access  Private (Clerk authenticated)
 */
export const syncClerkUser = async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, profileImage, publicMetadata } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Clerk ID and email are required'
      });
    }

    // 1. Find existing user first
    let user = await User.findOne({ clerkId: clerkId });

    // Fallback: Check by email if not found by Clerk ID
    if (!user) {
      user = await User.findOne({ email: email });
    }

    // 2. Determine Role and Institution
    // Priority: Existing DB Value > Clerk Metadata > Default
    let role = user?.role || publicMetadata?.role;
    let institutionId = user?.institutionId || publicMetadata?.institutionId;

    // Set default role if nothing exists
    if (!role) {
      if (email.includes('admin')) {
        role = 'admin';
      } else if (email.includes('institution') || email.includes('uni') || email.includes('edu')) {
        role = 'institution';
      } else {
        role = 'viewer';
      }
    }

    // 3. Prepare Update Data
    // We explicitly set fields to ensure they aren't overwritten with null
    const userData = {
      clerkId,
      email,
      name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
      profileImage: profileImage || null,
      isActive: true,
      role: role, // Use the preserved or determined role
    };

    // Only add institutionId to update if we actually have one (don't overwrite with null)
    if (institutionId) {
      userData.institutionId = institutionId;
    }

    // 4. Update or Create
    if (user) {
      console.log(`🔄 Syncing existing user: ${email} (Role: ${role})`);
      user = await User.findByIdAndUpdate(
        user._id,
        userData,
        { new: true, runValidators: true }
      );
    } else {
      console.log(`✨ Creating new user: ${email} (Role: ${role})`);
      user = await User.create({
        ...userData,
        // For new users, if institutionId is still undefined, it will just be unset, which is fine
        institutionId: institutionId
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User synced successfully'
    });
  } catch (error) {
    console.error('Sync Clerk user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error syncing user'
    });
  }
};

/**
 * @desc    Update user profile (Supports Onboarding)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    // 1. Extract all necessary fields, including role and institutionId
    const { name, email, role, institutionId } = req.body;

    // 2. Get the Clerk ID from the authenticated token
    // protectWithClerk middleware attaches the decoded token to req.clerk
    const clerkId = req.clerk?.sub;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated via Clerk'
      });
    }

    // 3. Find and update the user using Clerk ID
    const user = await User.findOneAndUpdate(
      { clerkId: clerkId },
      {
        name,
        email,
        // Only update role/institution if they are provided (don't overwrite with null)
        ...(role && { role }),
        ...(institutionId && { institutionId })
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};