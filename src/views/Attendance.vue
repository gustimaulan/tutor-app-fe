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
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- Content -->
        <template v-else>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div class="flex-1">
              <h3 class="text-lg font-medium leading-6 text-gray-900">
                {{ authStore.user?.role === 'admin' ? 'All Attendance Records' : 'Your Attendance Records' }}
              </h3>
            </div>
            <div class="flex items-center space-x-4">
              <!-- Search Bar -->
              <div class="flex items-center space-x-1 md:mr-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search records..."
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
            </div>
          </div>
          
          <!-- Table View -->
          <div class="block">
            <!-- Empty State -->
            <div v-if="sortedRecords.length === 0" class="text-center py-12">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
              <p class="text-gray-500 mb-6">
                {{ searchQuery ? 'No records match your search criteria.' : (authStore.user?.role === 'admin' ? 'No attendance records in the system.' : 'Start by adding your first attendance record.') }}
              </p>
                              <button
                  v-if="authStore.user?.role !== 'admin'"
                  @click="openSidebar"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Record
                </button>
            </div>

            <!-- Table with Data -->
            <div v-else class="border border-gray-200 rounded-lg">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th scope="col" class="relative px-6 py-4">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr 
                    v-for="record in sortedRecords" 
                    :key="record.timestamp"
                    :class="[
                      'transition-all duration-300 cursor-pointer',
                      newlyAddedRecords.has(record.timestamp) ? 'new-record-highlight' : 'hover:bg-gray-50'
                    ]"
                    @click="viewRecord(record)"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ record.student_name }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ formatDate(record.tutoring_date) }}</div>
                      <div class="text-sm text-gray-500">{{ record.tutoring_time }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="relative dropdown-container">
                        <button 
                          @click.stop="toggleDropdown(record.record_id)"
                          :data-record-id="record.record_id"
                          class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <span class="sr-only">Open options</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <Transition name="fade">
                          <Teleport to="body">
                            <div 
                              v-if="openDropdown === record.record_id"
                              class="fixed bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-10 border border-gray-200 z-50"
                              :style="getDropdownPosition(record.record_id)"
                            >
                            <div class="py-1">
                              <button
                                @click.stop="openEditSidebar(record); closeDropdown()"
                                class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit Record
                              </button>
                              <button
                                @click.stop="handleDelete(record); closeDropdown()"
                                class="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors duration-150"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                Delete Record
                              </button>
                            </div>
                                                      </div>
                          </Teleport>
                        </Transition>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="sortedRecords.length > 0 && paginationInfo.total > 0" class="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-4 sm:space-y-0">
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
                :disabled="currentPage === totalPages"
                class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Floating Add Button -->
    <button
      v-if="authStore.user?.role !== 'admin'"
      @click="openSidebar"
      class="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Floating Edit Button -->
    <button
      v-if="editRecord"
      @click="openEditSidebar(editRecord)"
      class="fixed bottom-40 right-4 sm:bottom-20 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>

    <!-- Attendance Form Sidebar -->
    <AttendanceFormSidebar
      :is-open="isSidebarOpen"
      @close="closeSidebar"
      @submitted="handleSubmitted"
    />

    <!-- Record Details Modal -->
    <div v-if="selectedRecord" class="fixed inset-0 bg-opacity-50 dark:bg-black dark:bg-opacity-60 overflow-y-auto h-full w-full z-50" @click="closeDetailModal">
      <div class="relative top-0 md:top-20 mx-auto border max-w-lg shadow-lg rounded-lg bg-white flex flex-col h-full md:h-auto" @click.stop>
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 sm:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 class="text-lg sm:text-lg font-semibold text-gray-900">Record Details</h3>
          <div class="flex items-center space-x-2">
            <button
              @click="handleDelete(selectedRecord)"
              class="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Delete Record"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
            <button @click="closeDetailModal" class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Modal Content -->
        <div class="p-4 sm:p-4 flex-1 overflow-y-auto">
          <div class="space-y-6">
          <!-- Student -->
          <div class="space-y-2">
            <span class="text-sm font-medium text-gray-500">Student</span>
            <p class="text-base text-gray-900">{{ selectedRecord.student_name || 'No student name provided' }}</p>
          </div>
          
          <!-- Date and Time -->
          <div class="space-y-2">
            <span class="text-sm font-medium text-gray-500">Session Date and Time</span>
            <p class="text-base text-gray-900">{{ selectedRecord.tutoring_date && selectedRecord.tutoring_time ? formatDateTime(selectedRecord.tutoring_date, selectedRecord.tutoring_time) : 'No date/time provided' }}</p>
          </div>

          <!-- Bukti Ajar -->
          <div class="space-y-2">
            <span class="text-sm font-medium text-gray-500">Proof of Session</span>
            <div class="w-full">
              <img 
                v-if="selectedRecord.proof_of_teaching && selectedRecord.proof_of_teaching.trim() !== '' && selectedRecord.proof_of_teaching !== 'null' && !imageLoadError"
                :src="selectedRecord.proof_of_teaching" 
                :alt="`Bukti ajar for ${selectedRecord.student_name || 'student'}`"
                class="w-full h-96 object-cover rounded-lg border border-gray-200 mt-2"
                @error="handleImageError"
                @load="handleImageLoad"
                ref="proofImage"
              />
              <div v-else class="w-full h-96 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <p class="mt-2 text-sm text-gray-500">No proof image provided</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Submitted Time -->
          <div class="space-y-2">
            <span class="text-sm font-medium text-gray-500">Submitted</span>
            <p class="text-base text-gray-900">{{ selectedRecord.timestamp ? new Date(selectedRecord.timestamp).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }) : 'No submission time recorded' }}</p>
          </div>

          <!-- Admin Notice -->
          <div v-if="authStore.user?.role !== 'admin'" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  Contact admin for record deletion
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Sticky Footer with Close/Edit Buttons -->
        <div class="border-t border-gray-200 bg-white p-4 sm:p-4 sticky bottom-0">
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              @click="closeDetailModal"
              class="flex-1 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Close
            </button>
            <button
              @click="openEditSidebar(selectedRecord)"
              class="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Record
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Sidebar -->
    <EditAttendanceSidebar
      :is-open="isEditSidebarOpen"
      :record="editRecord"
      @close="closeEditSidebar"
      @submitted="handleSubmitted"
    />

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAttendance } from '../composables/attendance'
import { useToast } from '../composables/toast'
import { useQueryClient } from '@tanstack/vue-query'
import AttendanceFormSidebar from '../components/AttendanceFormSidebar.vue'
import EditAttendanceSidebar from '../components/EditAttendanceSidebar.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import apiClient from '../utils/axios'

const authStore = useAuthStore()
const toast = useToast()
const queryClient = useQueryClient()

// Pagination state
const currentPage = ref(1)
const pageSize = ref(25)
const pageSizeOptions = [25, 50, 100]

// Add after pageSizeOptions:
const searchQuery = ref('')
const sortBy = ref('date')
const sortOrder = ref('desc')

// Get attendance composable with pagination
const { 
  userRecords, 
  deleteRecord, 
  isLoading, 
  isDeleting,
  students,
  tutors,
  isError,
  submitAttendance,
  pagination,
  refetch
} = useAttendance({ page: currentPage, limit: pageSize })

// Sidebar state
const isSidebarOpen = ref(false)

// Dropdown state
const openDropdown = ref(null)

// Error state
const error = ref('')

// Confirmation dialog state
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => {}
})

// New record highlighting state
const newlyAddedRecords = ref(new Set())
const isInitialLoad = ref(true)

// Detail modal state
const selectedRecord = ref(null)

// Edit sidebar state
const isEditSidebarOpen = ref(false)
const editRecord = ref(null)

// Image loading state
const imageLoadError = ref(false)

// Watch for errors
watch(isError, (newValue) => {
  if (newValue) {
    error.value = 'Failed to load data. Please try again.'
  }
})

// Watch for new records to highlight them
watch(userRecords, (newRecords, oldRecords) => {
  // Skip highlighting on initial load
  if (isInitialLoad.value) {
    isInitialLoad.value = false
    return
  }
  
  if (oldRecords && newRecords && newRecords.length > oldRecords.length) {
    // Find newly added records by comparing timestamps
    const oldTimestamps = new Set(oldRecords.map(r => r.timestamp))
    const newlyAdded = newRecords.filter(r => !oldTimestamps.has(r.timestamp))
    
    // Add new record timestamps to the highlighting set
    newlyAdded.forEach(record => {
      newlyAddedRecords.value.add(record.timestamp)
      
      // Remove highlighting after 3 seconds
      setTimeout(() => {
        newlyAddedRecords.value.delete(record.timestamp)
      }, 3000)
    })
  }
}, { deep: true })

// Update displayRecords to filter by searchQuery:
const displayRecords = computed(() => {
  if (!searchQuery.value) return userRecords.value
  const q = searchQuery.value.toLowerCase()
  return userRecords.value.filter(r =>
    (r.student_name && r.student_name.toLowerCase().includes(q)) ||
    (r.tutoring_date && r.tutoring_date.toLowerCase().includes(q)) ||
    (r.tutoring_time && r.tutoring_time.toLowerCase().includes(q))
  )
})

// Server-side pagination info
const paginationInfo = computed(() => {
  const pag = pagination.value || {}
  const start = pag.totalRecords ? ((pag.page - 1) * pag.limit) + 1 : 0
  const end = Math.min(pag.page * pag.limit, pag.totalRecords)
  return {
    start,
    end,
    total: pag.totalRecords || 0,
    currentPage: pag.page || 1,
    totalPages: pag.totalPages || 0,
    hasNextPage: pag.hasNextPage || false,
    hasPrevPage: pag.hasPrevPage || false
  }
})

// Add after displayRecords computed:
const sortedRecords = computed(() => {
  let records = [...displayRecords.value]
  
  if (sortBy.value === 'date') {
    records.sort((a, b) => {
      const dateA = new Date(`${a.tutoring_date} ${a.tutoring_time}`)
      const dateB = new Date(`${b.tutoring_date} ${b.tutoring_time}`)
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
  }
  
  return records
})

// Methods
const goToPage = (page) => {
  if (page >= 1 && page <= paginationInfo.value.totalPages) {
    currentPage.value = page
  }
}

// Watch for pagination changes to refetch data
watch([currentPage, pageSize], () => {
  refetch()
}, { immediate: false })

const formatDate = (date) => {
  if (!date) return ''
  
  // Handle different date formats
  let dateObj
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, create Date object properly
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T00:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = new Date(date)
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date:', date)
    return 'Invalid Date'
  }
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = dayNames[dateObj.getDay()]
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${dayName}, ${day}/${month}/${year}`
}

const formatDateTime = (date, time) => {
  if (!date || !time) return ''
  
  // Handle different date formats
  let dateObj
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, create Date object properly
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T00:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = new Date(date)
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date:', date)
    return 'Invalid Date'
  }
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = dayNames[dateObj.getDay()]
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${dayName}, ${day}/${month}/${year} ${time}`
}

const isImageUrl = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  const urlLower = url.toLowerCase()
  return imageExtensions.some(ext => urlLower.includes(ext))
}

const viewRecord = (record) => {
  selectedRecord.value = record
}

const closeDetailModal = () => {
  selectedRecord.value = null
  imageLoadError.value = false
}

const handleImageError = () => {
  imageLoadError.value = true
}

const handleImageLoad = () => {
  imageLoadError.value = false
}

const openEditSidebar = (record) => {
  editRecord.value = { ...record }
  isEditSidebarOpen.value = true
}

const closeEditSidebar = () => {
  isEditSidebarOpen.value = false
  editRecord.value = null
}

const handleDelete = async (record) => {
  closeDetailModal()
  confirmDialog.value = {
    isOpen: true,
    title: 'Delete Record',
    message: `Are you sure you want to delete the record for ${record.student_name} on ${record.tutoring_date}?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await deleteRecord(record.record_id)
        toast.success('Record deleted successfully!')
        closeConfirmDialog()
      } catch (error) {
        console.error('Error deleting record:', error)
        toast.error('Failed to delete record. Please try again.')
        closeConfirmDialog()
      }
    }
  }
}

// Sidebar methods
const openSidebar = () => {
  isSidebarOpen.value = true
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleSubmitted = async () => {
  try {
    // Invalidate the records query to trigger a refetch
    await queryClient.invalidateQueries({ queryKey: ['records'] })
    
    // Show success message
    toast.success('Attendance submitted successfully!')
    
    // New records will be automatically highlighted by the watcher
  } catch (err) {
    console.error('Error refreshing records:', err)
    toast.error('Failed to refresh records. Please try again.')
  }
}

// Confirmation dialog methods
const closeConfirmDialog = () => {
  confirmDialog.value.isOpen = false
}

// Dropdown methods
const toggleDropdown = (recordId) => {
  if (openDropdown.value === recordId) {
    openDropdown.value = null
  } else {
    openDropdown.value = recordId
  }
}

const closeDropdown = () => {
  openDropdown.value = null
}

const getDropdownPosition = (recordId) => {
  const button = document.querySelector(`[data-record-id="${recordId}"]`)
  if (!button) return {}
  
  const rect = button.getBoundingClientRect()
  const dropdownWidth = 192 // w-48 = 12rem = 192px
  const dropdownHeight = 80 // Approximate height
  
  // Check if dropdown would go off the right edge
  let left = rect.right - dropdownWidth
  if (left < 0) {
    left = rect.left
  }
  
  // Check if dropdown would go off the bottom edge
  let top = rect.bottom + 8 // mt-2 = 8px
  if (top + dropdownHeight > window.innerHeight) {
    top = rect.top - dropdownHeight - 8
  }
  
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${dropdownWidth}px`
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  // Don't close if clicking on the dropdown button or menu items
  if (!event.target.closest('.dropdown-container')) {
    closeDropdown()
  }
}

// Lifecycle hooks
onMounted(async () => {
  console.log('Attendance component mounted')
  console.log('Auth store user:', authStore.user)
  console.log('Is authenticated:', authStore.isAuthenticated)
  console.log('Token in localStorage:', localStorage.getItem('authToken'))
  
  // Try to fetch user data if not already loaded
  if (!authStore.user && authStore.isAuthenticated) {
    console.log('Fetching user data...')
    await authStore.fetchUser()
  }
  
  // If still no user, try to fetch again
  if (!authStore.user && localStorage.getItem('authToken')) {
    console.log('Token exists but no user, trying to fetch user again...')
    await authStore.fetchUser()
  }
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const saveEdit = async () => {
  if (!editRecord.value) return
      try {
      await apiClient.patch(`/attendance/${editRecord.value.record_id}`, {
        student_name: editRecord.value.student_name,
        tutoring_date: editRecord.value.tutoring_date,
        tutoring_time: editRecord.value.tutoring_time,
        proof_of_teaching: editRecord.value.proof_of_teaching
      })
    toast.success('Record updated!')
    closeEditSidebar()
    refetch()
  } catch (err) {
    toast.error('Failed to update record')
  }
}

// Add after formatDateTime function:
const toggleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'desc'
  }
}
</script>

<style scoped>
@keyframes newRecordBlink {
  0%, 100% {
    background-color: rgb(240 253 244); /* green-50 */
    border-left-color: rgb(47, 224, 112); /* green-500 */
  }
  50% {
    background-color: rgb(187 247 208); /* green-200 */
    border-left-color: rgb(22 163 74); /* green-600 */
  }
}

.new-record-highlight {
  animation: newRecordBlink 1s ease-in-out 3;
  border-left: 4px solid rgb(34 197 94);
}

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