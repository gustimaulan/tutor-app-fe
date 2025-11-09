<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { computed, ref, onMounted, watchEffect } from 'vue'
import { useSwipeNavigation } from '../composables/swipeNavigation'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)
const activePage = computed(() => route.path)

// Swipe navigation setup
const { useSwipeGesture, swipeDirection } = useSwipeNavigation()
const mainContentRef = ref(null)

const handleSignOut = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Add watch effect to close mobile menu on route change
watchEffect(() => {
  // This will re-run whenever route.path changes
  closeMobileMenu()
})

// Remove loading indicator for faster perceived navigation
// router.beforeEach(() => {
//   isLoading.value = true
// })

// router.afterEach(() => {
//   isLoading.value = false
// })

// Initialize swipe gestures on mount
onMounted(() => {
  if (mainContentRef.value) {
    useSwipeGesture(mainContentRef)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <nav class="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center justify-center space-x-2">
              <h1 class="text-xl font-bold text-gray-900">TutorApp</h1>
              <span class="text-xs text-gray-500">v1.0.0</span>
            </div>
            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200"
                active-class="border-blue-500 text-gray-900"
                exact-active-class="border-blue-500 text-gray-900"
              >
                Home
              </router-link>
              <router-link
                to="/attendance"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200"
                active-class="border-blue-500 text-gray-900"
                exact-active-class="border-blue-500 text-gray-900"
              >
                Attendance Records
              </router-link>
              <!-- Admin only navigation -->
              <template v-if="authStore.isAdmin">
                <router-link
                  to="/students"
                  class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200"
                  active-class="border-blue-500 text-gray-900"
                  exact-active-class="border-blue-500 text-gray-900"
                >
                  Students
                </router-link>
                <router-link
                  to="/tutors"
                  class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200"
                  active-class="border-blue-500 text-gray-900"
                  exact-active-class="border-blue-500 text-gray-900"
                >
                  Tutors
                </router-link>
              </template>
            </div>
          </div>
          
          <!-- Desktop User Menu -->
          <div class="hidden sm:flex items-center space-x-4">
            <span class="text-sm text-gray-600">Welcome, {{ authStore.user?.name }}</span>
            <button 
              @click="handleSignOut" 
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          <!-- Mobile menu button -->
          <div class="sm:hidden flex items-center">
            <button
              @click="toggleMobileMenu"
              class="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none transition-colors duration-100"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-6 w-6 transition-all duration-150" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  v-if="!isMobileMenuOpen"
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
                <path 
                  v-else
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="mobile-menu">
        <div v-if="isMobileMenuOpen" class="sm:hidden bg-white border-t border-gray-200 shadow-lg">
          <div class="pt-4 pb-3 border-t border-gray-200">
            <div class="px-4">
              <div class="text-base font-medium text-gray-800">{{ authStore.user?.name }}</div>
              <div class="text-sm font-medium text-gray-500">{{ authStore.user?.email }}</div>
            </div>
            <div class="mt-3 px-2">
              <button
                @click="handleSignOut"
                class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-100"
              >
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- Main Content -->
    <main 
      ref="mainContentRef"
      class="max-w-7xl mx-auto py-4 lg:px-8 pt-20 pb-24 sm:pb-6"
    >
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-40">
      <div class="flex justify-around items-center h-16">
        <router-link
          to="/"
          class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95"
          :class="[
            route.path === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <!-- Statistics Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-xs mt-1" :class="{ 'font-semibold': route.path === '/', 'font-normal': route.path !== '/' }">Stats</span>
        </router-link>
        <router-link
          to="/attendance"
          class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95"
          :class="[
            route.path === '/attendance' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="text-xs mt-1" :class="{ 'font-semibold': route.path === '/attendance', 'font-normal': route.path !== '/attendance' }">Records</span>
        </router-link>
        <!-- Admin only mobile navigation -->
        <template v-if="authStore.isAdmin">
          <router-link
            to="/students"
            class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95"
            :class="[
              route.path === '/students' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="text-xs mt-1" :class="{ 'font-semibold': route.path === '/students', 'font-normal': route.path !== '/students' }">Students</span>
          </router-link>
          <router-link
            to="/tutors"
            class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95"
            :class="[
              route.path === '/tutors' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-xs mt-1" :class="{ 'font-semibold': route.path === '/tutors', 'font-normal': route.path !== '/tutors' }">Tutors</span>
          </router-link>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mobile menu transitions - optimized for mobile performance */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.15s ease-out;
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Optimize for mobile devices */
@media (max-width: 640px) {
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: all 0.1s ease-out;
  }
}
</style> 