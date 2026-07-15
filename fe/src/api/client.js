import { API_BASE_URL } from '../utils/constants';

/**
 * Enhanced fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Network error — unable to connect to server', 'NETWORK_ERROR', 0);
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return null;
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      json.message || `Request failed with status ${response.status}`,
      json.errorCode || 'UNKNOWN_ERROR',
      response.status,
      json.errors || null
    );
  }

  return json.data !== undefined ? json.data : json;
}

export class ApiError extends Error {
  constructor(message, code, status, fields = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
