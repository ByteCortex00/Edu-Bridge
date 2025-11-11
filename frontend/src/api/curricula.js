import { apiClient } from './client';

export const curriculaAPI = {
  getAll: async (params) => {
    const response = await apiClient.get('/curricula', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/curricula/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/curricula', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/curricula/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/curricula/${id}`);
    return response.data;
  },

  getSkills: async (id) => {
    const response = await apiClient.get(`/curricula/${id}/skills`);
    return response.data;
  },

  addCourse: async (id, courseData) => {
    const response = await apiClient.post(`/curricula/${id}/courses`, courseData);
    return response.data;
  }
};