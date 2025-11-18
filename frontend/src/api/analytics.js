import { useAPI } from './client';

export const useAnalyticsAPI = () => {
  const apiClient = useAPI();

  return {
    analyzeGap: async (curriculumId, options) => {
      const response = await apiClient.post(`/analytics/analyze/${curriculumId}`, options);
      return response;
    },

    getLatest: async (curriculumId) => {
      const response = await apiClient.get(`/analytics/latest/${curriculumId}`);
      return response;
    },

    getTrends: async (curriculumId) => {
      const response = await apiClient.get(`/analytics/trends/${curriculumId}`);
      return response;
    },

    getTopSkills: async (params) => {
      const response = await apiClient.get('/analytics/top-skills', { params });
      return response;
    },

    comparePrograms: async (curriculumIds) => {
      const response = await apiClient.post('/analytics/compare', { curriculumIds });
      return response;
    },

    getDashboard: async (institutionId) => {
      const response = await apiClient.get(`/analytics/dashboard/${institutionId}`);
      return response;
    }
  };
};