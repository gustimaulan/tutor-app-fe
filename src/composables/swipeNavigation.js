import { useGesture } from '@vueuse/gesture'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

export function useSwipeNavigation() {
  const router = useRouter()
  const swipeDirection = ref('')
  
  // Define the route order for navigation
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/attendance', name: 'Attendance' }
  ]
  
  const useSwipeGesture = (elementRef) => {
    useGesture(
      {
        onDrag: ({ movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy], cancel }) => {
          // Only trigger on horizontal swipes with sufficient velocity
          if (Math.abs(mx) > Math.abs(my) && Math.abs(vx) > 0.5) {
            const currentPath = router.currentRoute.value.path
            const currentIndex = routes.findIndex(route => route.path === currentPath)
            
            if (currentIndex !== -1) {
              if (xDir > 0 && currentIndex > 0) {
                // Swipe right - go to previous page
                router.push(routes[currentIndex - 1].path)
                swipeDirection.value = 'right'
              } else if (xDir < 0 && currentIndex < routes.length - 1) {
                // Swipe left - go to next page
                router.push(routes[currentIndex + 1].path)
                swipeDirection.value = 'left'
              }
            }
            cancel()
          }
        }
      },
      {
        target: elementRef,
        eventOptions: { passive: false }
      }
    )
  }
  
  return {
    useSwipeGesture,
    swipeDirection
  }
} 