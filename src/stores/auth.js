import { defineStore } from 'pinia'
import { loginAction, logoutAction, getCurrentUserAction, registerAction } from '../actions/authActions.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    userRoles: (state) => state.user?.roles || [],
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.roles?.includes('admin') || false,
    userName: (state) => state.user?.name,
    userEmail: (state) => state.user?.email
  },

  actions: {
    async login(credentials) {
      this.isLoading = true
      this.error = null

      const result = await loginAction(credentials)

      if (result.success) {
        if (result.data.token) {
          this.token = result.data.token
          localStorage.setItem('authToken', result.data.token)
        }

        if (result.data.user) {
          this.user = result.data.user
          console.log('Auth store - user data set from login:', this.user)
        } else {
          const userResult = await getCurrentUserAction()
          if (userResult.success) {
            this.user = userResult.data.data || userResult.data
            console.log('Auth store - user data set from auth check:', this.user)
          }
        }

        this.isLoading = false
        return result
      } else {
        this.error = result.error
        this.isLoading = false
        return result
      }
    },

    async logout() {
      const result = await logoutAction()

      if (result.success) {
        this.user = null
        this.token = null
        this.error = null
        localStorage.removeItem('authToken')
      }

      return result
    },

    async register(userData) {
      this.isLoading = true
      this.error = null

      const result = await registerAction(userData)

      if (result.success) {
        if (result.data.token) {
          this.token = result.data.token
          localStorage.setItem('authToken', result.data.token)
        }

        if (result.data.user) {
          this.user = result.data.user
          console.log('Auth store - user data set from register:', this.user)
        } else {
          const userResult = await getCurrentUserAction()
          if (userResult.success) {
            this.user = userResult.data.data || userResult.data
            console.log('Auth store - user data set from auth check:', this.user)
          }
        }

        this.isLoading = false
        return result
      } else {
        this.error = result.error
        this.isLoading = false
        return result
      }
    },

    async getCurrentUser() {
      if (!this.token) {
        return null
      }

      const result = await getCurrentUserAction()

      if (result.success) {
        this.user = result.data.data || result.data
        console.log('Auth store - user data set:', this.user)
        return result.data.data || result.data
      } else {
        this.error = result.error
        this.token = null
        localStorage.removeItem('authToken')
        return null
      }
    },

    clearError() {
      this.error = null
    }
  }
})