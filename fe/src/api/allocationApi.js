import api from './client';

export const allocationApi = {
  getAll: () => api.get('/allocations'),

  getById: (id) => api.get(`/allocations/${id}`),

  create: (data) => api.post('/allocations', data),

  update: (id, data) => api.put(`/allocations/${id}`, data),

  delete: (id) => api.delete(`/allocations/${id}`),
};
