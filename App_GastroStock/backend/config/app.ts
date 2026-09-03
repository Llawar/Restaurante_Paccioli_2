import dotenv from 'dotenv'
dotenv.config()

export default {
  name: 'GastroStock',
  version: '1.0.0',
  port: parseInt(process.env.PORT || '3007', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'gastrostock_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
}
