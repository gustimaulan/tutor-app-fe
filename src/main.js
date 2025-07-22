import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import './style.css'

// Import components
import Home from './views/Home.vue'
import Attendance from './views/Attendance.vue'
import Login from './views/Login.vue'
import Test from './views/Test.vue'
import { useAuthStore } from './stores/auth'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: Home,
      meta: { requiresAuth: true }
    },
    { 
      path: '/attendance', 
      component: Attendance,
      meta: { requiresAuth: true }
    },
    { 
      path: '/login', 
      component: Login
    },
    { 
      path: '/test', 
      component: Test
    }
  ]
})

// Preload components for faster navigation (commented out to avoid issues)
// const preloadComponents = () => {
//   // Preload all components immediately
//   import('./views/Home.vue')
//   import('./views/Attendance.vue')
//   import('./views/Login.vue')
// }

// Preload on app start
// preloadComponents()

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, {
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't automatically refetch on component mount
      refetchOnReconnect: true, // Only refetch when reconnecting
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    },
  },
})

// Initialize auth store after Pinia is installed
const authStore = useAuthStore()
authStore.init()

// Try to fetch user data on app start if token exists
if (authStore.token && !authStore.user) {
  authStore.fetchUser().catch(() => {
    // If fetch fails, clear invalid token
    authStore.clearAuth()
  })
}

// Navigation guard (after Pinia is installed)
router.beforeEach(async (to, from, next) => {
  // Check if route requires auth
  if (to.meta.requiresAuth) {
    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      next('/login')
      return
    }
    
    // If we have a token but no user data, try to fetch user
    if (!authStore.user && authStore.token) {
      try {
        const success = await authStore.fetchUser()
        if (!success) {
          // Token is invalid, clear auth and redirect to login
          authStore.clearAuth()
          next('/login')
          return
        }
      } catch (error) {
        // Token is invalid, clear auth and redirect to login
        authStore.clearAuth()
        next('/login')
        return
      }
    }
  }
  
  // If going to login page and already authenticated, redirect to home
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

app.mount('#app')
