import mongoose from "mongoose";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded when this module is imported
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from the backend folder (one level up from config)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set. Make sure .env is present in the backend folder.');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ doesn't require these options but they're harmless if present
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Create performance indexes for analytics queries
    try {
      const db = conn.connection.db;

      // Index for job postings analytics (postedDate + category)
      await db.collection('jobpostings').createIndex(
        { postedDate: -1, category: 1 },
        { name: 'analytics_jobs_date_category' }
      );

      // Index for skills analytics (requiredSkills.category)
      await db.collection('jobpostings').createIndex(
        { 'requiredSkills.category': 1 },
        { name: 'analytics_skills_category' }
      );

      // Compound index for curriculum analysis queries
      await db.collection('jobpostings').createIndex(
        { postedDate: -1, category: 1, 'requiredSkills.category': 1 },
        { name: 'analytics_curriculum_analysis' }
      );

      console.log('✅ Database indexes created for analytics performance');
    } catch (indexError) {
      console.warn('⚠️  Could not create some database indexes:', indexError.message);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Stop the app if connection fails
  }
};
