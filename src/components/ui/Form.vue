<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import { useAttendance } from '../../composables/attendance'
import { uploadImageAction, submitAttendanceAction, updateAttendanceAction } from '../../actions/attendanceActions.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  mode: {
    type: String,
    required: true,
    validator: (value) => ['add', 'edit'].includes(value)
  },
  record: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close', 'submitted'])

const authStore = useAuthStore()

// Get attendance composable
const {
  students,
  isLoading
} = useAttendance()

// Form state
const form = ref({
  student_id: null,
  student_name: '', // Keep for backward compatibility
  tutoring_date: '',
  tutoring_time: '',
  topic: '',
  duration: '90',
  attendance_proof: ''
})

// File upload state
const selectedFile = ref(null)
const compressedFile = ref(null)
const compressionStats = ref(null)
const uploadProgress = ref(0)
const isUploading = ref(false)
const isCompressing = ref(false)
const isSubmitting = ref(false)
const fileInput = ref(null)
const imageLoadError = ref(false)
const showImagePreview = ref(true)

// Error state
const formError = ref('')

// Student search state
const showStudentSuggestions = ref(false)
const filteredStudents = ref([])
const maxSuggestions = 10 // Maximum number of suggestions to show

// Computed properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isLoggedIn = computed(() => {
  return authStore.user !== null
})

const isFormValid = computed(() => {
  const baseValidation = (form.value.student_id || form.value.student_name) &&
         form.value.tutoring_date &&
         form.value.tutoring_time
  
  // For add mode, require a file to be selected
  if (props.mode === 'add') {
    return baseValidation && selectedFile.value
  }
  
  // For edit mode, file is optional
  return baseValidation
})

const formTitle = computed(() => {
  return props.mode === 'add' ? 'Add New Attendance' : 'Edit Attendance'
})

const submitButtonText = computed(() => {
  if (isCompressing.value) return 'Compressing...'
  if (isUploading.value) return 'Uploading...'
  if (isSubmitting.value) return props.mode === 'add' ? 'Submitting...' : 'Updating...'
  return props.mode === 'add' ? 'Submit' : 'Update'
})

const imageLabel = computed(() => {
  return props.mode === 'add' ? 'Teaching Proof Image *' : 'Bukti Ajar (Teaching Proof Image)'
})

const imageHelpText = computed(() => {
  return props.mode === 'add' 
    ? 'Upload an image showing proof of your teaching session'
    : (form.value.proof_of_teaching ? 'Upload a new image to replace the current one' : 'Upload an image as teaching proof')
})

// Watch for sidebar opening to populate/reset form
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (props.mode === 'add') {
      resetForm()
      // Initialize filtered students when opening add form
      filteredStudents.value = students.value || []
    } else if (props.mode === 'edit' && props.record) {
      console.log(`${props.mode === 'edit' ? 'Edit' : 'Add'}AttendanceSidebar: Populating form with record:`, props.record)
      // Reset file upload state
      selectedFile.value = null
      compressedFile.value = null
      compressionStats.value = null
      showImagePreview.value = true
      
      // Map fields from backend to frontend form
      form.value = {
        student_id: props.record.student_id || null,
        student_name: props.record.student_name || '', // Keep for backward compatibility
        tutoring_date: props.record.tutoring_date || '',
        tutoring_time: props.record.tutoring_time || '',
        topic: props.record.topic || '',
        duration: props.record.duration || '90',
        attendance_proof: props.record.attendance_proof || ''
      }
      // Initialize filtered students when opening edit form
      filteredStudents.value = students.value || []
      console.log(`${props.mode === 'edit' ? 'Edit' : 'Add'}AttendanceSidebar: Form after population:`, form.value)
      console.log(`${props.mode === 'edit' ? 'Edit' : 'Add'}AttendanceSidebar: Available students:`, students)
      console.log(`${props.mode === 'edit' ? 'Edit' : 'Add'}AttendanceSidebar: Form attendance_proof:`, form.value.attendance_proof)
      console.log(`${props.mode === 'edit' ? 'Edit' : 'Add'}AttendanceSidebar: Show image preview:`, showImagePreview.value)
    }
  }
})

// Watch for students data changes
watch(students, (newStudents) => {
  filteredStudents.value = newStudents || []
})

// Watch for file changes to clean up previous URLs
watch([selectedFile, compressedFile], ([newSelected, newCompressed], [oldSelected, oldCompressed]) => {
  // Clean up old URLs after a short delay to allow preview to remain visible
  setTimeout(() => {
    if (oldSelected && oldSelected !== newSelected) {
      revokeFilePreviewUrl(getFilePreviewUrl(oldSelected))
    }
    if (oldCompressed && oldCompressed !== newCompressed) {
      revokeFilePreviewUrl(getFilePreviewUrl(oldCompressed))
    }
  }, 100)
})

// Clean up URLs on unmount
onUnmounted(() => {
  if (selectedFile.value) {
    revokeFilePreviewUrl(getFilePreviewUrl(selectedFile.value))
  }
  if (compressedFile.value) {
    revokeFilePreviewUrl(getFilePreviewUrl(compressedFile.value))
  }
})

// Methods
const resetForm = () => {
  form.value.student_id = null
  form.value.student_name = ''
  form.value.tutoring_date = ''
  form.value.tutoring_time = ''
  form.value.topic = ''
  form.value.duration = '90'
  form.value.attendance_proof = ''
  selectedFile.value = null
  compressedFile.value = null
  compressionStats.value = null
  uploadProgress.value = 0
  isUploading.value = false
  formError.value = ''
  showStudentSuggestions.value = false
  filteredStudents.value = students.value || []
}

const closeSidebar = () => {
  emit('close')
  formError.value = ''
}

// File upload methods
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    formError.value = 'Please select an image file (JPG, PNG, GIF, WEBP)'
    return false
  }
  
  if (file.size > maxSize) {
    formError.value = 'Image size must be less than 10MB'
    return false
  }
  
  return true
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    compressedFile.value = null
    compressionStats.value = null
    formError.value = ''
    
    // Hide current image preview when new file is selected (only for edit mode)
    if (props.mode === 'edit') {
      showImagePreview.value = false
    }
    
    // Compress image immediately after selection
    if (file.type.startsWith('image/')) {
      await compressSelectedImage(file)
    }
  }
}

// Drag and drop handlers
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleDrop = async (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (validateFile(file)) {
      selectedFile.value = file
      compressedFile.value = null
      compressionStats.value = null
      formError.value = ''
      
      // Hide current image preview when new file is dropped (only for edit mode)
      if (props.mode === 'edit') {
        showImagePreview.value = false
      }
      
      // Compress image immediately after drop
      if (file.type.startsWith('image/')) {
        await compressSelectedImage(file)
      }
    }
  }
}

const getFilePreviewUrl = (file) => {
  if (!file) return ''
  return window.URL.createObjectURL(file)
}

// Function to revoke object URLs to prevent memory leaks
const revokeFilePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    window.URL.revokeObjectURL(url)
  }
}

const compressImageToWebP = (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to WebP blob
      canvas.toBlob(resolve, 'image/webp', quality)
    }
    
    img.src = window.URL.createObjectURL(file)
  })
}

const compressSelectedImage = async (file) => {
  try {
    isCompressing.value = true
    const compressedBlob = await compressImageToWebP(file)
    if (compressedBlob) {
      // Create a new File object with WebP extension
      const originalName = file.name.replace(/\.[^/.]+$/, '')
      const compressedFileObj = new File([compressedBlob], `${originalName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now()
      })
      
      // Store compression stats
      compressionStats.value = {
        originalSize: file.size,
        compressedSize: compressedFileObj.size,
        originalFormat: file.type,
        compressedFormat: 'image/webp',
        compressionRatio: ((file.size - compressedFileObj.size) / file.size * 100).toFixed(1)
      }
      compressedFile.value = compressedFileObj
      
      console.log(`Compressed ${file.name} from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFileObj.size / 1024).toFixed(1)}KB`)
    }
  } catch (error) {
    console.warn('Image compression failed:', error)
    formError.value = 'Image compression failed, but you can still upload the original file'
  } finally {
    isCompressing.value = false
  }
}

const uploadFile = async (file) => {
  // Use compressed file if available, otherwise use original
  const fileToUpload = compressedFile.value || file

  const formData = new FormData()
  formData.append('file', fileToUpload)
  
  try {
    const result = await uploadImageAction(formData)
    if (result.success) {
      return result.data.url
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error(error.message || 'Upload failed')
  }
}

const handleSubmit = async () => {
  formError.value = ''
  
  try {
    if (!isFormValid.value) {
      formError.value = props.mode === 'add'
        ? 'Please fill in all required fields and select an image'
        : 'Please fill in all required fields'
      return
    }

    // Upload image if a new one was selected
    if (selectedFile.value) {
      isUploading.value = true
      try {
        const uploadedUrl = await uploadFile(selectedFile.value)
        form.value.attendance_proof = uploadedUrl
      } catch (uploadError) {
        formError.value = uploadError.message || 'Failed to upload image'
        return
      } finally {
        isUploading.value = false
      }
    }

    // Submit form
    isSubmitting.value = true
    
    try {
      if (props.mode === 'add') {
        const result = await submitAttendanceAction(form.value)
        if (!result.success) {
          throw new Error(result.error || 'Failed to submit attendance')
        }
      } else if (props.mode === 'edit') {
        const result = await updateAttendanceAction(props.record.record_id || props.record.id, form.value)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update attendance')
        }
      }
      emit('submitted')
      closeSidebar()
    } catch (submitError) {
      console.error('Form submission error:', submitError)
      formError.value = submitError.message || `Failed to ${props.mode} attendance`
    } finally {
      isSubmitting.value = false
    }
    
  } catch (err) {
    console.error('Form submission error:', err)
    formError.value = err.message || `Failed to ${props.mode} attendance`
  }
}

// Image error handling
const handleImageError = () => {
  console.log('Image failed to load')
  imageLoadError.value = true
}

const handleImageLoad = () => {
  console.log('Image loaded successfully')
  imageLoadError.value = false
}

// Toggle image preview
const toggleImagePreview = () => {
  showImagePreview.value = !showImagePreview.value
}

// Clear image preview
const clearImagePreview = () => {
  showImagePreview.value = false
}

const replaceImage = () => {
  showImagePreview.value = false
  fileInput.value?.click()
}

const clearSelectedFile = () => {
  selectedFile.value = null
  compressedFile.value = null
  compressionStats.value = null
  if (props.mode === 'edit') {
    showImagePreview.value = true
  }
}

// Student search methods
const filterStudents = () => {
  if (!form.value.student_name) {
    // Show only first N students when no search term
    filteredStudents.value = (students.value || []).slice(0, maxSuggestions)
    return
  }
  
  const searchTerm = form.value.student_name.toLowerCase()
  filteredStudents.value = (students.value || [])
    .filter(student => student.name.toLowerCase().includes(searchTerm))
    .slice(0, maxSuggestions) // Limit to max suggestions
}

const selectStudent = (student) => {
  form.value.student_id = student.id
  form.value.student_name = student.name
  showStudentSuggestions.value = false
}

const hideStudentSuggestions = () => {
  // Delay hiding to allow click on suggestion
  setTimeout(() => {
    showStudentSuggestions.value = false
  }, 200)
}
</script>

<template>
  <!-- Sidebar Overlay -->
  <Teleport to="body">
    <Transition name="sidebar">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex">
        <!-- Background overlay -->
        <Transition name="fade">
          <div
            v-if="isOpen"
            class="fixed inset-0 bg-slate-500/50 transition-opacity"
            @click="closeSidebar"
          ></div>
        </Transition>
        
        <!-- Sidebar panel -->
        <Transition name="slide">
          <div
            v-if="isOpen"
            class="ml-auto w-full sm:w-80 bg-white shadow-xl flex flex-col relative transform transition-transform h-full sm:h-auto"
          >
            <!-- Header -->
            <div class="flex justify-between items-center p-4 sm:p-4 border-b border-gray-200 bg-white">
              <h3 class="text-lg sm:text-lg font-semibold text-gray-900">{{ formTitle }}</h3>
              <button 
                @click="closeSidebar" 
                class="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Form Content -->
            <div class="p-4 sm:p-4 flex-1 overflow-y-auto">
              <form @submit.prevent="handleSubmit" class="space-y-6">

                <!-- Student Selection -->
                <div class="relative">
                  <label for="student_name" class="block text-sm font-medium text-gray-700 mb-2">
                    Student
                  </label>
                  <div class="relative">
                    <input
                      id="student_name"
                      v-model="form.student_name"
                      type="text"
                      placeholder="Type student name..."
                      class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
                      required
                      @input="filterStudents"
                      @focus="showStudentSuggestions = true"
                      @blur="hideStudentSuggestions"
                    />
                    
                    <!-- Student Suggestions Dropdown -->
                    <div v-if="showStudentSuggestions && filteredStudents.length > 0"
                         class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div v-for="student in filteredStudents" :key="student.id"
                           @mousedown="selectStudent(student)"
                           class="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors">
                        {{ student.name }}
                      </div>
                      <div v-if="(students.value || []).length > maxSuggestions && !form.value.student_name"
                           class="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                        Type to search more students... (showing {{ filteredStudents.length }} of {{ (students.value || []).length }})
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Date -->
                <div>
                  <label for="tutoring_date" class="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="tutoring_date"
                    v-model="form.tutoring_date"
                    :max="today"
                    class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
                    required
                  />
                </div>

                <!-- Time -->
                <div>
                  <label for="tutoring_time" class="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    id="tutoring_time"
                    v-model="form.tutoring_time"
                    class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
                    required
                  />
                </div>

                <!-- Topic -->
                <div>
                  <label for="topic" class="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    v-model="form.topic"
                    placeholder="ex: Past Tense, Sistem Pernafasan, etc."
                    class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
                  />
                </div>

                <!-- Duration -->
                <div class="relative">
                  <label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    id="duration"
                    v-model="form.duration"
                    class="block py-3 px-4 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all appearance-none bg-white pr-10"
                    required
                  >
                    <option value="90">90 (1h 30m)</option>
                    <option value="120">120 (2h)</option>
                    <option value="180">180 (3h)</option>
                  </select>
                  <!-- Custom dropdown arrow -->
                  <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none top-7">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>

                <!-- Teaching Proof -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ imageLabel }}
                  </label>
                  
                  <!-- Current Image Preview (only for edit mode) -->
                  <div v-if="mode === 'edit' && form.attendance_proof && !selectedFile && showImagePreview" class="mb-4">
                    <div class="relative">
                      <img
                        :src="form.attendance_proof"
                        alt="Current proof"
                        class="w-full h-64 object-cover rounded-lg"
                        @error="handleImageError"
                        @load="handleImageLoad"
                      />
                      <button
                        type="button"
                        @click="clearImagePreview"
                        class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                        title="Close image preview"
                      >
                        <svg class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        @click="replaceImage"
                        class="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-700 transition-colors"
                        title="Replace image"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                  
                  <!-- Image Upload Area -->
                  <div v-if="!selectedFile && (mode === 'add' || !showImagePreview || !form.attendance_proof)"
                       class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                       @dragover="handleDragOver"
                       @drop="handleDrop"
                       @click="fileInput?.click()">
                    <input
                      type="file"
                      @change="handleFileSelect"
                      accept="image/*"
                      class="hidden"
                      ref="fileInput"
                      :required="mode === 'add'"
                    />
                    
                    <div v-if="!isUploading && !isCompressing">
                      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <div class="mt-4">
                        <span class="text-blue-600 font-medium">{{ mode === 'add' ? 'Choose image' : 'Choose new image' }}</span>
                        <p class="text-gray-500 text-sm mt-1">or drag and drop</p>
                      </div>
                      <p class="text-xs text-gray-400 mt-2">PNG, JPG, GIF, WEBP up to 10MB</p>
                      <p class="text-xs text-green-600 mt-1">Images will be automatically compressed to WebP format</p>
                    </div>
                    
                    <!-- Compression Progress -->
                    <div v-else-if="isCompressing" class="text-center">
                      <div class="animate-spin mx-auto h-8 w-8 text-orange-600 mb-2">
                        <svg fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p class="text-sm text-gray-600">Compressing image...</p>
                    </div>
                    
                    <!-- Upload Progress -->
                    <div v-else-if="isUploading" class="text-center">
                      <div class="animate-spin mx-auto h-8 w-8 text-blue-600 mb-2">
                        <svg fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p class="text-sm text-gray-600">Uploading image...</p>
                    </div>
                  </div>

                  <!-- Image Selected Preview -->
                  <div v-if="selectedFile && !isUploading" class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <svg class="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                        </svg>
                        <div class="ml-3">
                          <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                          <p class="text-xs text-gray-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="clearSelectedFile"
                        class="text-red-500 hover:text-red-700"
                      >
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <!-- Image Preview -->
                    <div class="border rounded-lg overflow-hidden bg-gray-50 mb-2">
                      <img
                        :key="compressedFile ? compressedFile.name : selectedFile.name"
                        :src="getFilePreviewUrl(compressedFile || selectedFile)"
                        :alt="selectedFile.name"
                        class="w-full h-32 object-cover"
                        @error="console.error('Image preview failed')"
                        @load="console.log('Image preview loaded successfully')"
                      />
                    </div>

                    <!-- Compression Results -->
                    <div v-if="compressionStats" class="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div class="flex items-center mb-2">
                        <svg class="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm font-medium text-green-800">Compression Complete!</span>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span class="text-gray-600">Original:</span>
                          <div class="font-medium text-gray-900">{{ (compressionStats.originalSize / 1024).toFixed(1) }} KB</div>
                          <div class="text-gray-500">{{ compressionStats.originalFormat.split('/')[1].toUpperCase() }}</div>
                        </div>
                        <div>
                          <span class="text-gray-600">Compressed:</span>
                          <div class="font-medium text-green-700">{{ (compressionStats.compressedSize / 1024).toFixed(1) }} KB</div>
                          <div class="text-green-600">WebP</div>
                        </div>
                      </div>
                      <div class="mt-2 text-center">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {{ compressionStats.compressionRatio }}% smaller
                        </span>
                      </div>
                    </div>
                    
                    <!-- Compression Progress (when file is selected) -->
                    <div v-else-if="isCompressing" class="text-center">
                      <div class="animate-spin mx-auto h-8 w-8 text-orange-600 mb-2">
                        <svg fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p class="text-sm text-gray-600">Compressing image...</p>
                    </div>
                  </div>
                  
                  <p v-if="!selectedFile && (mode === 'add' || !showImagePreview || !form.attendance_proof)" class="mt-1 text-xs text-gray-500">
                    {{ imageHelpText }}
                  </p>
                </div>

                <!-- Error Message -->
                <Transition name="fade">
                  <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div class="ml-3">
                        <p class="text-red-600 text-sm">{{ formError }}</p>
                      </div>
                    </div>
                  </div>
                </Transition>
              </form>
            </div>

            <!-- Footer with Actions -->
            <div class="border-t border-gray-200 bg-white p-4 sm:p-4 sticky bottom-0">
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="closeSidebar"
                  class="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 min-h-[44px] bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  @click="handleSubmit"
                  :disabled="isSubmitting || isUploading || isCompressing || !isFormValid"
                  class="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 min-h-[44px] bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg v-if="isSubmitting || isUploading || isCompressing" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ submitButtonText }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Sidebar transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition for sidebar panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>