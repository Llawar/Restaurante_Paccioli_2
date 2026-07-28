import api from './api';

export const deliveryApi = {
  // Obtener todos los repartidores
  getAllDrivers: () => api.get('/delivery'),
  
  // Obtener repartidor por ID
  getDriverById: (id) => api.get(`/delivery/${id}`),
  
  // Crear nuevo repartidor
  createDriver: (data) => api.post('/delivery', data),
  
  // Actualizar repartidor
  updateDriver: (id, data) => api.put(`/delivery/${id}`, data),
  
  // Asignar pedido a repartidor
  assignOrder: (id, pedidoId) => api.post(`/delivery/${id}/asignar`, { pedido_id: pedidoId }),
  
  // Actualizar estado del repartidor
  updateStatus: (id, status) => api.patch(`/delivery/${id}/estado`, { estado: status }),
  
  // Obtener pedidos en delivery
  getDeliveryOrders: () => api.get('/delivery/pedidos'),
  
  // Marcar pedido como entregado
  markDelivered: (pedidoId) => api.patch(`/delivery/pedidos/${pedidoId}/entregar`)
};

export default deliveryApi;
