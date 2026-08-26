import api from './api';

export const inventarioApi = {
  // Obtener todo el inventario
  getAll: () => api.get('/inventario'),
  
  // Obtener item por producto
  getById: (id) => api.get(`/inventario/producto/${id}`),
  
  // Actualizar stock (entrada/salida/ajuste)
  updateStock: (id, cantidad, tipo_movimiento = 'entrada', observaciones) => 
    api.put(`/inventario/producto/${id}/stock`, { cantidad, tipo_movimiento, observaciones }),
  
  // Obtener movimientos de inventario
  getMovimientos: (id) => api.get(`/inventario/producto/${id}/movimientos`),
  
  // Obtener alertas de stock bajo
  getAlertas: () => api.get('/inventario/alertas'),
  
  // Crear nuevo insumo
  create: (data) => api.post('/inventario', data),
  
  // Actualizar insumo
  update: (id, data) => api.put(`/inventario/producto/${id}`, data)
};

export default inventarioApi;
