import { computed, toValue } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import apiClient from '../utils/axios'
import { useAuthStore } from '../stores/auth'

/**
 * API functions for attendance-related operations.
 * These are kept separate for clarity and reusability.
 */

const fetchTutors = async () => {
  const { data } = await apiClient.get('/users/tutor')
  return data.data || data
}

const fetchStudents = async () => {
  const { data } = await apiClient.get('/students')
  return data.data || data
}

const fetchRecords = async ({ page = 1, limit = 25, email = null, userId = null }) => {
  const params = { page, limit }
  if (email) {
    params.email = email
  }
  if (userId) {
    params.userId = userId
  }
  console.log('Fetching records with params:', params) // Debug log
  const { data } = await apiClient.get('/attendance', { params })
  console.log('API Response:', data) // Debug log
  return data // Return the full response to handle both formats
}

const deleteRecord = async (recordId) => {
  const { data } = await apiClient.delete(`/attendance/${recordId}`)
  return data
}

/**
 * Composable for managing attendance data.
 *
 * @param {Object} options - Configuration options for the composable.
 * @param {import('vue').Ref<number>} options.page - The current page number for pagination.
 * @param {import('vue').Ref<number>} options.limit - The number of records per page.
 * @returns {Object} An object containing attendance data, mutations, and state.
 */
export function useAttendance(options = {}) {
  const { page, limit } = options
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  const userEmail = computed(() => {
    // Only fetch records for the current user unless they are an admin
    if (authStore.isAdmin) {
      return null
    }
    return authStore.userEmail
  })
  
  const userId = computed(() => {
    // Only fetch records for the current user unless they are an admin
    if (authStore.isAdmin) {
      console.log('User is admin, not filtering by ID')
      return null
    }
    console.log('Current user:', authStore.user)
    console.log('User ID:', authStore.user?.id)
    return authStore.user?.id
  })
  
  // Debug computed to check user role
  const debugUserRole = computed(() => {
    console.log('Debug - User role from store:', authStore.userRole)
    console.log('Debug - User object:', authStore.user)
    console.log('Debug - User role from object:', authStore.user?.role)
    console.log('Debug - User roles from object:', authStore.user?.roles)
    return {
      userRole: authStore.userRole,
      userObject: authStore.user,
      roleFromObject: authStore.user?.role,
      rolesFromObject: authStore.user?.roles
    }
  })

  // --- QUERIES ---

  const tutorsQuery = useQuery({
    queryKey: ['tutors'],
    queryFn: fetchTutors,
  })

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  })

  const recordsQuery = useQuery({
    queryKey: ['records', page, limit, userEmail, userId],
    queryFn: () => fetchRecords({
      page: toValue(page),
      limit: toValue(limit),
      email: toValue(userEmail),
      userId: toValue(userId)
    }),
    // Keep previous data while fetching new data for a smoother UX
    placeholderData: (previousData) => previousData,
    // Only run the query if the user is authenticated
    enabled: computed(() => authStore.isAuthenticated),
  })

  // --- MUTATIONS ---

  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      // Invalidate and refetch the records query to show the updated list
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
  })

  // --- COMPUTED PROPERTIES ---

  const userRecords = computed(() => {
    const data = recordsQuery.data.value
    console.log('Records Query Data:', data) // Debug log
    
    // Handle different response formats
    if (data?.data) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    }
    return []
  })
  
  const pagination = computed(() => {
    const data = recordsQuery.data.value
    console.log('Pagination Data:', data?.pagination) // Debug log
    
    // Handle different response formats
    if (data?.pagination) {
      return data.pagination
    }
    return null
  })

  return {
    // Data
    tutors: tutorsQuery.data,
    students: studentsQuery.data,
    userRecords,
    pagination,

    // State
    isLoading: recordsQuery.isFetching,
    isError: recordsQuery.isError,
    error: recordsQuery.error,
    isDeleting: deleteMutation.isPending,

    // Methods
    deleteRecord: deleteMutation, // Expose the whole mutation object for more control
    refetch: recordsQuery.refetch,
  }
}