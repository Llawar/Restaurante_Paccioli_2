export const GASTRO_ROLES = {
  ADMIN: 'admin',
  ENCARGADO: 'encargado',
  CONSULTA: 'consulta'
} as const

export type GastroRole = typeof GASTRO_ROLES[keyof typeof GASTRO_ROLES]

export const ROLES = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
  COCINERO: 'cocinero',
  DELIVERY: 'delivery'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
