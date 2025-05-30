import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for migration');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User schema (simplified for migration)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
  displayName: String,
  dateOfBirth: Date,
  gender: String,
  avatar: String,
  bio: String,
  isOnline: Boolean,
  lastSeen: Date,
  socketId: String,
  theme: String,
  notifications: Object,
  privacy: Object,
  blockedUsers: Array,
  friends: Array
}, {
  timestamps: true,
  strict: false // Allow fields not in schema during migration
});

const User = mongoose.model('User', userSchema);

const migrateUsers = async () => {
  try {
    console.log('🔄 Starting user migration...');

    // Find users without the new required fields
    const usersToUpdate = await User.find({
      $or: [
        { fullName: { $exists: false } },
        { displayName: { $exists: false } },
        { dateOfBirth: { $exists: false } },
        { gender: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to migrate`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need migration');
      return;
    }

    // Update each user using updateOne to avoid validation issues
    for (const user of usersToUpdate) {
      const updateData = {};

      // Set fullName if missing
      if (!user.fullName) {
        updateData.fullName = user.username || 'User';
      }

      // Set displayName if missing (make it unique)
      if (!user.displayName) {
        let displayName = user.username || 'User';

        // Check if displayName already exists
        const existingUser = await User.findOne({ displayName });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          displayName = `${displayName}_${user._id.toString().slice(-4)}`;
        }

        updateData.displayName = displayName;
      }

      // Set dateOfBirth if missing (default to 18 years ago)
      if (!user.dateOfBirth) {
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        updateData.dateOfBirth = eighteenYearsAgo;
      }

      // Set gender if missing
      if (!user.gender) {
        updateData.gender = 'prefer-not-to-say';
      }

      // Update the user directly in database
      await User.updateOne(
        { _id: user._id },
        { $set: updateData },
        { runValidators: false } // Skip validation during migration
      );

      console.log(`✅ Updated user: ${user.username || user.email} with data:`, updateData);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateUsers();
    console.log('✅ Migration script completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateUsers };
