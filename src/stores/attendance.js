import { defineStore } from 'pinia'
import apiClient from '@/utils/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// API functions
const fetchTutors = async () => {
  const response = await apiClient.get(`/users/tutor`)
  return response.data.data || response.data
}

const fetchStudents = async () => {
  const response = await apiClient.get(`/students`)
  return response.data.data || response.data
}

const fetchRecords = async ({ page = 1, limit = 25, email = null } = {}) => {
  const params = { page, limit }
  if (email) params.email = email
  const response = await apiClient.get(`/attendance`, { params })
  return response.data.data || response.data
}

const submitAttendance = async (data) => {
  const response = await apiClient.post(`/attendance`, {
    student_name: data.student_name,
    tutoring_date: data.tutoring_date,
    tutoring_time: data.tutoring_time,
    topic: data.topic || 'General',
    duration: data.duration || '1 Jam',
    status: data.status || 'Hadir',
    notes: data.notes || '',
    attendance_proof: data.attendance_proof || null
  })
  return response.data
}

const updateRecord = async (recordId, data) => {
  const response = await apiClient.patch(`/attendance/${recordId}`, {
    student_name: data.student_name,
    tutoring_date: data.tutoring_date,
    tutoring_time: data.tutoring_time,
    topic: data.topic,
    duration: data.duration,
    status: data.status,
    notes: data.notes || '',
    attendance_proof: data.attendance_proof || null
  })
  return response.data
}

const deleteRecord = async (recordId) => {
  const response = await apiClient.delete(`/attendance/${recordId}`)
  return response.data
}

const getUserProfile = async () => {
  const response = await apiClient.get(`/profile`)
  return response.data.data || response.data
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    tutors: [],
    students: [],
    records: [],
    pagination: null,
    loading: false,
    error: null,
    currentUser: null
  }),

  actions: {
    async fetchTutors() {
      this.loading = true
      try {
        const response = await apiClient.get(`/users/tutor`)
        this.tutors = response.data.data || response.data
      } catch (error) {
        console.error('Error fetching tutors:', error)
        this.error = error.response?.data?.error || error.message
      } finally {
        this.loading = false
      }
    },

    async fetchStudents() {
      this.loading = true
      try {
        const response = await apiClient.get(`/students`)
        this.students = response.data.data || response.data
      } catch (error) {
        console.error('Error fetching students:', error)
        this.error = error.response?.data?.error || error.message
      } finally {
        this.loading = false
      }
    },

    async fetchRecords(params = {}) {
      this.loading = true
      try {
        const response = await apiClient.get(`/attendance`, { params })
        this.records = response.data.data || response.data
        this.pagination = response.data.pagination || null
      } catch (error) {
        console.error('Error fetching records:', error)
        this.error = error.response?.data?.error || error.message
      } finally {
        this.loading = false
      }
    },

    async submitAttendance(data) {
      this.loading = true
      try {
        console.log('Submitting attendance data:', data)
        const response = await apiClient.post(`/attendance`, {
          student_name: data.student_name,
          tutoring_date: data.tutoring_date,
          tutoring_time: data.tutoring_time,
          topic: data.topic || 'General',
          duration: data.duration || '1 Jam',
          status: data.status || 'Hadir',
          notes: data.notes || '',
          attendance_proof: data.attendance_proof || null
        })
        console.log('Attendance submission response:', response.data)
        
        // Refresh records after successful submission
        await this.fetchRecords()
        return response.data
      } catch (error) {
        console.error('Error submitting attendance:', error)
        console.error('Error response:', error.response?.data)
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAttendance(recordId, data) {
      this.loading = true
      try {
        const response = await apiClient.patch(`/attendance/${recordId}`, {
          student_name: data.student_name,
          tutoring_date: data.tutoring_date,
          tutoring_time: data.tutoring_time,
          topic: data.topic,
          duration: data.duration,
          status: data.status,
          notes: data.notes || '',
          attendance_proof: data.attendance_proof || null
        })
        
        // Refresh records after successful update
        await this.fetchRecords()
        return response.data
      } catch (error) {
        console.error('Error updating attendance:', error)
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRecord(recordId) {
      this.loading = true
      try {
        const response = await apiClient.delete(`/attendance/${recordId}`)
        
        // Refresh records after successful deletion
        await this.fetchRecords()
        return response.data
      } catch (error) {
        console.error('Error deleting record:', error)
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getUserProfile() {
      this.loading = true
      try {
        const response = await apiClient.get(`/profile`)
        this.currentUser = response.data.data || response.data
        return this.currentUser
      } catch (error) {
        console.error('Error getting user profile:', error)
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    setCurrentUser(user) {
      this.currentUser = user
    },

    setError(error) {
      this.error = error
    }
  }
})

// Composable for using attendance queries and mutations
export function useAttendance() {
  const queryClient = useQueryClient()
  const store = useAttendanceStore()

  // Queries
  const tutorsQuery = useQuery({
    queryKey: ['tutors'],
    queryFn: fetchTutors
  })

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents
  })

  const recordsQuery = useQuery({
    queryKey: ['records', 1, 25],
    queryFn: () => fetchRecords({ page: 1, limit: 25 })
  })

  const userProfileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: !!localStorage.getItem('authToken')
  })

  // Filtered records for current user
  const userRecords = computed(() => {
    if (!recordsQuery.data.value || !store.currentUser) return []
    return recordsQuery.data.value.filter(record => record.tutor_id === store.currentUser.id)
  })

  // Mutations
  const submitMutation = useMutation({
    mutationFn: submitAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
    onError: (error) => {
      store.setError(error.response?.data?.error || error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ recordId, data }) => updateRecord(recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
    onError: (error) => {
      store.setError(error.response?.data?.error || error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
    },
    onError: (error) => {
      store.setError(error.response?.data?.error || error.message)
    }
  })

  return {
    // Queries
    tutors: tutorsQuery.data,
    students: studentsQuery.data,
    records: recordsQuery.data,
    userProfile: userProfileQuery.data,
    userRecords,
    pagination: computed(() => store.pagination),
    isLoading: computed(() => tutorsQuery.isLoading.value || studentsQuery.isLoading.value || recordsQuery.isLoading.value),
    isError: computed(() => tutorsQuery.isError.value || studentsQuery.isError.value || recordsQuery.isError.value),
    
    // Mutations
    submitAttendance: submitMutation.mutate,
    updateAttendance: updateMutation.mutate,
    deleteRecord: deleteMutation.mutate,
    isSubmitting: computed(() => submitMutation.isPending.value),
    isUpdating: computed(() => updateMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value)
  }
}