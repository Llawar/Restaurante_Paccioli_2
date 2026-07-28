import api from './api';

export const productosApi = {
  // Obtener todos los productos
  getAll: () => api.get('/productos'),
  
  // Obtener un producto por ID
  getById: (id) => api.get(`/productos/${id}`),
  
  // Obtener productos por categoría
  getByCategoria: (categoriaId) => api.get(`/productos/categoria/${categoriaId}`),
  
  // Crear nuevo producto con imagen
  create: (data) => {
    // Si data es FormData, enviar como multipart/form-data
    if (data instanceof FormData) {
      return api.post('/productos', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/productos', data);
  },
  
  // Actualizar producto con imagen
  update: (id, data) => {
    // Si data es FormData, enviar como multipart/form-data
    if (data instanceof FormData) {
      return api.put(`/productos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.put(`/productos/${id}`, data);
  },
  
  // Eliminar producto (soft delete)
  delete: (id) => api.delete(`/productos/${id}`),
  
  // Cambiar estado activo/inactivo
  toggleStatus: (id) => api.patch(`/productos/${id}/estado`)
};

export default productosApi;
