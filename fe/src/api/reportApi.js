import api from './client';

export const reportApi = {
  getUtilization: () => api.get('/reports/utilization'),

  getAvailableResources: () => api.get('/reports/available-resources'),

  getOverloaded: () => api.get('/reports/overloaded'),
};
