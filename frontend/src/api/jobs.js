import { useAPI } from './client';

export const useJobsAPI = () => {
  const apiClient = useAPI();

  return {
    getAll: async (params) => {
      const response = await apiClient.get('/jobs', { params });
      return response;
    },

    getById: async (id) => {
      const response = await apiClient.get(`/jobs/${id}`);
      return response;
    },

    getStats: async () => {
      const response = await apiClient.get('/jobs/stats');
      return response;
    },

    getCategories: async () => {
      const response = await apiClient.get('/jobs/categories');
      return response;
    },

    fetchFromAdzuna: async (params) => {
      const response = await apiClient.get('/jobs/fetch', { params });
      return response;
    },

    bulkPopulate: async (config) => {
      const response = await apiClient.post('/jobs/bulk-populate', config);
      return response;
    }
  };
};