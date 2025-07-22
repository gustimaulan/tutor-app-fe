<script setup>
import DefaultLayout from './layouts/DefaultLayout.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
  <DefaultLayout>
    <router-view></router-view>
  </DefaultLayout>
  <ToastContainer />
</template>

<style>
/* Add padding to prevent content from being hidden behind bottom nav on mobile */
@media (max-width: 640px) {
  body {
    padding-bottom: 4rem;
  }
}
</style>
