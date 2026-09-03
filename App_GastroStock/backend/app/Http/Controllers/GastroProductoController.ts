import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'
import { generarCodigoProducto, obtenerCodigosSubcategoria } from '../../Services/CodigoProductoService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*,
        sc.nombre as subcategoria_nombre, sc.codigo as subcategoria_codigo,
        c.nombre as categoria_nombre, c.codigo as categoria_codigo,
        um.nombre as unidad_nombre, um.abreviatura as unidad_abreviatura
      FROM gastro_productos p
      LEFT JOIN gastro_subcategorias sc ON p.subcategoria_id = sc.id
      LEFT JOIN gastro_categorias c ON sc.categoria_id = c.id
      LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
      WHERE p.activo = 1
      ORDER BY p.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener productos (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT p.*,
        sc.nombre as subcategoria_nombre, sc.codigo as subcategoria_codigo,
        c.nombre as categoria_nombre, c.codigo as categoria_codigo,
        um.nombre as unidad_nombre, um.abreviatura as unidad_abreviatura,
        (SELECT COALESCE(GROUP_CONCAT(u.nombre), '') FROM gastro_producto_ubicacion pu
         LEFT JOIN gastro_ubicaciones u ON pu.ubicacion_id = u.id
         WHERE pu.producto_id = p.id AND pu.activo = 1) as ubicaciones
      FROM gastro_productos p
      LEFT JOIN gastro_subcategorias sc ON p.subcategoria_id = sc.id
      LEFT JOIN gastro_categorias c ON sc.categoria_id = c.id
      LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
      WHERE p.id = ? AND p.activo = 1
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    res.json({ success: true, data: (rows as any[])[0] })
  } catch (error: any) {
    console.error('Error al obtener producto (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, subcategoria_id, unidad_id, controla_vencimiento, stock_minimo, stock_actual } = req.body

    if (!nombre || !subcategoria_id) {
      res.status(400).json({
        success: false,
        message: 'Nombre y subcategoría son requeridos'
      })
      return
    }

    const codigo = await generarCodigoProducto(subcategoria_id)

    const insertQuery = `
      INSERT INTO gastro_productos (codigo, nombre, subcategoria_id, unidad_id, controla_vencimiento, stock_minimo, stock_actual, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      codigo,
      nombre,
      subcategoria_id,
      unidad_id || null,
      controla_vencimiento ? 1 : 0,
      stock_minimo || 0,
      stock_actual || 0
    ])

    await registrarAuditoria(req.user?.id, 'CREAR_PRODUCTO', 'gastro_productos', (result as any).insertId, `${nombre} (${codigo})`)

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        id: (result as any).insertId,
        codigo,
        nombre,
        subcategoria_id,
        unidad_id,
        controla_vencimiento: controla_vencimiento ? 1 : 0,
        stock_minimo: stock_minimo || 0,
        stock_actual: stock_actual || 0,
        activo: 1
      }
    })
  } catch (error: any) {
    console.error('Error al crear producto (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, unidad_id, controla_vencimiento, stock_minimo } = req.body

    const checkQuery = 'SELECT id FROM gastro_productos WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    const updateQuery = `
      UPDATE gastro_productos
      SET nombre = COALESCE(?, nombre),
          unidad_id = COALESCE(?, unidad_id),
          controla_vencimiento = COALESCE(?, controla_vencimiento),
          stock_minimo = COALESCE(?, stock_minimo),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    await pool.execute(updateQuery, [
      nombre ?? null,
      unidad_id ?? null,
      controla_vencimiento !== undefined ? (controla_vencimiento ? 1 : 0) : null,
      stock_minimo ?? null,
      id
    ])

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_PRODUCTO', 'gastro_productos', Number(id), nombre)

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { id, nombre, unidad_id, controla_vencimiento, stock_minimo }
    })
  } catch (error: any) {
    console.error('Error al actualizar producto (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_productos WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    const [lotes] = await pool.execute(
      'SELECT id FROM gastro_lotes WHERE producto_id = ? AND cantidad_disponible > 0 LIMIT 1',
      [id]
    )

    if ((lotes as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar el producto porque tiene stock disponible en lotes'
      })
      return
    }

    await pool.execute('UPDATE gastro_productos SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_PRODUCTO', 'gastro_productos', Number(id))

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar producto (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    })
  }
}
