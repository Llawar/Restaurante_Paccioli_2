import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',    // abrir a toda la red LAN
      allowedHosts: ['restaurante-paccioli-server.duckdns.org'], // Dar acceso al subdominio de duck DNS
      port: 5174,         // puerto fijo para el Kiosko
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
