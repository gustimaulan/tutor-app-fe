<template>
  <div class="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 to-white p-4">
    <!-- Main content area that grows to fill space and centers the form -->
    <div class="flex-grow flex items-center justify-center">
      <router-view />
    </div>
    <!-- Footer section that stays at the bottom -->
    <div class="flex-shrink-0 flex items-center justify-center space-x-2 py-4">
      <h1 class="text-xl font-bold text-gray-900">TutorApp</h1>
      <span class="text-xs text-gray-500">v1.0.0</span>
    </div>
  </div>
</template>