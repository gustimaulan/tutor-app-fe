import { ref, reactive } from 'vue'

// Global toast state
const toasts = ref([])
let toastId = 0

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Toast composable
export function useToast() {
  const addToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = ++toastId
    const toast = {
      id,
      message,
      type,
      duration,
      visible: true
    }
    
    toasts.value.push(toast)
    
    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearAllToasts = () => {
    toasts.value = []
  }
  
  // Convenience methods
  const success = (message, duration) => addToast(message, TOAST_TYPES.SUCCESS, duration)
  const error = (message, duration) => addToast(message, TOAST_TYPES.ERROR, duration)
  const info = (message, duration) => addToast(message, TOAST_TYPES.INFO, duration)
  const warning = (message, duration) => addToast(message, TOAST_TYPES.WARNING, duration)
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    info,
    warning
  }
} 