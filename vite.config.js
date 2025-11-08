import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || 'https://tutor-app-api.sigmath.net',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['parental-ebony-paintings-outputs.trycloudflare.com', '1b4dde7ad636.ngrok-free.app', /\.ngrok-free\.app$/, /\.sigmath\.net$/],
  },
})
