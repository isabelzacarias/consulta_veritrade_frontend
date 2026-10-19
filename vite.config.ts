import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // El frontend consume la API a través de /api. El proxy elimina ese prefijo
  // porque las rutas del backend FastAPI no lo incluyen (p. ej. /reportes/kpis).
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
