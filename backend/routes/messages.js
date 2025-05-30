import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { authenticateToken, validateConversationAccess, validateMessageOwnership } from '../middleware/auth.js';

const router = express.Router();

// Get conversations for current user
router.get('/conversations', authenticateToken, [
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
    console.log('📥 GET /conversations - User:', req.user?.username);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    console.log('🔍 Fetching conversations for user:', userId);
    const conversations = await Conversation.getUserConversations(userId, page, limit);
    console.log('📋 Found conversations:', conversations.length);

    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map(conv => {
      const userUnread = conv.unreadCount.find(u => u.user.toString() === userId.toString());
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId.toString());

      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount: userUnread ? userUnread.count : 0,
        isPinned: conv.isPinned.some(p => p.user.toString() === userId.toString()),
        isMuted: conv.isMuted.some(m => m.user.toString() === userId.toString()),
        typing: conv.typing.filter(t => t.user.toString() !== userId.toString())
      };
    });

    res.json({
      conversations: conversationsWithUnread,
      pagination: {
        currentPage: parseInt(page),
        hasNext: conversations.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Failed to get conversations',
      error: 'GET_CONVERSATIONS_ERROR'
    });
  }
});

// Start or get conversation with a user
router.post('/conversations', authenticateToken, [
  body('recipientId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid recipient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientId } = req.body;
    const senderId = req.user._id;

    // Check if trying to start conversation with self
    if (recipientId === senderId.toString()) {
      return res.status(400).json({
        message: 'Cannot start conversation with yourself',
        error: 'INVALID_RECIPIENT'
      });
    }

    // Check if recipient exists and allows DMs
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        message: 'Recipient not found',
        error: 'RECIPIENT_NOT_FOUND'
      });
    }

    if (!recipient.privacy.allowDirectMessages) {
      return res.status(403).json({
        message: 'This user does not allow direct messages',
        error: 'DM_NOT_ALLOWED'
      });
    }

    // Check if sender is blocked by recipient
    if (recipient.blockedUsers.includes(senderId)) {
      return res.status(403).json({
        message: 'You are blocked by this user',
        error: 'USER_BLOCKED'
      });
    }

    // Check if recipient is blocked by sender
    if (req.user.blockedUsers.includes(recipientId)) {
      return res.status(403).json({
        message: 'You have blocked this user',
        error: 'RECIPIENT_BLOCKED'
      });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateDirectConversation(senderId, recipientId);

    res.json({
      conversation: {
        _id: conversation._id,
        participant: conversation.participants.find(p => p._id.toString() !== senderId.toString()),
        lastMessage: conversation.lastMessage,
        lastActivity: conversation.lastActivity,
        unreadCount: 0
      }
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      message: 'Failed to start conversation',
      error: 'START_CONVERSATION_ERROR'
    });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, validateConversationAccess, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    const conversation = req.conversation;

    // Get the other participant
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== userId.toString()
    );

    // Get messages between the two users
    const messages = await Message.getConversation(userId, otherParticipant, page, limit);

    // Mark messages as read
    const unreadMessages = messages.filter(msg =>
      msg.recipient.toString() === userId.toString() &&
      !msg.readBy.some(read => read.user.toString() === userId.toString())
    );

    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map(msg => msg.markAsRead(userId)));
      await conversation.resetUnreadCount(userId);
    }

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: parseInt(page),
        hasNext: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Failed to get messages',
      error: 'GET_MESSAGES_ERROR'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, validateConversationAccess, [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'emoji'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, type = 'text', replyTo } = req.body;
    const { conversationId } = req.params;
    const senderId = req.user._id;
    const conversation = req.conversation;

    // Get recipient
    const recipientId = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );

    // Validate content based on type
    if (type === 'text' && !content) {
      return res.status(400).json({
        message: 'Text messages require content',
        error: 'CONTENT_REQUIRED'
      });
    }

    // Create message
    const messageData = {
      sender: senderId,
      recipient: recipientId,
      content,
      type
    };

    if (replyTo) {
      // Validate reply message exists and is in this conversation
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage ||
          (replyMessage.sender.toString() !== senderId.toString() &&
           replyMessage.sender.toString() !== recipientId.toString()) ||
          (replyMessage.recipient.toString() !== senderId.toString() &&
           replyMessage.recipient.toString() !== recipientId.toString())) {
        return res.status(400).json({
          message: 'Invalid reply message',
          error: 'INVALID_REPLY'
        });
      }
      messageData.replyTo = replyTo;
    }

    const message = new Message(messageData);
    await message.save();

    // Populate message
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');
    if (replyTo) {
      await message.populate({
        path: 'replyTo',
        select: 'content sender createdAt',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });
    }

    // Update conversation
    await conversation.updateLastActivity(message._id);
    await conversation.incrementUnreadCount(recipientId);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Failed to send message',
      error: 'SEND_MESSAGE_ERROR'
    });
  }
});

// Edit a message
router.put('/messages/:messageId', authenticateToken, [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        error: 'MESSAGE_NOT_FOUND'
      });
    }

    // Check if user can edit this message (only sender can edit)
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only edit your own messages',
        error: 'UNAUTHORIZED_EDIT'
      });
    }

    // Check if message is deleted
    if (message.deleted.isDeleted) {
      return res.status(400).json({
        message: 'Cannot edit deleted message',
        error: 'MESSAGE_DELETED'
      });
    }

    // Check if message type is text (only text messages can be edited)
    if (message.type !== 'text') {
      return res.status(400).json({
        message: 'Only text messages can be edited',
        error: 'INVALID_MESSAGE_TYPE'
      });
    }

    // Check edit time limit (15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();

    if (timeSinceCreation > editTimeLimit) {
      return res.status(400).json({
        message: 'Message can only be edited within 15 minutes of sending',
        error: 'EDIT_TIME_EXPIRED'
      });
    }

    // Check if content is actually different
    if (message.content === content) {
      return res.status(400).json({
        message: 'New content must be different from current content',
        error: 'NO_CHANGES'
      });
    }

    // Edit the message
    await message.editMessage(content);

    // Populate the message for response
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');

    res.json({
      message: 'Message edited successfully',
      data: message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      message: 'Failed to edit message',
      error: 'EDIT_MESSAGE_ERROR'
    });
  }
});

// Delete a message
router.delete('/messages/:messageId', authenticateToken, [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        error: 'MESSAGE_NOT_FOUND'
      });
    }

    // Check if user can delete this message (only sender can delete)
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only delete your own messages',
        error: 'UNAUTHORIZED_DELETE'
      });
    }

    // Check if message is already deleted
    if (message.deleted.isDeleted) {
      return res.status(400).json({
        message: 'Message is already deleted',
        error: 'ALREADY_DELETED'
      });
    }

    // Mark message as deleted
    message.deleted.isDeleted = true;
    message.deleted.deletedAt = new Date();
    message.deleted.deletedBy = req.user.id;
    await message.save();

    res.json({
      message: 'Message deleted successfully',
      data: {
        messageId,
        deletedAt: message.deleted.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Failed to delete message',
      error: 'DELETE_MESSAGE_ERROR'
    });
  }
});

export default router;
