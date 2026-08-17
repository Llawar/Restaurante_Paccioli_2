import api from './api';

export const puestosApi = {
  getAll: () => api.get('/cocina/puestos'),
  getById: (id) => api.get(`/cocina/puestos/${id}`),
  create: (data) => api.post('/cocina/puestos', data),
  update: (id, data) => api.put(`/cocina/puestos/${id}`, data),
  remove: (id) => api.delete(`/cocina/puestos/${id}`)
};

export default puestosApi;