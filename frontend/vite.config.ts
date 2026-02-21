import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:80', changeOrigin: true },
      '/users': { target: 'http://localhost:80', changeOrigin: true },
      '/trips': { target: 'http://localhost:80', changeOrigin: true },
      '/drivers': { target: 'http://localhost:80', changeOrigin: true },
      '/catalog': { target: 'http://localhost:80', changeOrigin: true },
      '/realtime': { target: 'http://localhost:80', changeOrigin: true },
      '/app': { target: 'http://localhost:80', ws: true },
    },
  },
})
