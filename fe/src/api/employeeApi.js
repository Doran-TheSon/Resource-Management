import api from './client';

export const employeeApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams({
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...(params.department && { department: params.department }),
      ...(params.role && { role: params.role }),
    }).toString();
    return api.get(`/employees?${query}`);
  },

  getById: (id) => api.get(`/employees/${id}`),

  create: (data) => api.post('/employees', data),

  update: (id, data) => api.put(`/employees/${id}`, data),
};
