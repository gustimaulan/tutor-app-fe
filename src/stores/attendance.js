import { defineStore } from 'pinia'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Configure axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Add request interceptor to include JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions
const fetchTutors = async () => {
  const response = await axios.get(`${API_URL}/tutors`)
  return response.data
}

const fetchStudents = async () => {
  const response = await axios.get(`${API_URL}/students`)
  return response.data
}

const fetchRecords = async ({ page = 1, limit = 25 } = {}) => {
  const response = await axios.get(`${API_URL}/attendance`, {
    params: { page, limit }
  })
  return response.data.records || response.data
}

const submitAttendance = async (data) => {
  const response = await axios.post(`${API_URL}/attendance`, {
    nama_tutor: data.nama_tutor,
    nama_siswa: data.nama_siswa,
    tanggal: data.tanggal,
    waktu: data.waktu,
    bukti_ajar: data.bukti_ajar,
    email: data.email
  })
  return response.data
}

const deleteRecord = async (recordId) => {
  const response = await axios.delete(`${API_URL}/attendance/${recordId}`)
  return response.data
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    tutors: [],
    students: [],
    records: [],
    loading: false,
    error: null,
    currentUser: null
  }),

  actions: {
    async login(email, password) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password })
        this.currentUser = response.data.user
        localStorage.setItem('authToken', response.data.token)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await axios.post(`${API_URL}/auth/logout`)
        this.currentUser = null
        localStorage.removeItem('authToken')
      } catch (error) {
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async checkAuth() {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          this.currentUser = null
          return null
        }
        const response = await axios.get(`${API_URL}/auth/check`)
        this.currentUser = response.data.user
        return response.data.user
      } catch (error) {
        this.currentUser = null
        localStorage.removeItem('authToken')
        return null
      }
    },

    async fetchTutors() {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/tutors`)
        this.tutors = response.data
      } catch (error) {
        console.error('Error fetching tutors:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchStudents() {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/students`)
        this.students = response.data
      } catch (error) {
        console.error('Error fetching students:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchRecords() {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/attendance`)
        this.records = response.data
      } catch (error) {
        console.error('Error fetching records:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async submitAttendance(data) {
      this.loading = true
      try {
        console.log('Submitting attendance data:', data)
        const response = await axios.post(`${API_URL}/attendance`, {
          tutor_name: data.tutor_name,
          student_name: data.student_name,
          tutoring_date: data.tutoring_date,
          tutoring_time: data.tutoring_time,
          proof_of_teaching: data.proof_of_teaching,
          email: data.email
        })
        console.log('Attendance submission response:', response.data)
        
        if (response.data.success) {
          // Refresh records after successful submission
          await this.fetchRecords()
          return response.data
        } else {
          throw new Error(response.data.error || 'Failed to submit attendance')
        }
      } catch (error) {
        console.error('Error submitting attendance:', error)
        console.error('Error response:', error.response?.data)
        this.error = error.response?.data?.error || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRecord(recordId) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/attendance/${recordId}`)
        if (response.data.message) {
          // Refresh records after successful deletion
          await this.fetchRecords()
          return response.data
        } else {
          throw new Error(response.data.error || 'Failed to delete record')
        }
      } catch (error) {
        console.error('Error deleting record:', error)
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

  // Filtered records for current user
  const userRecords = computed(() => {
    if (!recordsQuery.data.value || !store.currentUser) return []
    return recordsQuery.data.value.filter(record => record.nama_tutor === store.currentUser.name)
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
    userRecords,
    isLoading: computed(() => tutorsQuery.isLoading.value || studentsQuery.isLoading.value || recordsQuery.isLoading.value),
    isError: computed(() => tutorsQuery.isError.value || studentsQuery.isError.value || recordsQuery.isError.value),
    
    // Mutations
    submitAttendance: submitMutation.mutate,
    deleteRecord: deleteMutation.mutate,
    isSubmitting: computed(() => submitMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value)
  }
} 