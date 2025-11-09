import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import './style.css'

/* Import components */
import Home from './views/Home.vue'
import Attendance from './views/Attendance.vue'
import Students from './views/Students.vue'
import Tutors from './views/Tutors.vue'
import Login from './views/Login.vue'
import Signup from './views/Signup.vue'
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
      path: '/students',
      component: Students,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/tutors',
      component: Tutors,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/signup',
      component: Signup
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
authStore.getCurrentUser().catch(() => {
  // If fetch fails, user is not authenticated (no session)
  console.log('No active session found')
})

// Navigation guard (after Pinia is installed)
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const isAuthenticated = authStore.isAuthenticated;
  const publicPages = ['/login', '/signup'];
  const authRequired = !publicPages.includes(to.path);

  // If route requires auth and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    // Try to restore session, if fails, redirect to login.
    if (!(await authStore.getCurrentUser())) {
      return next('/login');
    }
    
    // Check if route requires admin
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      // User is authenticated but not admin, redirect to home
      next('/')
      return
    }
  }
  
  // If user is authenticated and tries to access login/signup, redirect to home
  if (isAuthenticated && !authRequired) {
    next('/')
    return
  }
  
  next()
})

app.mount('#app')
