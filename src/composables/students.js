import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import apiClient from '../utils/axios'
import { useAuthStore } from '../stores/auth'

/**
 * API functions for student-related operations.
 */

const fetchStudents = async () => {
  const { data } = await apiClient.get('/students')
  return data.data || data
}

const addStudent = async (studentData) => {
  const { data } = await apiClient.post('/students', studentData)
  return data
}

const updateStudent = async ({ id, ...studentData }) => {
  const { data } = await apiClient.put(`/students/${id}`, studentData)
  return data
}

const deleteStudent = async (id) => {
  const { data } = await apiClient.delete(`/students/${id}`)
  return data
}

/**
 * Composable for managing students data.
 *
 * @returns {Object} An object containing students data, mutations, and state.
 */
export function useStudents() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  // --- QUERIES ---

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    // Only run query if user is authenticated and is admin
    enabled: computed(() => authStore.isAuthenticated && authStore.isAdmin),
  })

  // --- MUTATIONS ---

  const addMutation = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      // Invalidate and refetch students query to show updated list
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateStudent,
    onSuccess: () => {
      // Invalidate and refetch students query to show updated list
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      // Invalidate and refetch students query to show updated list
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  // --- COMPUTED PROPERTIES ---

  const students = computed(() => {
    const data = studentsQuery.data.value
    console.log('Students Query Data:', data) // Debug log
    
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
    students,

    // State
    isLoading: studentsQuery.isFetching,
    isError: studentsQuery.isError,
    error: studentsQuery.error,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Methods
    addStudent: addMutation,
    updateStudent: updateMutation,
    deleteStudent: deleteMutation,
    refetch: studentsQuery.refetch,
  }
}