import api from './client';

export const aiApi = {
  recommend: (query) => api.post('/ai/recommend', { query }),

  analyzeRisk: (query) => api.post('/ai/risk-analysis', { query }),
};
