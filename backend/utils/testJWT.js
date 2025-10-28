// backend/utils/testJWT.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from backend/.env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔐 Testing JWT Configuration...\n');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set in environment variables');
  process.exit(1);
}

if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_min_32_chars') {
  console.error('❌ Please change the default JWT_SECRET in your .env file');
  process.exit(1);
}

console.log('✅ JWT_SECRET is properly configured');
console.log(`✅ JWT_EXPIRE: ${process.env.JWT_EXPIRE || 'Not set (using default)'}\n`);

// Test token generation
const testPayload = {
  id: '507f1f77bcf86cd799439011',
  role: 'admin',
  email: 'test@example.com'
};

try {
  // Generate token
  const token = jwt.sign(testPayload, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRE || '1h' 
  });

  console.log('✅ Token Generated Successfully:');
  console.log('Token:', token);
  console.log('Length:', token.length, 'characters');
  
  // Decode without verification to show structure
  const decodedWithoutVerify = jwt.decode(token);
  console.log('\n📋 Token Structure (decoded):');
  console.log(decodedWithoutVerify);

  // Test token verification
  console.log('\n🔍 Verifying Token...');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  console.log('✅ Token Verified Successfully:');
  console.log('Payload:', decoded);
  console.log('Expires:', new Date(decoded.iat * 1000).toISOString());
  console.log('Issued At:', new Date(decoded.exp * 1000).toISOString());

  // Test with wrong secret
  console.log('\n🚨 Testing with wrong secret...');
  try {
    jwt.verify(token, 'wrong_secret');
    console.log('❌ FAILED: Should have rejected wrong secret');
  } catch (error) {
    console.log('✅ Correctly rejected token with wrong secret');
  }

  // Test expired token
  console.log('\n⏰ Testing token expiration...');
  const shortLivedToken = jwt.sign(testPayload, process.env.JWT_SECRET, { 
    expiresIn: '1s' 
  });
  
  setTimeout(() => {
    try {
      jwt.verify(shortLivedToken, process.env.JWT_SECRET);
      console.log('❌ FAILED: Should have rejected expired token');
    } catch (error) {
      console.log('✅ Correctly rejected expired token');
      console.log('🎉 All JWT tests passed! Your configuration is working correctly.');
    }
  }, 2000);

} catch (error) {
  console.error('❌ JWT Error:', error.message);
  process.exit(1);
}