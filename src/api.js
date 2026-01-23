import axios from 'axios';

// Derive a sensible default API base URL for LAN/mobile testing
// If VITE_API_BASE_URL is not set, use current host with port 3000
const defaultApiBase = (() => {
  try {
    const { protocol, hostname } = window.location;
    // Fallback to http if protocol is file:
    const proto = protocol && protocol.startsWith('http') ? protocol : 'http:';
    const port = import.meta.env.VITE_API_PORT || 3000;
    return `${proto}//${hostname}:${port}/v1`;
  } catch {
    return 'http://localhost:3000/v1';
  }
})();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
