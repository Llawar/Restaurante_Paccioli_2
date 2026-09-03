import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM gastro_subcategorias s WHERE s.categoria_id = c.id AND s.activo = 1) as subcategorias_count
      FROM gastro_categorias c
      WHERE c.activo = 1
      ORDER BY c.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener categorías (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = 'SELECT * FROM gastro_categorias WHERE id = ? AND activo = 1'
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener categoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, codigo, descripcion } = req.body

    if (!nombre || !codigo) {
      res.status(400).json({
        success: false,
        message: 'Nombre y código son requeridos'
      })
      return
    }

    const checkQuery = 'SELECT id FROM gastro_categorias WHERE (nombre = ? OR codigo = ?) AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre, codigo])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre o código'
      })
      return
    }

    const insertQuery = `
      INSERT INTO gastro_categorias (nombre, codigo, descripcion, activo, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      codigo.toUpperCase(),
      descripcion || null
    ])

    await registrarAuditoria(req.user?.id, 'CREAR_CATEGORIA', 'gastro_categorias', (result as any).insertId, nombre)

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        codigo: codigo.toUpperCase(),
        descripcion,
        activo: 1
      }
    })
  } catch (error: any) {
    console.error('Error al crear categoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, codigo, descripcion } = req.body

    const checkQuery = 'SELECT id FROM gastro_categorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    if (nombre || codigo) {
      const duplicateQuery = 'SELECT id FROM gastro_categorias WHERE (nombre = ? OR codigo = ?) AND id != ? AND activo = 1'
      const [duplicate] = await pool.execute(duplicateQuery, [nombre ?? '', codigo ?? '', id])

      if ((duplicate as any[]).length > 0) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre o código'
        })
        return
      }
    }

    const updateQuery = `
      UPDATE gastro_categorias
      SET nombre = COALESCE(?, nombre),
          codigo = COALESCE(?, codigo),
          descripcion = COALESCE(?, descripcion),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    await pool.execute(updateQuery, [
      nombre ?? null,
      codigo ? codigo.toUpperCase() : null,
      descripcion ?? null,
      id
    ])

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_CATEGORIA', 'gastro_categorias', Number(id))

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { id, nombre, codigo, descripcion }
    })
  } catch (error: any) {
    console.error('Error al actualizar categoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_categorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    const [subcategorias] = await pool.execute(
      'SELECT id FROM gastro_subcategorias WHERE categoria_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((subcategorias as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene subcategorías asociadas'
      })
      return
    }

    await pool.execute('UPDATE gastro_categorias SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_CATEGORIA', 'gastro_categorias', Number(id))

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar categoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    })
  }
}
