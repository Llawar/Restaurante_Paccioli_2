import api from './api';

export const usuariosApi = {
  // Obtener todos los usuarios
  getAll: () => api.get('/usuarios'),
  
  // Obtener un usuario por ID
  getById: (id) => api.get(`/usuarios/${id}`),
  
  // Crear nuevo usuario
  create: (data) => api.post('/usuarios', data),
  
  // Actualizar usuario
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  
  // Eliminar usuario (soft delete)
  delete: (id) => api.delete(`/usuarios/${id}`),
  
  // Cambiar estado activo/inactivo
  toggleStatus: (id) => api.patch(`/usuarios/${id}/estado`),
  
  // Cambiar contraseña
  changePassword: (id, data) => api.put(`/usuarios/${id}/password`, data)
};

export default usuariosApi;
