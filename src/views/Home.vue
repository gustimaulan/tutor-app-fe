<template>
  <div class="px-0 py-0 md:px-4 md:py-6 space-y-2">
    <!-- Personal Performance Card (only show if logged in) -->
    <PersonalPerformanceCard v-if="isLoggedIn" />
    
    <!-- Show message if not logged in -->
    <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="text-blue-700">Please log in to view your performance data.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import PersonalPerformanceCard from '../components/PersonalPerformanceCard.vue'

const authStore = useAuthStore()

const isLoggedIn = computed(() => {
  return !!authStore.user
})

onMounted(async () => {
  console.log('Home component mounted')
  console.log('Auth store user:', authStore.user)
  console.log('Is authenticated:', authStore.isAuthenticated)
  console.log('Token in localStorage:', localStorage.getItem('authToken'))
  
  // Try to fetch user data if not already loaded
  if (!authStore.user && authStore.isAuthenticated) {
    console.log('Fetching user data...')
    await authStore.fetchUser()
  }
  
  // If still no user, try to fetch again
  if (!authStore.user && localStorage.getItem('authToken')) {
    console.log('Token exists but no user, trying to fetch user again...')
    await authStore.fetchUser()
  }
})
</script> 