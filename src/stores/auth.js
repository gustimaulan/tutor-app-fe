import { defineStore } from 'pinia'
import apiClient from '../utils/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    userName: (state) => state.user?.name,
    userEmail: (state) => state.user?.email
  },

  actions: {
    async login(email) { // Remove password parameter
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/auth/login', { email }) // Only send email
        
        const user = response.data
        this.user = user
        this.isAuthenticated = true
        
        return true
      } catch (error) {
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
      this.loading = true
      try {
        const response = await apiClient.get('/auth/check')
        this.user = response.data
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.clearAuth()
        return false
      } finally {
        this.loading = false
      }
    },

    clearAuth() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})