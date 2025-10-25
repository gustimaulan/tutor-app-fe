import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true // Enable cookies for session-based auth
})

// Remove JWT token interceptor since backend uses sessions
// No need for Authorization header interceptor

export default apiClient