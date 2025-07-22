import { defineStore } from 'pinia'
import apiClient from '../utils/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    isAuthenticated: !!localStorage.getItem('authToken'),
    loading: false,
    error: null
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isTutor: (state) => state.user?.role === 'tutor',
    isStudent: (state) => state.user?.role === 'student',
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name
  },

  actions: {
    init() {
      console.log('Auth store: Initializing...')
      console.log('Auth store: Token from state:', this.token)
      console.log('Auth store: Token from localStorage:', localStorage.getItem('authToken'))
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        console.log('Auth store: Attempting login with:', { email, password })
        const response = await apiClient.post('/auth/login', { email, password })
        console.log('Auth store: Login response:', response.data)
        
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        this.isAuthenticated = true
        
        localStorage.setItem('authToken', token)
        
        console.log('Auth store: Token stored in localStorage:', localStorage.getItem('authToken'))
        
        return true
      } catch (error) {
        console.error('Auth store: Login error:', error)
        this.error = error.response?.data?.error || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    async fetchUser() {
      console.log('Auth store: Fetching user...')
      console.log('Auth store: Token available:', !!this.token)
      
      if (!this.token) return false
      
      this.loading = true
      try {
        console.log('Auth store: Making request to check auth...')
        const response = await apiClient.get('/auth/check')
        console.log('Auth store: Check auth response:', response.data)
        this.user = response.data.user
        return true
      } catch (error) {
        console.error('Auth store: Fetch user error:', error)
        this.clearAuth()
        return false
      } finally {
        this.loading = false
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('authToken')
    }
  }
}) 