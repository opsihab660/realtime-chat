import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\u0980-\u09FF]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Display name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9\s\u0980-\u09FF_-]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, underscores, and hyphens'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      let calculatedAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      if (calculatedAge < 13) {
        throw new Error('You must be at least 13 years old to register');
      }
      if (calculatedAge > 120) {
        throw new Error('Please enter a valid date of birth');
      }
      return true;
    }),
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Please select a valid gender option')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName, displayName, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
        error: 'USER_EXISTS'
      });
    }

    // Check if display name is already taken
    const existingDisplayName = await User.findOne({ displayName });
    if (existingDisplayName) {
      return res.status(409).json({
        message: 'Display name already taken',
        error: 'DISPLAY_NAME_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName,
      displayName,
      dateOfBirth,
      gender
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = user.getSafeProfile();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Update last seen and online status
    await user.setOnlineStatus(true);

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = user.getSafeProfile();

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Set user offline
    await req.user.setOnlineStatus(false);

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout failed',
      error: 'LOGOUT_ERROR'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userData = req.user.getSafeProfile();

    res.json({
      user: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: 'PROFILE_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, bio, theme, notifications, privacy } = req.body;
    const user = req.user;

    // Check if username is taken (if being updated)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          message: 'Username already taken',
          error: 'USERNAME_TAKEN'
        });
      }
      user.username = username;
    }

    // Update other fields
    if (bio !== undefined) user.bio = bio;
    if (theme) user.theme = theme;
    if (notifications) user.notifications = { ...user.notifications, ...notifications };
    if (privacy) user.privacy = { ...user.privacy, ...privacy };

    await user.save();

    const userData = user.getSafeProfile();

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: 'UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        error: 'INVALID_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user.getSafeProfile()
  });
});

export default router;
