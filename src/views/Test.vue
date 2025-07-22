<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Authentication Test</h1>
    
    <div class="space-y-4">
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold">Auth Store State:</h2>
        <pre>{{ JSON.stringify(authStore, null, 2) }}</pre>
      </div>
      
      <div class="bg-blue-100 p-4 rounded">
        <h2 class="font-semibold">Local Storage:</h2>
        <p>authToken: {{ localStorage.getItem('authToken') ? 'Present' : 'Not found' }}</p>
      </div>
      
      <div class="bg-green-100 p-4 rounded">
        <h2 class="font-semibold">Actions:</h2>
        <button @click="testLogin" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Test Login
        </button>
        <button @click="testFetchUser" class="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Test Fetch User
        </button>
        <button @click="testLogout" class="bg-red-500 text-white px-4 py-2 rounded">
          Test Logout
        </button>
      </div>
      
      <div v-if="testResult" class="bg-yellow-100 p-4 rounded">
        <h2 class="font-semibold">Test Result:</h2>
        <pre>{{ testResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const testResult = ref('')

const testLogin = async () => {
  try {
    testResult.value = 'Testing login...'
    await authStore.login('admin@example.com', 'admin123')
    testResult.value = 'Login successful!'
  } catch (error) {
    testResult.value = `Login failed: ${error.message}`
  }
}

const testFetchUser = async () => {
  try {
    testResult.value = 'Testing fetch user...'
    const success = await authStore.fetchUser()
    testResult.value = `Fetch user result: ${success}`
  } catch (error) {
    testResult.value = `Fetch user failed: ${error.message}`
  }
}

const testLogout = async () => {
  try {
    testResult.value = 'Testing logout...'
    await authStore.logout()
    testResult.value = 'Logout successful!'
  } catch (error) {
    testResult.value = `Logout failed: ${error.message}`
  }
}
</script> 