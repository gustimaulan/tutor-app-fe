import axios from 'axios'
import router from '../router' // Impor instance router

// Create axios instance
const apiClient = axios.create({
  // SELALU gunakan path relatif ini.
  // Ini akan memaksa semua request API untuk dikirim ke domain frontend,
  // yang kemudian akan ditangani oleh proxy yang sesuai:
  // - Vite dev server proxy saat development.
  // - Cloudflare Pages Function (`/functions/api`) saat production.
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('authToken')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userPassword')
      // Gunakan router untuk navigasi SPA yang mulus, hindari full refresh
      if (router.currentRoute.value.name !== 'Login') {
        router.push({ name: 'Login' }); // Ini sudah menggunakan named route, jadi tidak perlu diubah.
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient