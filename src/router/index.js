import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Import views
import Home from '../views/Home.vue'
import Attendance from '../views/Attendance.vue'
import Students from '../views/Students.vue'
import Tutors from '../views/Tutors.vue'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
  { path: '/attendance', name: 'Attendance', component: Attendance, meta: { requiresAuth: true } },
  { path: '/students', name: 'Students', component: Students, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/tutors', name: 'Tutors', component: Tutors, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/login', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Signup },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  // Requires auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  // If going to login/signup but already authenticated
  if ((to.path === '/login' || to.path === '/signup') && authStore.isAuthenticated) {
    next('/')
    return
  }
  // Requires admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
    return
  }
  next()
})

export default router