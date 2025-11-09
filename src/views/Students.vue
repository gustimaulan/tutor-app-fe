<template>
  <div class="md:px-4 md:py-6 sm:px-0">
    <div class="bg-white shadow sm:rounded-lg">
      <div class="p-4 md:p-6">
        <!-- Error State -->
        <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ error?.message || 'Failed to load students' }}</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div v-if="!error" class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div class="flex-1">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Students Management</h3>
            </div>
            <div class="flex items-center space-x-4">
              <!-- Search Bar -->
              <div class="flex items-center space-x-1 md:mr-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search students..."
                  class="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white p-1 md:p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm transition-all"
                />
              </div>
              <!-- Entries per page -->
              <div class="flex items-center space-x-2">
                <select
                  v-model="pageSize"
                  class="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white p-1 md:p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm transition-all"
                >
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">
                    {{ size }}
                  </option>
                </select>
                <span class="text-sm text-gray-600">entries</span>
              </div>
              <!-- Add Student (Plus) Button -->
              <button
                @click="openAddModal"
                class="inline-flex items-center px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Add Student"
                title="Add Student"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="hidden sm:inline ml-2">Add</span>
              </button>
            </div>
          </div>
          
          <!-- Table View -->
          <div class="block w-full">
            <!-- Empty State -->
            <div v-if="!isLoading && (!filteredStudents || filteredStudents.length === 0)" class="text-center py-12">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p class="text-gray-500 mb-6">
                {{ searchQuery ? 'No students match your search criteria.' : 'Start by adding your first student.' }}
              </p>
              <button
                @click="openAddModal"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add First Student
              </button>
            </div>

            <!-- Table with Data -->
            <div v-else-if="filteredStudents && filteredStudents.length > 0" class="border border-gray-200 rounded-lg">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" class="relative px-6 py-4">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <!-- Loading rows - Only show on initial load when no data exists yet -->
                    <template v-if="isLoading && (!students || students.length === 0)">
                      <tr v-for="i in 3" :key="`loading-${i}`">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="animate-pulse">
                            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="animate-pulse">
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="animate-pulse">
                            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="animate-pulse">
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="animate-pulse">
                            <div class="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div>
                          </div>
                        </td>
                      </tr>
                    </template>
                    
                    <!-- Actual data rows -->
                    <template v-else>
                      <tr
                        v-for="student in paginatedStudents"
                        :key="student.id"
                        class="transition-all duration-300 hover:bg-gray-50"
                      >
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{{ student.name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getLevelBadgeClass(student.level)">
                            {{ student.level }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getStatusBadgeClass(student.status)">
                            {{ student.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{{ formatDate(student.created_at) }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="relative dropdown-container">
                            <button
                              @click.stop="openDropdownMenu($event, student.id)"
                              :data-student-id="student.id"
                              class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <span class="sr-only">Open options</span>
                              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div
                              v-if="openDropdown === student.id"
                              class="fixed w-48 bg-white rounded-md shadow-lg z-[100] border border-gray-200"
                              :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }"
                            >
                              <div class="py-1">
                                <button
                                  @click="openEditModal(student)"
                                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit Student
                                </button>
                                <button
                                  @click="handleDelete(student)"
                                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Student
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="paginationInfo.total > 0" class="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-4 sm:space-y-0">
            <div class="text-sm text-gray-700">
              Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }} entries
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Student Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center z-50 pt-10 sm:pt-0 sm:items-center" @click="closeModal">
      <div class="relative w-full max-w-md mx-auto bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh] sm:max-h-[80vh]" @click.stop>
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ editingStudent ? 'Edit Student' : 'Add New Student' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div class="p-4 sm:p-4 flex-1 overflow-y-auto">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                placeholder="Enter student name"
                class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
                :class="{'border-red-500': errors.name}"
              />
              <Transition name="fade">
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </Transition>
            </div>
            
            <!-- Level -->
            <div class="relative">
              <label for="level" class="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                id="level"
                v-model="formData.level"
                required
                class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all appearance-none bg-white pr-10"
                :class="{'border-red-500': errors.level}"
              >
                <option value="">Select Level</option>
                <option value="TK">TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
              <!-- Custom dropdown arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none top-7">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <Transition name="fade">
                <p v-if="errors.level" class="mt-1 text-sm text-red-600">{{ errors.level }}</p>
              </Transition>
            </div>
            
            <!-- Status -->
            <div class="relative">
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                v-model="formData.status"
                required
                class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all appearance-none bg-white pr-10"
                :class="{'border-red-500': errors.status}"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
              <!-- Custom dropdown arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none top-7">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <Transition name="fade">
                <p v-if="errors.status" class="mt-1 text-sm text-red-600">{{ errors.status }}</p>
              </Transition>
            </div>
          </form>
        </div>
        
        <!-- Footer with Actions -->
        <div class="border-t border-gray-200 bg-white p-4 sm:p-4 mt-auto">
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Processing...' : (editingStudent ? 'Update Student' : 'Add Student') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="closeConfirmDialog"
    />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStudents } from '../composables/students'
import { useToast } from '../composables/toast'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const {
  students,
  isLoading,
  isError,
  error,
  addStudent,
  updateStudent,
  deleteStudent,
  refetch
} = useStudents()

const toast = useToast()

// Pagination state
const currentPage = ref(1)
const pageSize = ref(25)
const pageSizeOptions = [25, 50, 100]

// Search state
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const editingStudent = ref(null)
const isSubmitting = ref(false)

// Dropdown state
const openDropdown = ref(null)
const dropdownPosition = ref({ top: 0, left: 0 })

// Open dropdown with fixed positioning to escape overflow clipping
const openDropdownMenu = (event, studentId) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const menuWidth = 192 // Tailwind w-48 = 12rem
  const spacing = 8
  // Position horizontally aligned to the button's right edge
  let left = rect.right - menuWidth
  // Clamp within viewport
  left = Math.max(spacing, Math.min(left, window.innerWidth - menuWidth - spacing))
  // Default drop below the button
  let top = rect.bottom + spacing
  const menuHeight = 120 // approximate height of the menu
  // If it would overflow bottom viewport, flip above the button
  if (top + menuHeight > window.innerHeight) {
    top = rect.top - spacing - menuHeight
  }
  dropdownPosition.value = { top, left }
  openDropdown.value = studentId
}

// Form data
const formData = ref({
  name: '',
  level: '',
  status: 'Aktif'
})

// Form errors
const errors = ref({})

// Confirmation dialog state
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => {}
})

// Filter and search students
const filteredStudents = computed(() => {
  if (!students.value) return []
  
  if (!searchQuery.value) {
    return students.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student => {
    return student.name?.toLowerCase().includes(query) ||
           student.level?.toLowerCase().includes(query) ||
           student.status?.toLowerCase().includes(query)
  })
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / pageSize.value)
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredStudents.value.slice(start, end)
})

const paginationInfo = computed(() => {
  const total = filteredStudents.value.length
  const start = total > 0 ? (currentPage.value - 1) * pageSize.value + 1 : 0
  const end = Math.min(currentPage.value * pageSize.value, total)
  
  return { start, end, total }
})

// Pagination functions
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Watch for page size changes
watch(pageSize, () => {
  currentPage.value = 1
})

// Watch for search changes
watch(searchQuery, () => {
  currentPage.value = 1
})

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'No date'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

const getLevelBadgeClass = (level) => {
  const classes = {
    'TK': 'bg-purple-100 text-purple-800',
    'SD': 'bg-blue-100 text-blue-800',
    'SMP': 'bg-green-100 text-green-800',
    'SMA': 'bg-yellow-100 text-yellow-800'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}

const getStatusBadgeClass = (status) => {
  return status === 'Aktif' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

// Modal functions
const openAddModal = () => {
  editingStudent.value = null
  formData.value = {
    name: '',
    level: '',
    status: 'Aktif'
  }
  errors.value = {}
  isModalOpen.value = true
}

const openEditModal = (student) => {
  editingStudent.value = student
  formData.value = {
    name: student.name,
    level: student.level,
    status: student.status
  }
  errors.value = {}
  isModalOpen.value = true
  closeDropdown()
}

const closeModal = () => {
  isModalOpen.value = false
  editingStudent.value = null
  errors.value = {}
}

// Dropdown functions
const toggleDropdown = (studentId) => {
  openDropdown.value = openDropdown.value === studentId ? null : studentId
}

const closeDropdown = () => {
  openDropdown.value = null
}

// Confirmation dialog functions
const closeConfirmDialog = () => {
  confirmDialog.value.isOpen = false
}

// Form validation
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!formData.value.level) {
    errors.value.level = 'Level is required'
  }
  
  if (!formData.value.status) {
    errors.value.status = 'Status is required'
  }
  
  return Object.keys(errors.value).length === 0
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    if (editingStudent.value) {
      await updateStudent.mutateAsync({
        id: editingStudent.value.id,
        ...formData.value
      })
      toast.success('Student updated successfully')
    } else {
      await addStudent.mutateAsync(formData.value)
      toast.success('Student added successfully')
    }
    
    closeModal()
  } catch (error) {
    console.error('Error saving student:', error)
    toast.error(editingStudent.value ? 'Failed to update student' : 'Failed to add student')
  } finally {
    isSubmitting.value = false
  }
}

// Delete function
const handleDelete = (student) => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Delete Student',
    message: `Are you sure you want to delete ${student.name}?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await deleteStudent.mutateAsync(student.id)
        toast.success('Student deleted successfully')
        closeDropdown()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete student')
      } finally {
        closeConfirmDialog()
      }
    }
  }
}

// Click outside handler
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    closeDropdown()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Dropdown fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.15s ease-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}
</style>