import axios from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      if (status === 401) {
        // Unauthorized - clear tokens and redirect to login
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
        window.location.href = '/login'
      }
      
      throw new Error(data.message || data.error || `Error ${status}`)
    } else if (error.request) {
      // Request made but no response received
      throw new Error('No se pudo conectar con el servidor')
    } else {
      // Something else happened
      throw new Error(error.message || 'Error desconocido')
    }
  }
)

export { apiClient }
export default apiClient

// Authentication API
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      return response
    } catch (error) {
      throw error
    }
  },
  
  // Validate token and get user data
  validateToken: async (token) => {
    try {
      const response = await apiClient.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response
    } catch (error) {
      throw error
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
    } catch (error) {
      // Still clear tokens even if request fails
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      throw error
    }
  },
  
  // Register new user (professional)
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh')
      return response
    } catch (error) {
      throw error
    }
  },
}
