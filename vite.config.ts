import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // La SPA se publica bajo /compras/ en el mismo origen de la suite.
  // El proxy elimina /compras/api porque FastAPI no incluye ese prefijo.
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8001'
  const proxy = {
    '/compras/api': {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/compras\/api/, ''),
    },
  }

  return {
    base: '/compras/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy },
    preview: { proxy },
  }
})
