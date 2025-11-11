import { apiClient } from './client';

export const analyticsAPI = {
  analyzeGap: async (curriculumId, options) => {
    const response = await apiClient.post(`/analytics/analyze/${curriculumId}`, options);
    return response.data;
  },

  getLatest: async (curriculumId) => {
    const response = await apiClient.get(`/analytics/latest/${curriculumId}`);
    return response.data;
  },

  getTrends: async (curriculumId) => {
    const response = await apiClient.get(`/analytics/trends/${curriculumId}`);
    return response.data;
  },

  getTopSkills: async (params) => {
    const response = await apiClient.get('/analytics/top-skills', { params });
    return response.data;
  },

  comparePrograms: async (curriculumIds) => {
    const response = await apiClient.post('/analytics/compare', { curriculumIds });
    return response.data;
  },

  getDashboard: async (institutionId) => {
    const response = await apiClient.get(`/analytics/dashboard/${institutionId}`);
    return response.data;
  }
};