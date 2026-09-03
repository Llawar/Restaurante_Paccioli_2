import axios from 'axios';

const HOST = window.location.hostname;
const API_URL = import.meta.env.VITE_API_URL || `http://${HOST}:3007/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {},
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => { return Promise.reject(error); }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
