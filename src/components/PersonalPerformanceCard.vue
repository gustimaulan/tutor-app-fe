<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="p-4 md:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div class="flex items-center justify-between w-full">
        <div>
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            {{ authStore.user?.role === 'admin' ? 'Overall Performance' : 'Your Performance' }}
          </h3>
        </div>
          <div class="flex items-center justify-end space-x-2 sm:w-auto">
          <label for="timeFilter" class="text-sm text-gray-600 whitespace-nowrap">Period:</label>
          <select 
            id="timeFilter" 
            v-model="selectedPeriod" 
              class="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white p-1 md:p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm transition-all"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>
        </div>
        
        <!-- Filter Dropdown -->
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-400 mb-2">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="text-red-500 text-sm">Failed to load performance data</p>
        <button 
          @click="recordsQuery.refetch()"
          class="mt-2 text-blue-600 hover:text-blue-700 text-sm"
        >
          Try again
        </button>
      </div>

      <!-- Performance Stats -->
      <div v-else-if="currentUser" class="space-y-6">
        <!-- Main Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
            <div class="text-2xl md:text-3xl font-bold text-blue-600">{{ userStats.totalSessions }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ authStore.user?.role === 'admin' ? 'All Sessions' : 'Total Sessions' }}</div>
          </div>
          
          <div class="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center">
            <div class="text-2xl md:text-3xl font-bold text-green-600">{{ userStats.uniqueStudents }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ authStore.user?.role === 'admin' ? 'Active Students' : 'Students Taught' }}</div>
          </div>
          
          <!-- <div class="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">{{ userStats.avgPerDay }}</div>
            <div class="text-sm text-gray-600 mt-1">Avg per Day</div>
          </div>
          
          <div class="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-orange-600">{{ userStats.streak }}</div>
            <div class="text-sm text-gray-600 mt-1">Day Streak</div>
          </div> -->
        </div>

        <!-- Trend Chart Section -->
        <div class="rounded-lg">
          <h4 class="text-lg font-medium text-gray-900 mb-4">Activity Trend</h4>
          
          <!-- Chart Container -->
          <div class="relative h-48 md:h-64 bg-white rounded-lg border border-gray-200 p-2 md:p-4">
            <svg class="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
              <!-- Grid lines -->
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="400" height="200" fill="url(#grid)" />
              
              <!-- Y-axis labels -->
              <g fill="#6b7280" font-size="12" font-family="system-ui, -apple-system, sans-serif">
                <text x="5" y="15" text-anchor="start" dominant-baseline="middle">{{ maxSessions }}</text>
                <text x="5" y="105" text-anchor="start" dominant-baseline="middle">{{ Math.floor(maxSessions / 2) }}</text>
                <text x="5" y="195" text-anchor="start" dominant-baseline="middle">0</text>
              </g>
              
              <!-- Smooth rounded line chart -->
              <polyline
                v-if="chartData.length > 1"
                :points="chartPoints"
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                class="drop-shadow-sm"
              />
              
              <!-- Data points -->
              <g v-for="(point, index) in chartData" :key="index">
                <circle
                  :cx="point.x"
                  :cy="point.y"
                  r="3"
                  fill="#3b82f6"
                  class="drop-shadow-sm hover:r-5 transition-all cursor-pointer"
                  @mouseover="showTooltip(point, $event)"
                  @mouseout="hideTooltip"
                  @touchstart="showTooltip(point, $event)"
                  @touchend="hideTooltip"
                />
              </g>
              
              <!-- X-axis labels -->
              <g fill="#6b7280" font-size="10" font-family="system-ui, -apple-system, sans-serif">
                <text 
                  v-for="(label, index) in xAxisLabels" 
                  :key="index"
                  :x="40 + (index * (320 / Math.max(1, xAxisLabels.length - 1)))"
                  y="195"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  {{ label }}
                </text>
              </g>
            </svg>
            
            <!-- Tooltip -->
            <div
              v-if="tooltip.show"
              class="absolute bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 transform -translate-x-1/2 -translate-y-full"
              :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
              {{ tooltip.content }}
            </div>
          </div>
          
          <!-- Chart Legend -->
          <div class="flex items-center justify-center mt-4 space-x-6 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span class="text-gray-600">Sessions per {{ getChartPeriodLabel() }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div v-if="recentSessions.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <h4 class="text-lg font-medium text-gray-900 mb-4">{{ authStore.user?.role === 'admin' ? 'Recent Activity' : 'Recent Sessions' }}</h4>
          <div class="space-y-3">
            <div 
              v-for="session in recentSessions.slice(0, 10)" 
              :key="session.timestamp"
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-100 last:border-b-0 space-y-1 sm:space-y-0"
            >
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-900 truncate">{{ session.student_name }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(session.tutoring_date) }} at {{ session.tutoring_time }}</div>
                </div>
              </div>
              <div class="text-xs text-gray-400 sm:ml-4 pl-5 sm:pl-0">
                {{ getTimeAgo(session.tutoring_date, session.tutoring_time) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-else-if="!isLoading && userStats.totalSessions === 0" class="text-center py-8">
        <div class="text-gray-400 mb-2">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="text-gray-500 text-sm md:text-base">No attendance sessions found for {{ periodLabels[selectedPeriod] }}</p>
        <p class="text-sm text-gray-400 mt-2">
          {{ authStore.user?.role === 'admin' ? 'No activity recorded in this period' : 'Start by submitting your first attendance record!' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAttendance } from '../composables/attendance'
import { useAuthStore } from '../stores/auth'
import { useQuery } from '@tanstack/vue-query'
import apiClient from '../utils/axios'

const authStore = useAuthStore()

// Fetch records with pagination for performance
const fetchRecordsForPerformance = async () => {
  console.log('PersonalPerformanceCard: Fetching records for performance')
  console.log('Auth store user:', authStore.user)
  console.log('Auth token:', localStorage.getItem('authToken'))
  
  // For performance card, we need all records for the current user
  // Use a larger limit to get more records in fewer requests
  const params = { 
    page: 1, 
    limit: 1000 // Get more records in one request
  }
  
  // Only filter by tutor if not admin
  if (authStore.user?.role !== 'admin') {
    params.tutor_name = authStore.user?.name
  }
  
  console.log('PersonalPerformanceCard: Request params:', params)
  
  try {
    const response = await apiClient.get('/attendance', { params })
    console.log('PersonalPerformanceCard: Response:', response.data)
    console.log('PersonalPerformanceCard: Records array:', response.data.records)
    console.log('PersonalPerformanceCard: Records array length:', response.data.records?.length)
    return response.data.records || response.data
  } catch (error) {
    console.error('PersonalPerformanceCard: Error fetching records:', error)
    console.error('PersonalPerformanceCard: Error response:', error.response?.data)
    throw error
  }
}

// Use optimized records query for this component
const recordsQuery = useQuery({
  queryKey: ['performance-records', authStore.user?.name, authStore.user?.role],
  queryFn: fetchRecordsForPerformance,
  enabled: !!authStore.user,
  staleTime: 5 * 60 * 1000, // 5 minutes cache - consistent with main attendance composable
  gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  refetchOnWindowFocus: false,
  refetchOnMount: false, // Don't refetch on component mount if data is fresh
  refetchOnReconnect: true,
  onSuccess: (data) => {
    console.log('PersonalPerformanceCard: Records loaded successfully:', data)
  },
  onError: (error) => {
    console.error('PersonalPerformanceCard: Error loading records:', error)
  }
})

// Filter state
const selectedPeriod = ref('thisWeek')

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  content: ''
})

// New record highlighting state
const newlyAddedRecords = ref(new Set())
const isInitialLoad = ref(true)

// Period labels for display
const periodLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  thisYear: 'This Year'
}

// Current user
const currentUser = computed(() => authStore.user)

// User records - filtered from the records query (optimized)
const userRecords = computed(() => {
  if (!recordsQuery.data.value || !authStore.user) return []
  
  // If server-side filtering is working, we might not need client-side filtering
  // But keep it as fallback for now
  const records = recordsQuery.data.value
  
  // Admin users can see all records
  if (authStore.user.role === 'admin') {
    return records
  }
  
  // Regular users see only their own records
  const currentUserName = authStore.user.name
  return records.filter(record => record.tutor_name === currentUserName)
})

// Loading state - only depends on records query
const isLoading = computed(() => recordsQuery.isLoading.value || recordsQuery.isFetching.value)

// Error state
const error = computed(() => recordsQuery.error.value)

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

// Date filtering functions
const getDateRange = (period) => {
  // Use Asia/Jakarta timezone consistently
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return {
        start: yesterday,
        end: today
      }
    
    case 'thisWeek':
      // Show from Monday up to today
      const dayOfWeek = today.getDay() // 0 is Sunday, 1 is Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)
      const daysToShow = dayOfWeek === 0 ? 6 : dayOfWeek // If Sunday, show 6 days (Mon-Sat)
      const endOfWeek = new Date(monday)
      endOfWeek.setDate(monday.getDate() + daysToShow)
      // Add one day to include today's date
      endOfWeek.setDate(endOfWeek.getDate() + 1)
      return {
        start: monday,
        end: endOfWeek
      }
    
    case 'lastWeek':
      // Always 7 days, Monday to Sunday
      const lastWeekDayOfWeek = today.getDay()
      const lastWeekMondayOffset = lastWeekDayOfWeek === 0 ? -6 : 1 - lastWeekDayOfWeek
      const lastMonday = new Date(today)
      lastMonday.setDate(today.getDate() + lastWeekMondayOffset - 7)
      const endOfLastWeek = new Date(lastMonday)
      endOfLastWeek.setDate(lastMonday.getDate() + 7)
      // Add one day to include the end date
      endOfLastWeek.setDate(endOfLastWeek.getDate() + 1)
      return {
        start: lastMonday,
        end: endOfLastWeek
      }
    
    case 'thisMonth':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      // Add one day to include today's date
      endOfMonth.setDate(endOfMonth.getDate() + 1)
      return {
        start: startOfMonth,
        end: endOfMonth
      }
    
    case 'lastMonth':
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      // Add one day to include the end date
      endOfLastMonth.setDate(endOfLastMonth.getDate() + 1)
      return {
        start: startOfLastMonth,
        end: endOfLastMonth
      }
    
    case 'thisYear':
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      // Add one day to include today's date
      endOfYear.setDate(endOfYear.getDate() + 1)
      return {
        start: startOfYear,
        end: endOfYear
      }
    
    default:
      return { start: today, end: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
  }
}

const isDateInRange = (dateString, range) => {
  if (!dateString) return false
  
  // Convert range dates to YYYY-MM-DD format for string comparison
  const rangeStartStr = range.start.toISOString().split('T')[0]
  const rangeEndStr = range.end.toISOString().split('T')[0]
  
  console.log(`Comparing ${dateString} with range ${rangeStartStr} to ${rangeEndStr}`)
  
  // Simple string comparison for YYYY-MM-DD format
  return dateString >= rangeStartStr && dateString < rangeEndStr
}

// Filtered records for the selected period
const filteredRecords = computed(() => {
  if (!userRecords.value) return []
  
  const range = getDateRange(selectedPeriod.value)
  console.log('PersonalPerformanceCard: filteredRecords computed')
  console.log('Date range:', range)
  console.log('All records:', userRecords.value)
  
  const filtered = userRecords.value.filter(record => {
    const inRange = isDateInRange(record.tutoring_date, range)
    console.log(`Record ${record.tutoring_date} in range:`, inRange)
    return inRange
  })
  
  console.log('Filtered records:', filtered)
  return filtered
})

// User statistics
const userStats = computed(() => {
  const records = filteredRecords.value
  const totalSessions = records.length
  const uniqueStudents = new Set(records.map(r => r.student_name)).size
  
  // Debug logging
  console.log('PersonalPerformanceCard: userStats computed')
  console.log('Selected period:', selectedPeriod.value)
  console.log('All userRecords:', userRecords.value)
  console.log('Filtered records:', records)
  console.log('Total sessions:', totalSessions)
  console.log('Unique students:', uniqueStudents)
  
  // Calculate average per day
  const range = getDateRange(selectedPeriod.value)
  const daysDiff = Math.max(1, Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)))
  const avgPerDay = totalSessions > 0 ? (totalSessions / daysDiff).toFixed(1) : '0.0'
  
  // Calculate streak (consecutive days with sessions)
  const streak = calculateStreak(records)
  
  return {
    totalSessions,
    uniqueStudents,
    avgPerDay,
    streak
  }
})

// Recent sessions (sorted by timestamp)
const recentSessions = computed(() => {
  if (!userRecords.value) return []
  
  return [...userRecords.value]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
})

// Calculate consecutive day streak
const calculateStreak = (records) => {
  if (!records.length) return 0
  
  const dates = [...new Set(records.map(r => r.tutoring_date))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() - i)
    const expectedDateStr = expectedDate.toISOString().split('T')[0]
    
    if (dates[i] === expectedDateStr) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// Chart data computation (optimized)
const chartData = computed(() => {
  if (!userRecords.value || userRecords.value.length === 0) return []
  
  const range = getDateRange(selectedPeriod.value)
  const data = []
  
  // Generate time periods based on selected period
  const periods = generateTimePeriods(selectedPeriod.value, range)
  
  console.log('PersonalPerformanceCard: chartData computed')
  console.log('Periods:', periods)
  console.log('User records:', userRecords.value)
  
  // Calculate sessions per period using string comparison
  const sessionsPerPeriod = periods.map(period => {
    const periodStartStr = period.start.toISOString().split('T')[0]
    const periodEndStr = period.end.toISOString().split('T')[0]
    
    const sessionsInPeriod = userRecords.value.filter(record => {
      const recordDate = record.tutoring_date
      const inRange = recordDate >= periodStartStr && recordDate < periodEndStr
      console.log(`Record ${recordDate} in period ${periodStartStr}-${periodEndStr}:`, inRange)
      return inRange
    }).length
    
    console.log(`Period ${period.label}: ${sessionsInPeriod} sessions`)
    return sessionsInPeriod
  })
  
  const maxSessionsInPeriod = Math.max(...sessionsPerPeriod, 1)
  
  periods.forEach((period, index) => {
    const sessionsInPeriod = sessionsPerPeriod[index]
    
    // Calculate chart coordinates
    const x = 40 + (index * (320 / Math.max(1, periods.length - 1)))
    const y = 180 - (sessionsInPeriod / maxSessionsInPeriod) * 160
    
    data.push({
      x,
      y,
      value: sessionsInPeriod,
      label: period.label,
      period: period
    })
  })
  
  console.log('Chart data:', data)
  return data
})

const chartPoints = computed(() => {
  return chartData.value.map(point => `${point.x},${point.y}`).join(' ')
})

const maxSessions = computed(() => {
  if (chartData.value.length === 0) return 5
  return Math.max(...chartData.value.map(d => d.value), 1)
})

const xAxisLabels = computed(() => {
  return chartData.value.map(d => d.label)
})

const generateTimePeriods = (period, range) => {
  const periods = []
  const start = new Date(range.start)
  const end = new Date(range.end)
  
  switch (period) {
    case 'today':
    case 'yesterday':
      // Hourly breakdown using Jakarta timezone
      for (let hour = 0; hour < 24; hour += 4) {
        // Create Jakarta timezone date
        const jakartaStart = new Date(start.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
        jakartaStart.setHours(hour, 0, 0, 0)
        const jakartaEnd = new Date(jakartaStart)
        jakartaEnd.setHours(hour + 4, 0, 0, 0)
        
        periods.push({
          start: jakartaStart,
          end: jakartaEnd,
          label: `${hour.toString().padStart(2, '0')}:00`
        })
      }
      break
      
    case 'thisWeek':
    case 'lastWeek':
      // Daily breakdown for exactly 7 days, starting from Monday
      const startDate = new Date(start)
      const dayOfWeek = startDate.getDay() // 0 is Sunday, 1 is Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startDate.setDate(startDate.getDate() + mondayOffset)
      
      console.log('generateTimePeriods: thisWeek/lastWeek')
      console.log('Original start:', start)
      console.log('Start date after Monday offset:', startDate)
      console.log('Day of week:', dayOfWeek)
      console.log('Monday offset:', mondayOffset)
      
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startDate)
        dayStart.setDate(startDate.getDate() + i)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayStart.getDate() + 1)
        
        const period = {
          start: new Date(dayStart),
          end: new Date(dayEnd),
          label: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
        }
        
        console.log(`Period ${i}:`, {
          start: period.start.toISOString().split('T')[0],
          end: period.end.toISOString().split('T')[0],
          label: period.label
        })
        
        periods.push(period)
      }
      break
      
    case 'thisMonth':
    case 'lastMonth':
      // Weekly breakdown
      const weekStart = new Date(start)
      while (weekStart < end) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        periods.push({
          start: new Date(weekStart),
          end: new Date(Math.min(weekEnd, end)),
          label: `Week ${Math.ceil(weekStart.getDate() / 7)}`
        })
        
        weekStart.setDate(weekStart.getDate() + 7)
      }
      break
      
    case 'thisYear':
      // Monthly breakdown
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(start.getFullYear(), month, 1)
        const monthEnd = new Date(start.getFullYear(), month + 1, 1)
        
        if (monthStart >= start && monthStart < end) {
          periods.push({
            start: monthStart,
            end: new Date(Math.min(monthEnd, end)),
            label: monthStart.toLocaleDateString('en-US', { month: 'short' })
          })
        }
      }
      break
  }
  
  return periods
}

const getChartPeriodLabel = () => {
  switch (selectedPeriod.value) {
    case 'today':
    case 'yesterday':
      return '4-hour period'
    case 'thisWeek':
    case 'lastWeek':
      return 'day'
    case 'thisMonth':
    case 'lastMonth':
      return 'week'
    case 'thisYear':
      return 'month'
    default:
      return 'period'
  }
}

// Tooltip functions
const showTooltip = (point, event) => {
  const rect = event.target.closest('svg').getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    content: `${point.label}: ${point.value} session${point.value !== 1 ? 's' : ''}`
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  // Handle different date formats
  let date
  if (typeof dateString === 'string') {
    // If it's already in YYYY-MM-DD format, create Date object properly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateString + 'T00:00:00')
    } else {
      date = new Date(dateString)
    }
  } else {
    date = new Date(dateString)
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString)
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

const getTimeAgo = (dateString, timeString) => {
  // Get current Jakarta time
  const now = new Date()
  const jakartaOffset = 7 * 60 // Jakarta is UTC+7
  const nowJakarta = new Date(now.getTime() + (jakartaOffset * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
  
  // Combine date and time to create session datetime in Jakarta timezone
  const sessionDateTime = new Date(`${dateString}T${timeString}:00+07:00`)
  
  const diffInMs = nowJakarta - sessionDateTime
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return formatDate(dateString)
}
</script> 