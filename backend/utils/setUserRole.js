// backend/utils/setUserRole.js
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const setUserRole = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ FATAL: MONGO_URI is not set');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all users with 'viewer' role to 'institution'
    const result = await User.updateMany(
      { role: 'viewer' },
      { role: 'institution' }
    );

    console.log(`✅ Updated ${result.modifiedCount} users from 'viewer' to 'institution'`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

setUserRole();