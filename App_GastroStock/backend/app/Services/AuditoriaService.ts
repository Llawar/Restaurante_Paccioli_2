import pool from '../Providers/DatabaseProvider'

export const registrarAuditoria = async (
  usuarioId: number | null | undefined,
  accion: string,
  entidad: string,
  entidadId: number | null = null,
  detalle: string | null = null
): Promise<void> => {
  try {
    await pool.execute(
      `INSERT INTO gastro_auditoria (usuario_id, accion, entidad, entidad_id, detalle)
       VALUES (?, ?, ?, ?, ?)`,
      [usuarioId ?? null, accion, entidad, entidadId, detalle]
    )
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
  }
}
