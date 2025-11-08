import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import apiClient from '../utils/axios'
import { useAuthStore } from '../stores/auth'

/**
 * API functions for tutor-related operations.
 */

const fetchTutors = async () => {
  const { data } = await apiClient.get('/users/tutor')
  return data.data || data
}

const addTutor = async (tutorData) => {
  const { data } = await apiClient.post('/users/tutor', tutorData)
  return data
}

const updateTutor = async ({ id, ...tutorData }) => {
  const { data } = await apiClient.put(`/users/${id}`, tutorData)
  return data
}

const deleteTutor = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}`)
  return data
}

/**
 * Composable for managing tutors data.
 *
 * @returns {Object} An object containing tutors data, mutations, and state.
 */
export function useTutors() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  // --- QUERIES ---

  const tutorsQuery = useQuery({
    queryKey: ['tutors'],
    queryFn: fetchTutors,
    // Only run query if user is authenticated and is admin
    enabled: computed(() => authStore.isAuthenticated && authStore.isAdmin),
  })

  // --- MUTATIONS ---

  const addMutation = useMutation({
    mutationFn: addTutor,
    onSuccess: () => {
      // Invalidate and refetch tutors query to show updated list
      queryClient.invalidateQueries({ queryKey: ['tutors'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTutor,
    onSuccess: () => {
      // Invalidate and refetch tutors query to show updated list
      queryClient.invalidateQueries({ queryKey: ['tutors'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTutor,
    onSuccess: () => {
      // Invalidate and refetch tutors query to show updated list
      queryClient.invalidateQueries({ queryKey: ['tutors'] })
    },
  })

  // --- COMPUTED PROPERTIES ---

  const tutors = computed(() => {
    const data = tutorsQuery.data.value
    console.log('Tutors Query Data:', data) // Debug log
    
    // Handle different response formats
    if (data?.data) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    }
    return []
  })

  return {
    // Data
    tutors,

    // State
    isLoading: tutorsQuery.isFetching,
    isError: tutorsQuery.isError,
    error: tutorsQuery.error,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Methods
    addTutor: addMutation,
    updateTutor: updateMutation,
    deleteTutor: deleteMutation,
    refetch: tutorsQuery.refetch,
  }
}