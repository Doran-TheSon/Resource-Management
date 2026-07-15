import api from './client';

export const workloadApi = {
  getByEmployee: (employeeId) => api.get(`/employees/${employeeId}/workload`),
};
