import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    console.log('API Client interceptor: Token from localStorage:', token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Client interceptor: Auth header set:', config.headers.Authorization)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient