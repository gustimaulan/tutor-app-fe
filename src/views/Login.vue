<template>
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-800">
          Welcome Back
        </h2>
        <p class="text-gray-500 mt-2">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6" novalidate>
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
            class="w-full px-4 py-3 rounded-lg border transition-colors outline-none"
            :class="errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'"
            placeholder="Enter your password"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>

        <div v-if="error" class="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
          {{ error }}
        </div>

        <div class="text-sm text-center text-gray-600">
          Don't have an account?
          <router-link :to="{ name: 'Signup' }" class="text-blue-600 hover:text-blue-700 font-medium">Create account</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!email.value) {
    errors.value.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'Please enter a valid email address.'
  }
  
  if (!password.value) {
    errors.value.password = 'Password is required.'
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
    await authStore.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    const errorMessage = authStore.error || 'An error occurred during login';
    if (errorMessage.toLowerCase().includes('invalid credentials')) {
      errors.value.password = 'The password you entered is incorrect.';
      error.value = ''; // Clear the general error message
    } else {
      error.value = errorMessage;
    }
  } finally {
    loading.value = false
  }
}
</script>