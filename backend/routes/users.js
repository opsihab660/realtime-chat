import express from 'express';
import { query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (for chat user list)
router.get('/', authenticateToken, [
  query('search')
    .optional()
    .trim()
    .custom((value) => {
      // Allow empty string or valid length
      if (value === '' || (value && value.length >= 1 && value.length <= 50)) {
        return true;
      }
      throw new Error('Search query must be between 1 and 50 characters');
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    console.log('📥 GET /users - User:', req.user?.username);
    console.log('📥 Query params:', req.query);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { search, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {
      _id: { $ne: currentUserId }, // Exclude current user
      'privacy.allowDirectMessages': true // Only users who allow DMs
    };

    if (search) {
      searchQuery.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users
    const users = await User.find(searchQuery)
      .select('username email avatar bio isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    res.json({
      users: users.map(user => user.getPublicProfile()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to get users',
      error: 'GET_USERS_ERROR'
    });
  }
});

// Get online users
router.get('/online', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const onlineUsers = await User.find({
      _id: { $ne: currentUserId },
      isOnline: true,
      'privacy.showOnlineStatus': true,
      'privacy.allowDirectMessages': true
    })
    .select('username avatar bio isOnline lastSeen')
    .sort({ lastSeen: -1 })
    .limit(50);

    res.json({
      users: onlineUsers.map(user => user.getPublicProfile()),
      count: onlineUsers.length
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      message: 'Failed to get online users',
      error: 'GET_ONLINE_USERS_ERROR'
    });
  }
});

// Get user by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Don't allow getting own profile through this route
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        message: 'Use /auth/me to get your own profile',
        error: 'INVALID_REQUEST'
      });
    }

    const user = await User.findById(userId)
      .select('username avatar bio isOnline lastSeen privacy');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user allows direct messages
    if (!user.privacy.allowDirectMessages) {
      return res.status(403).json({
        message: 'This user does not allow direct messages',
        error: 'DM_NOT_ALLOWED'
      });
    }

    res.json({
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to get user',
      error: 'GET_USER_ERROR'
    });
  }
});

// Block/Unblock user
router.post('/:userId/block', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    if (userId === currentUser._id.toString()) {
      return res.status(400).json({
        message: 'You cannot block yourself',
        error: 'INVALID_REQUEST'
      });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if already blocked
    const isBlocked = currentUser.blockedUsers.includes(userId);

    if (isBlocked) {
      // Unblock user
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        id => id.toString() !== userId
      );
      await currentUser.save();

      res.json({
        message: 'User unblocked successfully',
        action: 'unblocked'
      });
    } else {
      // Block user
      currentUser.blockedUsers.push(userId);
      await currentUser.save();

      res.json({
        message: 'User blocked successfully',
        action: 'blocked'
      });
    }

  } catch (error) {
    console.error('Block/Unblock user error:', error);
    res.status(500).json({
      message: 'Failed to block/unblock user',
      error: 'BLOCK_USER_ERROR'
    });
  }
});

// Get blocked users
router.get('/blocked/list', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username avatar bio');

    res.json({
      blockedUsers: user.blockedUsers.map(user => user.getPublicProfile())
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      message: 'Failed to get blocked users',
      error: 'GET_BLOCKED_USERS_ERROR'
    });
  }
});

export default router;
