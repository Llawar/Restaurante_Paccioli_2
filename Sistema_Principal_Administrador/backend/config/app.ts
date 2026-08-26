import dotenv from 'dotenv'
dotenv.config()

export default {
  name: 'Restaurante Paccioli',
  version: '1.0.0',
  port: parseInt(process.env.PORT || '3006', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'restaurant_jwt_secret_key_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
}
