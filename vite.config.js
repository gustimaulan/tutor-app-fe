import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Changed from 3000 to 3001
        changeOrigin: true,
        secure: false,
        withCredentials: true,
      },
    },
    allowedHosts: ['parental-ebony-paintings-outputs.trycloudflare.com', '1b4dde7ad636.ngrok-free.app', /\.ngrok-free\.app$/, /\.sigmath\.net$/],
  },
})
