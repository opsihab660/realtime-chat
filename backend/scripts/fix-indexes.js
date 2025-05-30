import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const conversationsCollection = db.collection('conversations');

    console.log('📋 Current indexes:');
    const indexes = await conversationsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    console.log('\n🗑️ Dropping problematic indexes...');
    
    try {
      // Drop the problematic compound index
      await conversationsCollection.dropIndex({ participants: 1, lastActivity: -1 });
      console.log('✅ Dropped participants + lastActivity index');
    } catch (error) {
      console.log('⚠️ Index participants + lastActivity not found or already dropped');
    }

    try {
      // Drop the problematic compound index with isArchived
      await conversationsCollection.dropIndex({ participants: 1, 'isArchived.user': 1 });
      console.log('✅ Dropped participants + isArchived index');
    } catch (error) {
      console.log('⚠️ Index participants + isArchived not found or already dropped');
    }

    console.log('\n📋 Remaining indexes:');
    const remainingIndexes = await conversationsCollection.indexes();
    remainingIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    console.log('\n✅ Index cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixIndexes();
