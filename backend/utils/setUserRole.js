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

    // Update user role - replace with actual email and desired role
    const email = 'your-email@example.com'; // Replace with actual user email
    const role = 'institution'; // or 'admin'

    const user = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (user) {
      console.log(`✅ Updated user ${email} to role: ${role}`);
    } else {
      console.log(`❌ User ${email} not found`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

setUserRole();