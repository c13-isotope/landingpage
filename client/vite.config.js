// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // allow access from LAN if needed
    port: 5173,
    proxy: {
      // Dev only: forward /api to your local backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',        // Vercel expects this (Vite default anyway)
    sourcemap: false
  }
})
