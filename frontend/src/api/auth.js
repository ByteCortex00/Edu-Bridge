// api/auth.js
import { apiClient } from './client';

export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      institutionId: userData.institutionId
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  }
};