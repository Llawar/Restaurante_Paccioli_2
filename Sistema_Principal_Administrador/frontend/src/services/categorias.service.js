import api from './api';

export const categoriasApi = {
  getAll: () => api.get('/categorias'),
  getById: (id) => api.get(`/categorias/${id}`),
  create: (data) => api.post('/categorias', data),
  update: (id, data) => api.put(`/categorias/${id}`, data),
  remove: (id) => api.delete(`/categorias/${id}`)
};

export default categoriasApi;