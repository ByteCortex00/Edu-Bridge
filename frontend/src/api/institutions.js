import { useAPI } from './client';

export const useInstitutionsAPI = () => {
  const apiClient = useAPI();

  return {
    getAll: async (params) => {
      const response = await apiClient.get('/institutions', { params });
      return response;
    },

    getById: async (id) => {
      const response = await apiClient.get(`/institutions/${id}`);
      return response;
    },

    create: async (data) => {
      const response = await apiClient.post('/institutions', {
        name: data.name,
        type: data.type,
        location: {
          country: data.country,
          city: data.city
        },
        contactEmail: data.contactEmail
      });
      return response;
    },

    update: async (id, data) => {
      const response = await apiClient.put(`/institutions/${id}`, {
        name: data.name,
        type: data.type,
        location: {
          country: data.country,
          city: data.city
        },
        contactEmail: data.contactEmail
      });
      return response;
    },

    delete: async (id) => {
      const response = await apiClient.delete(`/institutions/${id}`);
      return response;
    },

    getStats: async (id) => {
      const response = await apiClient.get(`/institutions/${id}/stats`);
      return response;
    }
  };
};