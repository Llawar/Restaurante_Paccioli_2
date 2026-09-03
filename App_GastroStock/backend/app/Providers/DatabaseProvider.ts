import mysql from 'mysql2/promise'
import dbConfig from '../../config/database'

const pool = mysql.createPool(dbConfig)

export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection()
    console.log('Conexión a MySQL exitosa (GastroStock)')
    connection.release()
    return true
  } catch (error: any) {
    console.error('Error al conectar a MySQL (GastroStock):', error.message)
    return false
  }
}

export default pool
