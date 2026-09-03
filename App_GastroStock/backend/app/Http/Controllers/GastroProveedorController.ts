import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = 'SELECT * FROM gastro_proveedores WHERE activo = 1 ORDER BY nombre ASC'
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener proveedores (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const query = 'SELECT * FROM gastro_proveedores WHERE id = ? AND activo = 1'
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      })
      return
    }

    res.json({ success: true, data: (rows as any[])[0] })
  } catch (error: any) {
    console.error('Error al obtener proveedor (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, nit, telefono, correo, direccion, contacto } = req.body

    if (!nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      })
      return
    }

    const checkQuery = 'SELECT id FROM gastro_proveedores WHERE nombre = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre'
      })
      return
    }

    const insertQuery = `
      INSERT INTO gastro_proveedores (nombre, nit, telefono, correo, direccion, contacto, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      nit || null,
      telefono || null,
      correo || null,
      direccion || null,
      contacto || null
    ])

    await registrarAuditoria(req.user?.id, 'CREAR_PROVEEDOR', 'gastro_proveedores', (result as any).insertId, nombre)

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: { id: (result as any).insertId, nombre, nit, telefono, correo, direccion, contacto, activo: 1 }
    })
  } catch (error: any) {
    console.error('Error al crear proveedor (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, nit, telefono, correo, direccion, contacto } = req.body

    const checkQuery = 'SELECT id FROM gastro_proveedores WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      })
      return
    }

    const updateQuery = `
      UPDATE gastro_proveedores
      SET nombre = COALESCE(?, nombre),
          nit = COALESCE(?, nit),
          telefono = COALESCE(?, telefono),
          correo = COALESCE(?, correo),
          direccion = COALESCE(?, direccion),
          contacto = COALESCE(?, contacto),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    await pool.execute(updateQuery, [nombre ?? null, nit ?? null, telefono ?? null, correo ?? null, direccion ?? null, contacto ?? null, id])

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_PROVEEDOR', 'gastro_proveedores', Number(id))

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: { id, nombre, nit, telefono, correo, direccion, contacto }
    })
  } catch (error: any) {
    console.error('Error al actualizar proveedor (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_proveedores WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      })
      return
    }

    const [compras] = await pool.execute(
      'SELECT id FROM gastro_compras WHERE proveedor_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((compras as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque tiene compras asociadas'
      })
      return
    }

    await pool.execute('UPDATE gastro_proveedores SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_PROVEEDOR', 'gastro_proveedores', Number(id))

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar proveedor (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    })
  }
}
