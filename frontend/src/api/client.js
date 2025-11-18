// api/client.js
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const useAPI = () => {
  const { getToken } = useAuth();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  apiClient.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting Clerk token:', error);
    }
    return config;
  });

  // Response interceptor
  apiClient.interceptors.response.use(
    (response) => response.data, // Return just the data
    (error) => {
      if (error.response?.status === 401) {
        // Redirect to sign-in page
        window.location.href = '/sign-in';
      }

      // Extract error message
      const message = error.response?.data?.message || error.message || 'An error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return apiClient;
};