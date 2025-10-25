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
      staleTime: 60000,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
})

// Initialize auth store after Pinia is installed
const authStore = useAuthStore()

// Try to fetch user data on app start to check session
authStore.fetchUser().catch(() => {
  // If fetch fails, user is not authenticated (no session)
  console.log('No active session found')
})

// Navigation guard (after Pinia is installed)
router.beforeEach(async (to, from, next) => {
  // Check if route requires auth
  if (to.meta.requiresAuth) {
    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      // Try to fetch user data to check for active session
      try {
        const success = await authStore.fetchUser()
        if (!success) {
          // No active session, redirect to login
          next('/login')
          return
        }
      } catch (error) {
        // No active session, redirect to login
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
