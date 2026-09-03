import api from './api'

export const clientesDeliveryApi = {
  getAll: () => api.get('/clientes-delivery'),
  getById: (id) => api.get(`/clientes-delivery/${id}`),
  promote: (id, data = {}) => api.post(`/clientes-delivery/${id}/promote`, data),
  demote: (id) => api.post(`/clientes-delivery/${id}/demote`),
  toggleBlock: (id) => api.patch(`/clientes-delivery/${id}/block`),
  syncNow: () => api.post('/clientes-delivery/sync/now'),
}

export default clientesDeliveryApi
