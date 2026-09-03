import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { sincronizarCatalogoAhora } from '../../Services/CatalogoSyncService'
import { subirImagenAStorage } from '../../Services/StorageService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
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
    console.error('Error al obtener productos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    })
  }
}

export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre,
             IFNULL(SUM(CASE WHEN dp.estado_cocina = 'listo' THEN dp.cantidad END), 0) as vendidos
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN detalles_pedido dp ON dp.producto_id = p.id
      WHERE p.eliminado = 0
      GROUP BY p.id
      ORDER BY p.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener productos (admin):', error)
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
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.eliminado = 0
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    })
  }
}

export const getByCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId } = req.params

    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.categoria_id = ? AND p.eliminado = 0 AND p.activo = 1
      ORDER BY p.nombre ASC
    `
    const [rows] = await pool.execute(query, [categoriaId])

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener productos por categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos por categoría',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      categoria_id,
      disponible = 1,
      requiere_inventario = 0
    } = req.body

    let imagen = req.file ? `/uploads/productos/${req.file.filename}` : null
    // Opción B: subir a Supabase Storage y guardar URL pública
    if (req.file) {
      const storageUrl = await subirImagenAStorage(req.file)
      if (storageUrl) imagen = storageUrl
    }

    if (!nombre || !precio || !categoria_id) {
      res.status(400).json({
        success: false,
        message: 'Nombre, precio y categoría son requeridos'
      })
      return
    }

    const insertQuery = `
      INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen, disponible, requiere_inventario, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      descripcion || null,
      precio,
      categoria_id,
      imagen,
      disponible,
      requiere_inventario
    ])

    if (global.io) {
      global.io.emit('products:changed', { action: 'create', productId: (result as any).insertId })
    }

    sincronizarCatalogoAhora()

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        descripcion,
        precio,
        categoria_id,
        imagen,
        disponible,
        requiere_inventario
      }
    })
  } catch (error: any) {
    console.error('Error al crear producto:', error)
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
    const {
      nombre,
      descripcion,
      precio,
      categoria_id,
      disponible,
      requiere_inventario,
      activo
    } = req.body

    let imagen = req.file ? `/uploads/productos/${req.file.filename}` : null
    if (req.file) {
      const storageUrl = await subirImagenAStorage(req.file)
      if (storageUrl) imagen = storageUrl
    }

    const updateQuery = `
      UPDATE productos
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          precio = COALESCE(?, precio),
          categoria_id = COALESCE(?, categoria_id),
          imagen = COALESCE(?, imagen),
          disponible = COALESCE(?, disponible),
          requiere_inventario = COALESCE(?, requiere_inventario),
          activo = COALESCE(?, activo),
          updated_at = NOW()
      WHERE id = ?
    `

    const [result] = await pool.execute(updateQuery, [
      nombre ?? null,
      descripcion ?? null,
      precio ?? null,
      categoria_id ?? null,
      imagen,
      disponible ?? null,
      requiere_inventario ?? null,
      activo ?? null,
      id
    ])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    if (global.io) {
      global.io.emit('products:changed', { action: 'update', productId: id })
    }

    sincronizarCatalogoAhora()

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al actualizar producto:', error)
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

    const deleteQuery = 'UPDATE productos SET eliminado = 1, updated_at = NOW() WHERE id = ? AND eliminado = 0'
    const [result] = await pool.execute(deleteQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    if (global.io) {
      global.io.emit('products:changed', { action: 'delete', productId: id })
    }

    sincronizarCatalogoAhora()

    res.json({
      success: true,
      message: 'Producto desactivado correctamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    })
  }
}

export const toggleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const updateQuery = 'UPDATE productos SET activo = IF(activo = 1, 0, 1), updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(updateQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
      return
    }

    const [rows] = await pool.execute('SELECT activo FROM productos WHERE id = ?', [id])
    const activo = (rows as any[])[0]?.activo ?? 1

    if (global.io) {
      global.io.emit('products:changed', { action: 'toggle', productId: id, activo })
    }

    sincronizarCatalogoAhora()

    res.json({
      success: true,
      message: activo ? 'Producto activado' : 'Producto desactivado',
      data: { id, activo }
    })
  } catch (error: any) {
    console.error('Error al cambiar estado del producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del producto',
      error: error.message
    })
  }
}
