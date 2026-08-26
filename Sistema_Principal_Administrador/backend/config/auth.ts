export const ROLES = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
  COCINERO: 'cocinero',
  DELIVERY: 'delivery'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
