import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Import layouts
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Import views
import Home from '../views/Home.vue'
import Attendance from '../views/Attendance.vue'
import Students from '../views/Students.vue'
import Tutors from '../views/Tutors.vue'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'

const routes = [
  {
    path: '/', // Jadikan DefaultLayout sebagai root untuk halaman terotentikasi
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Home', component: Home }, // Halaman default setelah login
      { path: '/attendance', name: 'Attendance', component: Attendance },
      { path: '/students', name: 'Students', component: Students, meta: { requiresAdmin: true } },
      { path: '/tutors', name: 'Tutors', component: Tutors, meta: { requiresAdmin: true } },
    ]
  },
  {
    path: '/login', // Top-level login route under AuthLayout
    component: AuthLayout,
    children: [
      { path: '', name: 'Login', component: Login, meta: { guestOnly: true } },
    ]
  },
  {
    path: '/signup', // Top-level signup route under AuthLayout
    component: AuthLayout,
    children: [
      { path: '', name: 'Signup', component: Signup, meta: { guestOnly: true } },
    ]
  },
  {
    path: '/auth', // Legacy support: redirect to /login
    redirect: { name: 'Login' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  // Initialize auth store here to ensure it's available
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  const isAuthRoute = to.matched.some(record => record.meta && record.meta.guestOnly)

  // If trying to access a protected route and not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
    return
  }

  // If trying to access login/signup but already authenticated
  if (isAuthRoute && isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  // If route requires admin and user is not an admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Home' })
    return
  }
  next()
})

export default router