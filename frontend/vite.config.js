import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Forwards /api requests to the Flask backend during `npm run dev`.
      // In production this same job is done by nginx.conf.
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    port: 3000
  }
})