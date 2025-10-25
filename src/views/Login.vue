<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 m-4">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">
            Welcome Back
          </h2>
          <p class="text-gray-500 mt-2">Sign in to continue</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors outline-none"
              placeholder="Enter your email"
            />
          </div>

          <!-- Remove password field since backend doesn't require it -->

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
        </form>
      </div>
    </div>
    <div class="flex-shrink-0 flex items-center justify-center space-x-2 mt-32">
        <h1 class="text-xl font-bold text-gray-900">TutorApp</h1>
        <span class="text-xs text-gray-500">v1.0.0</span>
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
// Remove password ref
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(email.value) // Only pass email
    router.push('/')
  } catch (err) {
    error.value = authStore.error || 'An error occurred during login'
  } finally {
    loading.value = false
  }
}
</script>