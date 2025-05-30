import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  fullName: {
    type: String,
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [50, 'Full name cannot exceed 50 characters'],
    default: function() {
      return this.username || 'User';
    }
  },
  displayName: {
    type: String,
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters long'],
    maxlength: [30, 'Display name cannot exceed 30 characters'],
    default: function() {
      return this.username || 'User';
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null/undefined for existing users
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age >= 13 && age <= 120; // Minimum age 13, maximum 120
      },
      message: 'You must be at least 13 years old to register'
    },
    default: null
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say'],
      message: 'Gender must be one of: male, female, other, prefer-not-to-say'
    },
    default: 'prefer-not-to-say'
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notifications: {
    sound: {
      type: Boolean,
      default: true
    },
    desktop: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  privacy: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    showLastSeen: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    }
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ isOnline: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Set online status
userSchema.methods.setOnlineStatus = function(isOnline, socketId = null) {
  this.isOnline = isOnline;
  this.socketId = socketId;
  if (!isOnline) {
    this.lastSeen = new Date();
  }
  return this.save();
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.email;
  delete user.socketId;
  delete user.blockedUsers;
  return user;
};

// Get safe profile (for authenticated users)
userSchema.methods.getSafeProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.socketId;
  return user;
};

export default mongoose.model('User', userSchema);
