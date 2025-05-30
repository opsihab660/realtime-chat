import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  isArchived: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isMuted: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedAt: {
      type: Date,
      default: Date.now
    },
    mutedUntil: {
      type: Date
    }
  }],
  typing: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    conversationType: {
      type: String,
      enum: ['direct'],
      default: 'direct'
    }
  }
}, {
  timestamps: true
});

// 🚀 PERFORMANCE OPTIMIZATION: Add database indexes
conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ 'isArchived.user': 1 });
conversationSchema.index({ participants: 1, 'isArchived.user': 1 });
conversationSchema.index({ participants: 1 });

// Ensure only 2 participants for direct messages
conversationSchema.pre('save', function(next) {
  if (this.metadata.conversationType === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  next();
});

// Method to update last activity
conversationSchema.methods.updateLastActivity = async function(messageId = null) {
  try {
    // Use atomic update to avoid version conflicts
    const updateData = { lastActivity: new Date() };
    if (messageId) {
      updateData.lastMessage = messageId;
    }

    await this.constructor.findByIdAndUpdate(
      this._id,
      updateData,
      { new: true }
    );
  } catch (error) {
    console.error('Error updating last activity:', error);
    // Fallback to instance method
    this.lastActivity = new Date();
    if (messageId) {
      this.lastMessage = messageId;
    }
    return this.save();
  }
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = async function(userId) {
  try {
    // Use atomic update to avoid version conflicts
    const result = await this.constructor.findOneAndUpdate(
      {
        _id: this._id,
        'unreadCount.user': userId
      },
      {
        $inc: { 'unreadCount.$.count': 1 }
      },
      { new: true }
    );

    // If user not found in unreadCount array, add them
    if (!result) {
      await this.constructor.findByIdAndUpdate(
        this._id,
        {
          $push: { unreadCount: { user: userId, count: 1 } }
        },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error incrementing unread count:', error);
    // Fallback to simple increment if atomic update fails
    const userUnread = this.unreadCount.find(u => u.user.toString() === userId.toString());

    if (userUnread) {
      userUnread.count += 1;
    } else {
      this.unreadCount.push({
        user: userId,
        count: 1
      });
    }

    return this.save();
  }
};

// Method to reset unread count for a user using atomic operations
conversationSchema.methods.resetUnreadCount = async function(userId) {
  try {
    // Use atomic operation to avoid version conflicts
    await this.constructor.updateOne(
      { _id: this._id, 'unreadCount.user': userId },
      {
        $set: { 'unreadCount.$.count': 0 }
      }
    );

    return true;
  } catch (error) {
    console.error('Error resetting unread count:', error);
    return false;
  }
};

// Method to add typing indicator using atomic operations
conversationSchema.methods.addTyping = async function(userId) {
  try {
    // Use a single atomic operation to replace existing typing indicator
    await this.constructor.updateOne(
      { _id: this._id },
      {
        $pull: { typing: { user: userId } } // Remove existing typing indicator
      }
    );

    // Add new typing indicator in a separate operation
    await this.constructor.updateOne(
      { _id: this._id },
      {
        $push: {
          typing: {
            user: userId,
            startedAt: new Date()
          }
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Error adding typing indicator:', error);
    // Don't throw the error, just log it and return false
    return false;
  }
};

// Method to remove typing indicator using atomic operations
conversationSchema.methods.removeTyping = async function(userId) {
  try {
    // Use atomic operation to avoid version conflicts
    await this.constructor.updateOne(
      { _id: this._id },
      {
        $pull: { typing: { user: userId } }
      }
    );

    return true;
  } catch (error) {
    console.error('Error removing typing indicator:', error);
    return false;
  }
};

// Method to archive conversation for a user
conversationSchema.methods.archiveForUser = function(userId) {
  const existingArchive = this.isArchived.find(a => a.user.toString() === userId.toString());

  if (!existingArchive) {
    this.isArchived.push({
      user: userId,
      archivedAt: new Date()
    });
  }

  return this.save();
};

// Method to unarchive conversation for a user
conversationSchema.methods.unarchiveForUser = function(userId) {
  this.isArchived = this.isArchived.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};

// Method to pin conversation for a user
conversationSchema.methods.pinForUser = function(userId) {
  const existingPin = this.isPinned.find(p => p.user.toString() === userId.toString());

  if (!existingPin) {
    this.isPinned.push({
      user: userId,
      pinnedAt: new Date()
    });
  }

  return this.save();
};

// Method to unpin conversation for a user
conversationSchema.methods.unpinForUser = function(userId) {
  this.isPinned = this.isPinned.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Static method to find or create conversation between users
conversationSchema.statics.findOrCreateDirectConversation = async function(user1Id, user2Id) {
  let conversation = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    'metadata.conversationType': 'direct'
  }).populate('participants', 'username avatar isOnline lastSeen')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      participants: [user1Id, user2Id],
      metadata: {
        conversationType: 'direct',
        createdBy: user1Id
      }
    });

    conversation = await conversation.populate('participants', 'username avatar isOnline lastSeen');
  }

  return conversation;
};

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  return this.find({
    participants: userId,
    'isArchived.user': { $ne: userId }
  })
  .populate('participants', 'username avatar isOnline lastSeen')
  .populate('lastMessage')
  .sort({ lastActivity: -1 })
  .skip(skip)
  .limit(limit);
};

export default mongoose.model('Conversation', conversationSchema);
