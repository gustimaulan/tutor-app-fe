# Frontend for SS CRUD with Supabase Backend

This is the Vue.js frontend for the SS CRUD application, now configured to work with the Supabase backend.

## Features

- **Modern Vue 3** with Composition API
- **Pinia** for state management
- **Vue Query** for server state management
- **JWT Authentication** with Supabase backend
- **Responsive Design** with Tailwind CSS
- **Real-time Updates** with optimistic UI
- **File Upload** with image compression
- **Mobile-first** design with bottom navigation

## Prerequisites

- Node.js 16+ 
- Backend-supabase server running on port 3001

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Backend Integration

The frontend is now configured to work with the `backend-supabase` server:

- **API Base URL:** `http://localhost:3001/api`
- **Authentication:** JWT tokens stored in localStorage
- **CORS:** Configured for local development

## Key Changes from Original Backend

- **Authentication:** Now uses JWT tokens instead of sessions
- **API Structure:** Updated to match Supabase backend endpoints
- **Data Format:** Adjusted for new response structure
- **Error Handling:** Improved error handling for new API

## Default Login

Use the default admin account:
- **Email:** `admin@example.com`
- **Password:** `admin123`

## Development

The frontend includes:
- Hot module replacement
- ESLint configuration
- Prettier formatting
- TypeScript support (optional)

## File Structure

```
src/
├── components/          # Reusable Vue components
├── composables/         # Vue 3 composables
├── layouts/            # Layout components
├── router/             # Vue Router configuration
├── stores/             # Pinia stores
├── views/              # Page components
└── main.js             # App entry point
```

## API Endpoints Used

- `POST /api/auth/login` - User authentication
- `GET /api/auth/check` - Verify authentication
- `POST /api/auth/logout` - User logout
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record
- `DELETE /api/attendance/:id` - Delete attendance record
- `PATCH /api/attendance/:id` - Update attendance record
- `GET /api/students` - Get students list
- `GET /api/tutors` - Get tutors list
