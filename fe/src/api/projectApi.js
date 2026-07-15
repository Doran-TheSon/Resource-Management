import api from './client';

export const projectApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams({
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...(params.status && { status: params.status }),
      ...(params.customer && { customer: params.customer }),
    }).toString();
    return api.get(`/projects?${query}`);
  },

  getById: (id) => api.get(`/projects/${id}`),

  create: (data) => api.post('/projects', data),

  update: (id, data) => api.put(`/projects/${id}`, data),
};
