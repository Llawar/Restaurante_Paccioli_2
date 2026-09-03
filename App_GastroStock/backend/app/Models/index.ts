export interface JwtPayload {
  id: number
  usuario: string
  nombre: string
  rol: string
}

export interface GastroCategoria {
  id: number
  nombre: string
  codigo: string
  descripcion?: string
  activo: number
  created_at: string
  updated_at: string
}

export interface GastroSubcategoria {
  id: number
  categoria_id: number
  nombre: string
  codigo: string
  activo: number
  created_at: string
  updated_at: string
}

export interface GastroUnidadMedida {
  id: number
  nombre: string
  abreviatura: string
  activo: number
}

export interface GastroProducto {
  id: number
  codigo: string
  nombre: string
  subcategoria_id: number | null
  unidad_id: number | null
  controla_vencimiento: number
  stock_minimo: number
  stock_actual: number
  activo: number
}

export interface GastroProveedor {
  id: number
  nombre: string
  nit?: string
  telefono?: string
  correo?: string
  direccion?: string
  contacto?: string
  activo: number
}

export interface GastroUbicacion {
  id: number
  nombre: string
  tipo: 'ESTANTERIA' | 'REFRIGERADOR' | 'CONGELADOR'
  activo: number
}

export interface GastroLote {
  id: number
  producto_id: number
  detalle_compra_id: number | null
  numero_lote: string
  cantidad_ingreso: number
  cantidad_disponible: number
  costo_unitario: number
  fecha_ingreso: string
  vencimiento: string | null
  activo: number
}

export interface GastroMovimientoKardex {
  id: number
  fecha: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  concepto: 'COMPRA' | 'DONACION' | 'DEVOLUCION' | 'CONSUMO' | 'MERMA' | 'VENCIDO' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'INVENTARIO_FISICO'
  producto_id: number
  lote_id: number | null
  entrada: number
  salida: number
  saldo: number
  costo_unitario: number
  usuario_id: number | null
  referencia: string | null
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  count?: number
  error?: string
}
