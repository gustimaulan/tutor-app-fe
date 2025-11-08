import apiClient from '../utils/axios'

// Login action
export async function loginAction(credentials) {
  try {
    console.log('Login action - credentials:', credentials)
    console.log('Login action - typeof credentials:', typeof credentials)
    
    const response = await apiClient.post('/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Store JWT token from response
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    localStorage.setItem('userEmail', credentials.email)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Login failed'
    }
  }
}

// Logout action
export async function logoutAction() {
  try {
    // Call logout endpoint to invalidate token on server
    await apiClient.post('/auth/logout')
    
    // Remove credentials from localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userPassword')
    
    return { success: true, data: { message: 'Logged out successfully' } }
  } catch (error) {
    console.error('Logout error:', error)
    // Still remove local credentials even if server call fails
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userPassword')
    
    return {
      success: false,
      error: error.message || 'Logout failed'
    }
  }
}

// Get current user action
export async function getCurrentUserAction() {
  try {
    const token = localStorage.getItem('authToken')
    
    if (!token) {
      return { success: false, error: 'No authentication token found' }
    }
    
    // Axios interceptor will add Bearer token headers
    const response = await apiClient.get('/auth/check')
    console.log('Auth check response:', response.data) // Debug log
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Get current user error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get current user'
    }
  }
}

// Register action (if needed in the future)
export async function registerAction(userData) {
  try {
    const response = await apiClient.post('/auth/register', userData)
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Register error:', error)
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Registration failed' 
    }
  }
}

// Refresh token action (if needed in the future)
export async function refreshTokenAction() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return { success: false, error: 'No authentication token found' }
    }
    
    const response = await apiClient.post('/auth/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    // Update token in localStorage
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Refresh token error:', error)
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || 'Token refresh failed' 
    }
  }
}