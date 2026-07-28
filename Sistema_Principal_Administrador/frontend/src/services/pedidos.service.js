import api from './api';

export const pedidosApi = {
  // Obtener todos los pedidos
  getAll: () => api.get('/pedidos'),
  
  // Obtener un pedido por ID
  getById: (id) => api.get(`/pedidos/${id}`),
  
  // Crear nuevo pedido
  create: (data) => api.post('/pedidos', data),
  
  // Actualizar pedido
  update: (id, data) => api.put(`/pedidos/${id}`, data),
  
  // Actualizar estado del pedido
  updateEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),
  
  // Obtener pedidos por estado
  getByEstado: (estado) => api.get(`/pedidos/estado/${estado}`),
  
  // Obtener estadísticas de pedidos
  getStats: () => api.get('/pedidos/stats/dashboard')
};

export default pedidosApi;
