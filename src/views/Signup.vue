<template>
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-800">
          Create Account
        </h2>
        <p class="text-gray-500 mt-2">Sign up to get started</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6" novalidate>
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-3 rounded-lg border transition-colors outline-none"
            :class="errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'"
            placeholder="Enter your full name"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 rounded-lg border transition-colors outline-none"
            :class="errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'"
            placeholder="Enter your email"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-3 rounded-lg border transition-colors outline-none"
            :class="errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'"
            placeholder="Create a password"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-3 rounded-lg border transition-colors outline-none"
            :class="errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'"
            placeholder="Re-enter your password"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Creating account...' : 'Sign up' }}
        </button>

        <div v-if="error" class="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
          {{ error }}
        </div>

        <div class="text-sm text-center text-gray-600">
          Already have an account?
          <router-link :to="{ name: 'Login' }" class="text-blue-600 hover:text-blue-700 font-medium">Sign in</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { registerAction } from '../actions/authActions.js'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const error = ref('')
const loading = ref(false)
const errors = ref({})

const validateForm = () => {
  errors.value = {}

  if (!name.value) {
    errors.value.name = 'Full name is required.'
  }

  if (!email.value) {
    errors.value.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'Please enter a valid email address.'
  }

  if (!password.value) {
    errors.value.password = 'Password is required.'
  } else if (password.value.length < 6) {
    errors.value.password = 'Password must be at least 6 characters.'
  }

  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match.'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  loading.value = true
  error.value = ''

  try {
    const payload = {
      name: name.value,
      email: email.value,
      password: password.value,
      status: 'Aktif'
    }

    const result = await registerAction(payload)

    if (result.success) {
      const data = result.data || {}
      const token = data.token
      const user = data.user || data.data || null

      if (token) {
        localStorage.setItem('authToken', token)
        authStore.token = token
      }

      if (user) {
        authStore.user = user
      } else {
        await authStore.getCurrentUser()
      }

      router.push('/')
    } else {
      error.value = result.error || 'Registration failed'
    }
  } catch (err) {
    error.value = err?.message || 'An error occurred during registration'
  } finally {
    loading.value = false
  }
}
</script>