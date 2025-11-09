import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api/v1', // Menggunakan path relatif untuk di-proxy oleh Vite
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
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient