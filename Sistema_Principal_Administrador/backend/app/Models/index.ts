export interface Usuario {
  id: number
  nombre: string
  usuario: string
  password: string
  email?: string
  rol: 'admin' | 'empleado' | 'cocinero' | 'delivery'
  activo: number
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  icono?: string
  color?: string
  activo: number
  created_at: string
  updated_at: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  categoria_id: number
  imagen?: string
  disponible: number
  requiere_inventario: number
  unidad_medida: string
  activo: number
  created_at: string
  updated_at: string
  categoria_nombre?: string
}

export interface Inventario {
  id: number
  producto_id: number
  cantidad: number
  stock_minimo?: number
  stock_maximo?: number
  updated_at: string
  producto_nombre?: string
  unidad_medida?: string
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  observaciones?: string
  usuario_id?: number
  created_at: string
}

export interface Mesa {
  id: number
  numero_mesa: number
  capacidad: number
  estado: 'libre' | 'ocupada' | 'reservada'
  ubicacion?: string
  activo: number
}

export interface Cliente {
  id: number
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  notas?: string
  created_at: string
}

export interface Pedido {
  id: number
  tipo: 'mesa' | 'delivery' | 'para_llevar'
  mesa_id?: number
  cliente_id?: number
  delivery_id?: number
  usuario_id?: number
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado'
  total: number
  notas?: string
  created_at: string
  updated_at: string
  usuario_nombre?: string
  cliente_nombre?: string
  numero_mesa?: number
  detalles?: DetallePedido[]
}

export interface DetallePedido {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  notas?: string
  estado_cocina: 'pendiente' | 'en_preparacion' | 'listo'
  puesto_asignado_id?: number
  cocinero_id?: number
  hora_inicio_preparacion?: string
  hora_fin_preparacion?: string
  producto_nombre?: string
}

export interface Delivery {
  id: number
  pedido_id: number
  repartidor_id?: number
  direccion: string
  telefono: string
  nombre_cliente: string
  estado: 'pendiente' | 'asignado' | 'en_camino' | 'entregado' | 'cancelado'
  notas?: string
  created_at: string
  repartidor_nombre?: string
}

export interface PuestoCocina {
  id: number
  nombre: string
  descripcion?: string
  activo: number
  categorias_asignadas?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  count?: number
  error?: string
}

export interface JwtPayload {
  id: number
  usuario: string
  nombre: string
  rol: string
}
