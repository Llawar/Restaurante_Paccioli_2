import api from './api';

export const inventarioApi = {
  // Obtener todo el inventario
  getAll: () => api.get('/inventario'),
  
  // Obtener item por ID
  getById: (id) => api.get(`/inventario/${id}`),
  
  // Actualizar stock
  updateStock: (id, cantidad) => api.patch(`/inventario/${id}/stock`, { cantidad }),
  
  // Obtener movimientos de inventario
  getMovimientos: (id) => api.get(`/inventario/${id}/movimientos`),
  
  // Obtener alertas de stock bajo
  getAlertas: () => api.get('/inventario/alertas'),
  
  // Crear nuevo insumo
  create: (data) => api.post('/inventario', data),
  
  // Actualizar insumo
  update: (id, data) => api.put(`/inventario/${id}`, data)
};

export default inventarioApi;
