import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT s.*, c.nombre as categoria_nombre, c.codigo as categoria_codigo
      FROM gastro_subcategorias s
      LEFT JOIN gastro_categorias c ON s.categoria_id = c.id
      WHERE s.activo = 1
      ORDER BY s.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener subcategorías (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategorías',
      error: error.message
    })
  }
}

export const getByCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId } = req.params

    const query = `
      SELECT s.*, c.nombre as categoria_nombre
      FROM gastro_subcategorias s
      LEFT JOIN gastro_categorias c ON s.categoria_id = c.id
      WHERE s.categoria_id = ? AND s.activo = 1
      ORDER BY s.nombre ASC
    `
    const [rows] = await pool.execute(query, [categoriaId])

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener subcategorías (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategorías',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `SELECT s.*, c.nombre as categoria_nombre FROM gastro_subcategorias s
      LEFT JOIN gastro_categorias c ON s.categoria_id = c.id
      WHERE s.id = ? AND s.activo = 1`
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener subcategoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategoría',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria_id, nombre, codigo } = req.body

    if (!categoria_id || !nombre || !codigo) {
      res.status(400).json({
        success: false,
        message: 'categoria_id, nombre y código son requeridos'
      })
      return
    }

    const checkQuery = 'SELECT id FROM gastro_subcategorias WHERE (nombre = ? OR codigo = ?) AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre, codigo])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una subcategoría con ese nombre o código'
      })
      return
    }

    const insertQuery = `
      INSERT INTO gastro_subcategorias (categoria_id, nombre, codigo, activo, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      categoria_id,
      nombre,
      codigo.toUpperCase()
    ])

    await registrarAuditoria(req.user?.id, 'CREAR_SUBCATEGORIA', 'gastro_subcategorias', (result as any).insertId, nombre)

    res.status(201).json({
      success: true,
      message: 'Subcategoría creada exitosamente',
      data: {
        id: (result as any).insertId,
        categoria_id,
        nombre,
        codigo: codigo.toUpperCase(),
        activo: 1
      }
    })
  } catch (error: any) {
    console.error('Error al crear subcategoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear subcategoría',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { categoria_id, nombre, codigo } = req.body

    const checkQuery = 'SELECT id FROM gastro_subcategorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      })
      return
    }

    if (nombre || codigo) {
      const duplicateQuery = 'SELECT id FROM gastro_subcategorias WHERE (nombre = ? OR codigo = ?) AND id != ? AND activo = 1'
      const [duplicate] = await pool.execute(duplicateQuery, [nombre ?? '', codigo ?? '', id])

      if ((duplicate as any[]).length > 0) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otra subcategoría con ese nombre o código'
        })
        return
      }
    }

    const updateQuery = `
      UPDATE gastro_subcategorias
      SET categoria_id = COALESCE(?, categoria_id),
          nombre = COALESCE(?, nombre),
          codigo = COALESCE(?, codigo),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    await pool.execute(updateQuery, [
      categoria_id ?? null,
      nombre ?? null,
      codigo ? codigo.toUpperCase() : null,
      id
    ])

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_SUBCATEGORIA', 'gastro_subcategorias', Number(id))

    res.json({
      success: true,
      message: 'Subcategoría actualizada exitosamente',
      data: { id, categoria_id, nombre, codigo }
    })
  } catch (error: any) {
    console.error('Error al actualizar subcategoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subcategoría',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_subcategorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      })
      return
    }

    const [productos] = await pool.execute(
      'SELECT id FROM gastro_productos WHERE subcategoria_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((productos as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar la subcategoría porque tiene productos asociados'
      })
      return
    }

    await pool.execute('UPDATE gastro_subcategorias SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_SUBCATEGORIA', 'gastro_subcategorias', Number(id))

    res.json({
      success: true,
      message: 'Subcategoría eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar subcategoría (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar subcategoría',
      error: error.message
    })
  }
}
