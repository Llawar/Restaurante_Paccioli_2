import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // abrir a toda la red LAN
    allowedHosts: ['restaurante-paccioli-server.duckdns.org'], // Dar acceso al subdominio de duck DNS
    port: 5173,        // puerto fijo para el POS Admin
  },
})
