import api from './api';

export const categoriasApi = {
  getAll: () => api.get('/gastro/categorias'),
  getById: (id) => api.get(`/gastro/categorias/${id}`),
  create: (data) => api.post('/gastro/categorias', data),
  update: (id, data) => api.put(`/gastro/categorias/${id}`, data),
  remove: (id) => api.delete(`/gastro/categorias/${id}`)
};

export const subcategoriasApi = {
  getAll: () => api.get('/gastro/subcategorias'),
  getByCategoria: (id) => api.get(`/gastro/subcategorias/categoria/${id}`),
  create: (data) => api.post('/gastro/subcategorias', data),
  update: (id, data) => api.put(`/gastro/subcategorias/${id}`, data),
  remove: (id) => api.delete(`/gastro/subcategorias/${id}`)
};

export const unidadesApi = {
  getAll: () => api.get('/gastro/unidades'),
  create: (data) => api.post('/gastro/unidades', data),
  update: (id, data) => api.put(`/gastro/unidades/${id}`, data),
  remove: (id) => api.delete(`/gastro/unidades/${id}`)
};

export const proveedoresApi = {
  getAll: () => api.get('/gastro/proveedores'),
  getById: (id) => api.get(`/gastro/proveedores/${id}`),
  create: (data) => api.post('/gastro/proveedores', data),
  update: (id, data) => api.put(`/gastro/proveedores/${id}`, data),
  remove: (id) => api.delete(`/gastro/proveedores/${id}`)
};

export const productosApi = {
  getAll: () => api.get('/gastro/productos'),
  getById: (id) => api.get(`/gastro/productos/${id}`),
  create: (data) => api.post('/gastro/productos', data),
  update: (id, data) => api.put(`/gastro/productos/${id}`, data),
  remove: (id) => api.delete(`/gastro/productos/${id}`)
};

export const ubicacionesApi = {
  getAll: () => api.get('/gastro/ubicaciones'),
  create: (data) => api.post('/gastro/ubicaciones', data),
  update: (id, data) => api.put(`/gastro/ubicaciones/${id}`, data),
  remove: (id) => api.delete(`/gastro/ubicaciones/${id}`)
};

export const comprasApi = {
  getAll: () => api.get('/gastro/compras'),
  getById: (id) => api.get(`/gastro/compras/${id}`),
  create: (data) => api.post('/gastro/compras', data),
  cancelar: (id) => api.put(`/gastro/compras/${id}/cancelar`)
};

export const lotesApi = {
  getAll: () => api.get('/gastro/lotes'),
  getByProducto: (id) => api.get(`/gastro/lotes/producto/${id}`)
};

export const kardexApi = {
  getByProducto: (id, filters) => api.get(`/gastro/kardex/producto/${id}`, { params: filters }),
  registrarSalida: (data) => api.post('/gastro/kardex/salida', data)
};

export const inventarioFisicoApi = {
  getAll: () => api.get('/gastro/inventario-fisico'),
  getById: (id) => api.get(`/gastro/inventario-fisico/${id}`),
  iniciar: () => api.post('/gastro/inventario-fisico/iniciar'),
  registrarConteo: (inventarioId, items) => api.post('/gastro/inventario-fisico/conteo', { inventario_id: inventarioId, items }),
  completar: (id) => api.put(`/gastro/inventario-fisico/${id}/completar`)
};

export const alertasApi = {
  getAll: () => api.get('/gastro/alertas'),
  getStockBajo: () => api.get('/gastro/alertas/stock-bajo'),
  getProximoVencer: () => api.get('/gastro/alertas/proximo-vencer'),
  marcarLeidas: () => api.put('/gastro/alertas/leidas')
};

export const dashboardApi = {
  resumen: () => api.get('/gastro/dashboard/resumen'),
  comprasRecientes: () => api.get('/gastro/dashboard/compras-recientes'),
  movimientosRecientes: () => api.get('/gastro/dashboard/movimientos-recientes'),
  stockBajo: () => api.get('/gastro/dashboard/stock-bajo')
};
