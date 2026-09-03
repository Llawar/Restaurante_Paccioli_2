import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = 'productos'

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Sube un archivo local (guardado por multer diskStorage) a Supabase Storage
 * Retorna la URL pública o null si falla / no está configurado
 */
export const subirImagenAStorage = async (file: Express.Multer.File): Promise<string | null> => {
  const supabase = getSupabase()
  if (!supabase) {
    console.warn('[Storage] Supabase no configurado, se usará URL local')
    return null
  }

  try {
    const fileBuffer = fs.readFileSync(file.path)
    const fileName = file.filename

    // Verificar/crear bucket (idempotente)
    const { data: buckets } = await supabase.storage.listBuckets()
    const existe = buckets?.some(b => b.name === BUCKET)
    if (!existe) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true })
      if (createErr) console.warn('[Storage] No se pudo crear bucket productos:', createErr.message)
      else console.log('[Storage] Bucket productos creado')
    }

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (uploadErr) {
      console.error('[Storage] Error subiendo imagen:', uploadErr.message)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    console.log('[Storage] Imagen subida:', data.publicUrl)
    return data.publicUrl
  } catch (e: any) {
    console.error('[Storage] Error:', e.message)
    return null
  }
}

export const eliminarImagenDeStorage = async (imagenUrlOrPath: string): Promise<void> => {
  const supabase = getSupabase()
  if (!supabase || !imagenUrlOrPath) return
  // Extraer filename de URL o path
  const fileName = path.basename(imagenUrlOrPath.split('?')[0])
  if (!fileName) return
  const { error } = await supabase.storage.from(BUCKET).remove([fileName])
  if (error) console.warn('[Storage] No se pudo eliminar de storage:', error.message)
}
