<script setup>
import Form from './ui/Form.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'submitted'])

const handleSubmit = () => {
  emit('submitted')
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Form
    :is-open="isOpen"
    mode="add"
    @close="handleClose"
    @submitted="handleSubmit"
  />
</template>