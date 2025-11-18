// api/auth.js
import { useAPI } from './client';

export const useAuthAPI = () => {
  const apiClient = useAPI();

  return {
    login: async (email, password) => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response;
    },

    register: async (userData) => {
      const response = await apiClient.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        institutionId: userData.institutionId
      });
      return response;
    },

    syncClerkUser: async (clerkUser) => {
      const response = await apiClient.post('/auth/sync-clerk-user', {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImage: clerkUser.imageUrl,
        publicMetadata: clerkUser.publicMetadata
      });
      return response;
    },

    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/me');
      return response;
    },

    updateProfile: async (data) => {
      const response = await apiClient.put('/auth/profile', data);
      return response;
    }
  };
};