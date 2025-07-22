import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import apiClient from '../utils/axios'

// API functions
const fetchTutors = async () => {
  const response = await apiClient.get('/tutors')
  return response.data
}

const fetchStudents = async () => {
  const response = await apiClient.get('/students')
  return response.data
}

const fetchRecords = async ({ page = 1, limit = 25, authStore } = {}) => {
  // Handle reactive refs by extracting values
  const pageValue = typeof page === 'object' && page?.value !== undefined ? page.value : page
  const limitValue = typeof limit === 'object' && limit?.value !== undefined ? limit.value : limit
  
  console.log('Fetching records with params:', { page: pageValue, limit: limitValue })
  console.log('Auth store user:', authStore?.user)
  console.log('Auth token:', localStorage.getItem('authToken'))
  
  // Build params with server-side filtering
  const params = { page: pageValue, limit: limitValue }
  
  // Only filter by tutor if not admin
  if (authStore?.user?.role !== 'admin') {
    params.tutor_name = authStore.user.name
  }
  
  console.log('Final request params:', params)
  
  try {
    const response = await apiClient.get('/attendance', { params })
    console.log('Records response:', response.data)
    console.log('Records array:', response.data.records)
    console.log('Records array length:', response.data.records?.length)
    return response.data
  } catch (error) {
    console.error('Error fetching records:', error)
    console.error('Error response:', error.response?.data)
    throw error
  }
}

const submitAttendance = async (data) => {
  const response = await apiClient.post('/attendance', {
    tutor_name: data.tutor_name,
    student_name: data.student_name,
    tutoring_date: data.tutoring_date,
    tutoring_time: data.tutoring_time,
    proof_of_teaching: data.proof_of_teaching,
    email: data.email
  })
  return response.data
}

const deleteRecord = async (record_id) => {
  try {
    const response = await apiClient.delete(`/attendance/${record_id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Add updateAttendance function
const updateAttendance = async (record_id, data) => {
  try {
    const response = await apiClient.patch(`/attendance/${record_id}`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

// Composable for using attendance queries and mutations
export function useAttendance(options = {}) {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  // Queries with improved caching
  const tutorsQuery = useQuery({
    queryKey: ['tutors'],
    queryFn: fetchTutors,
    staleTime: 10 * 60 * 1000, // 10 minutes - tutors don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
    refetchOnReconnect: true // Only refetch when reconnecting to internet
  })

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    staleTime: 10 * 60 * 1000, // 10 minutes - students don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
    refetchOnReconnect: true
  })

  // Simplified query key to prevent unnecessary cache invalidation
  const recordsQueryKey = computed(() => {
    const baseKey = ['records']
    const page = (typeof options.page === 'object' && options.page?.value !== undefined) ? options.page.value : (options.page || 1)
    const limit = (typeof options.limit === 'object' && options.limit?.value !== undefined) ? options.limit.value : (options.limit || 25)
    
    // Only include user-specific info if not admin
    if (authStore.user?.role !== 'admin') {
      return [...baseKey, page, limit, authStore.user?.name]
    }
    return [...baseKey, page, limit, 'admin']
  })

  const recordsQuery = useQuery({
    queryKey: recordsQueryKey,
    queryFn: () => {
      const page = (typeof options.page === 'object' && options.page?.value !== undefined) ? options.page.value : (options.page || 1)
      const limit = (typeof options.limit === 'object' && options.limit?.value !== undefined) ? options.limit.value : (options.limit || 25)
      return fetchRecords({ page, limit, authStore })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - attendance records change more frequently
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
    refetchOnReconnect: true,
    enabled: !!authStore.user, // Only run query when user is loaded
    onSuccess: (data) => {
      console.log('Attendance composable: Records loaded successfully:', data)
      console.log('Attendance composable: Records count:', data?.records?.length)
    },
    onError: (error) => {
      console.error('Attendance composable: Error loading records:', error)
    }
  })

  // Records for current user (server-side filtered)
  const userRecords = computed(() => {
    if (!recordsQuery.data.value || !authStore.user) return []
    
    // Since we're now using server-side filtering, return records from the response
    return recordsQuery.data.value.records || []
  })

  // Pagination info
  const pagination = computed(() => recordsQuery.data.value?.pagination || {})

  // Mutations with optimized cache invalidation
  const submitMutation = useMutation({
    mutationFn: submitAttendance,
    onSuccess: () => {
      // Only invalidate records queries, not tutors/students
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
    onError: (error) => {
      console.error('Submit error:', error.response?.data?.error || error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (record_id) => deleteRecord(record_id),
    onSuccess: () => {
      // Only invalidate records queries
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
    onError: (error) => {
      console.error('Delete error:', error.response?.data?.error || error.message)
    }
  })

  return {
    // Queries
    tutors: tutorsQuery.data,
    students: studentsQuery.data,
    records: computed(() => recordsQuery.data.value?.records || []),
    userRecords,
    pagination,
    isLoading: computed(() => tutorsQuery.isLoading.value || studentsQuery.isLoading.value || recordsQuery.isLoading.value),
    isError: computed(() => tutorsQuery.isError.value || studentsQuery.isError.value || recordsQuery.isError.value),
    
    // Mutations
    submitAttendance: submitMutation.mutate,
    deleteRecord: deleteMutation.mutate,
    isSubmitting: computed(() => submitMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value),
    
    // Pagination helpers
    refetch: recordsQuery.refetch,
    updateAttendance,
  }
} 