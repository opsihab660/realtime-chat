import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Check if user is online
export const requireOnlineStatus = (req, res, next) => {
  if (!req.user.isOnline) {
    return res.status(403).json({ 
      message: 'User must be online to perform this action',
      error: 'USER_OFFLINE'
    });
  }
  next();
};

// Rate limiting for sensitive operations
export const sensitiveOperationLimit = (req, res, next) => {
  // This would typically use Redis for production
  // For now, we'll use a simple in-memory store
  const userLimits = global.userLimits || (global.userLimits = new Map());
  const userId = req.user._id.toString();
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  if (!userLimits.has(userId)) {
    userLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = userLimits.get(userId);

  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }

  userLimit.count++;
  next();
};

// Validate user permissions for conversation
export const validateConversationAccess = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Import here to avoid circular dependency
    const Conversation = (await import('../models/Conversation.js')).default;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        error: 'CONVERSATION_NOT_FOUND'
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      participantId => participantId.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: 'Access denied to this conversation',
        error: 'ACCESS_DENIED'
      });
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    console.error('Conversation access validation error:', error);
    res.status(500).json({
      message: 'Error validating conversation access',
      error: 'VALIDATION_ERROR'
    });
  }
};

// Validate message ownership
export const validateMessageOwnership = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Import here to avoid circular dependency
    const Message = (await import('../models/Message.js')).default;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        error: 'MESSAGE_NOT_FOUND'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only modify your own messages',
        error: 'ACCESS_DENIED'
      });
    }

    req.message = message;
    next();
  } catch (error) {
    console.error('Message ownership validation error:', error);
    res.status(500).json({
      message: 'Error validating message ownership',
      error: 'VALIDATION_ERROR'
    });
  }
};

export default {
  authenticateToken,
  optionalAuth,
  requireOnlineStatus,
  sensitiveOperationLimit,
  validateConversationAccess,
  validateMessageOwnership
};
