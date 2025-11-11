// backend/utils/createAdminUser.js
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
import path from 'path'; // <-- ADD path
import { fileURLToPath } from 'url'; // <-- ADD fileURLToPath

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url); // <-- NEW
const __dirname = path.dirname(__filename); // <-- NEW

// Load environment variables from the parent directory (backend/)
dotenv.config({ path: path.join(__dirname, '..', '.env') }); // <-- MODIFIED

const createAdminUser = async () => {
  try {
    // Check if MONGO_URI is defined before connecting
    if (!process.env.MONGO_URI) {
        console.error('❌ FATAL: MONGO_URI is not set or .env file was not loaded correctly.');
        return;
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@edubridge.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Password: password123`);
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@edubridge.com',
      password: 'password123', // This will be hashed automatically
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@edubridge.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: admin');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdminUser();