import apiClient from '../utils/axios'

// Submit attendance action
export async function submitAttendanceAction(formData) {
  try {
    const response = await apiClient.post('/attendance', {
      student_id: formData.student_id,
      student_name: formData.student_name, // Keep for backward compatibility
      tutoring_date: formData.tutoring_date,
      tutoring_time: formData.tutoring_time,
      topic: formData.topic || 'Tutoring Session',
      duration: formData.duration || '1 hour',
      status: formData.status || 'Hadir',
      notes: formData.notes || '',
      attendance_proof: formData.attendance_proof || ''
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Submit attendance error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to submit attendance'
    }
  }
}

// Update attendance action
export async function updateAttendanceAction(recordId, formData) {
  try {
    const response = await apiClient.patch(`/attendance/${recordId}`, {
      student_id: formData.student_id,
      student_name: formData.student_name, // Keep for backward compatibility
      tutoring_date: formData.tutoring_date,
      tutoring_time: formData.tutoring_time,
      topic: formData.topic,
      duration: formData.duration,
      status: formData.status,
      notes: formData.notes,
      attendance_proof: formData.attendance_proof || ''
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Update attendance error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update attendance'
    }
  }
}

// Delete attendance action
export async function deleteAttendanceAction(recordId) {
  try {
    const response = await apiClient.delete(`/attendance/${recordId}`)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Delete attendance error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete attendance'
    }
  }
}

// Upload image action
export async function uploadImageAction(formData) {
  try {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return { success: true, data: { url: response.data.url } }
  } catch (error) {
    console.error('Upload image error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to upload image'
    }
  }
}

// Fetch students action
export async function fetchStudentsAction() {
  try {
    const response = await apiClient.get('/students')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    console.error('Fetch students error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch students'
    }
  }
}

// Fetch tutors action
export async function fetchTutorsAction() {
  try {
    const response = await apiClient.get('/users/tutor')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    console.error('Fetch tutors error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch tutors'
    }
  }
}

// Fetch attendance records action
export async function fetchAttendanceRecordsAction(params = {}) {
  try {
    const response = await apiClient.get('/attendance', { params })
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Fetch attendance records error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch attendance records'
    }
  }
}

// Get user profile action
export async function getUserProfileAction() {
  try {
    const response = await apiClient.get('/profile')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    console.error('Get user profile error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get user profile'
    }
  }
}