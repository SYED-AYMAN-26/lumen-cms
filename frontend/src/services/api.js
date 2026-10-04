import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export function getToken() {
  return localStorage.getItem('lumen_token') || sessionStorage.getItem('lumen_token') || '';
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/config')) {
      localStorage.removeItem('lumen_token');
      sessionStorage.removeItem('lumen_token');
      if (!window.location.pathname.startsWith('/login')) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
