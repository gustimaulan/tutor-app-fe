import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router' // Import router from its own file
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

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin)

app.mount('#app')
