import { apiClient } from './client';

export const jobsAPI = {
  getAll: async (params) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/jobs/stats');
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/jobs/categories');
    return response.data;
  },

  fetchFromAdzuna: async (params) => {
    const response = await apiClient.get('/jobs/fetch', { params });
    return response.data;
  },

  bulkPopulate: async (config) => {
    const response = await apiClient.post('/jobs/bulk-populate', config);
    return response.data;
  }
};