import request from 'supertest';
import app from '../server.js'; // Ensure app is exported in server.js
import User from '../models/userModel.js';

// We need to ensure the server isn't listening on a port during tests
// Modify backend/server.js to export 'app' and only listen if not in test mode

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'institution'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('should login an existing user', async () => {
    // Create user first
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'institution'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.token).toBeDefined();
  });
});