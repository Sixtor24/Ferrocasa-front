import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend destino del proxy en dev (evita CORS con VITE_API_URL=/api/v1).
  // Definir en .env (no commitear): VITE_DEV_API_PROXY=https://tu-api.ejemplo.com
  const apiProxyTarget = (
    env.VITE_DEV_API_PROXY ||
    env.DEV_API_PROXY ||
    'http://localhost:4000'
  ).replace(/\/$/, '')

  return {
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
