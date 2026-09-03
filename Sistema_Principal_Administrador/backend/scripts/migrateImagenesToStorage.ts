import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = 'productos'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Falta SUPABASE_URL o SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('=== Migración de imágenes locales → Supabase Storage ===')

  // Verificar/crear bucket público
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    console.log(`Bucket ${BUCKET} no existe, creándolo...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) console.error('Error creando bucket:', error.message)
    else console.log('Bucket creado')
  } else {
    console.log(`Bucket ${BUCKET} ya existe`)
    // Asegurar que sea público
    await supabase.storage.updateBucket(BUCKET, { public: true }).catch(()=>{})
  }

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restaurante_paccioli_db',
    port: Number(process.env.DB_PORT) || 3306,
  })

  const [rows] = await pool.execute(
    `SELECT id, nombre, imagen FROM productos WHERE imagen IS NOT NULL AND imagen != ''`
  ) as any[]

  console.log(`Productos con imagen: ${rows.length}`)

  let migrados = 0
  let yaEnStorage = 0
  let sinArchivo = 0

  for (const p of rows) {
    const imagen: string = p.imagen

    // Ya es URL de Supabase, saltar
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      // Si ya es de supabase, verificar que siga válida
      if (imagen.includes('supabase.co/storage')) {
        yaEnStorage++
        continue
      }
      // Si es http://192.168... vieja, migrar el archivo local correspondiente
    }

    // Extraer filename de /uploads/productos/xxx
    const fileName = path.basename(imagen.split('?')[0])
    if (!fileName) continue

    // Buscar archivo en disco (intentar dos rutas posibles)
    const posiblesRutas = [
      path.join(__dirname, '../../uploads/productos', fileName),
      path.join(__dirname, '../uploads/productos', fileName),
      path.join(process.cwd(), 'uploads/productos', fileName),
    ]
    const rutaLocal = posiblesRutas.find(r => fs.existsSync(r))

    if (!rutaLocal) {
      console.warn(`  [${p.id}] ${p.nombre}: archivo no encontrado (${fileName}) → se deja como está`)
      sinArchivo++
      continue
    }

    const buffer = fs.readFileSync(rutaLocal)
    const ext = path.extname(fileName).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      ext === '.gif' ? 'image/gif' : 'image/jpeg'

    console.log(`  [${p.id}] ${p.nombre}: subiendo ${fileName} (${(buffer.length/1024).toFixed(1)}KB)...`)

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType, upsert: true })

    if (uploadErr) {
      console.error(`    Error upload: ${uploadErr.message}`)
      continue
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    const publicUrl = data.publicUrl

    // Actualizar MySQL
    await pool.execute(`UPDATE productos SET imagen = ?, updated_at = NOW() WHERE id = ?`, [publicUrl, p.id])
    console.log(`    → Migrado: ${publicUrl}`)
    migrados++
  }

  console.log('\n=== Resumen ===')
  console.log(`Migrados ahora: ${migrados}`)
  console.log(`Ya en Storage: ${yaEnStorage}`)
  console.log(`Sin archivo local: ${sinArchivo}`)
  console.log(`Total procesados: ${rows.length}`)

  if (migrados > 0) {
    console.log('\nActualizando Supabase products vía CatalogoSync...')
    // Opcional: actualizar directamente Supabase products para no esperar 15s
    // Lo hará CatalogoSync en el próximo ciclo, pero forzamos aquí
    const [productos] = await pool.execute(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.activo, p.disponible, p.eliminado, c.nombre AS categoria_nombre
       FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id ORDER BY p.id ASC`
    ) as any[]

    const filas = productos.map((pr: any) => ({
      pos_id: pr.id,
      nombre: pr.nombre,
      descripcion: pr.descripcion || '',
      precio: Number(pr.precio) || 0,
      categoria: pr.categoria_nombre || 'General',
      imagen_url: pr.imagen, // ya es URL de Supabase
      estado: Boolean(!pr.eliminado && pr.activo && pr.disponible),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('products').upsert(filas, { onConflict: 'pos_id' })
    if (error) console.error('Error upsert products:', error.message)
    else console.log(`Supabase products actualizado: ${filas.length} filas`)
  }

  await pool.end()
  console.log('\nMigración completada ✅')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
