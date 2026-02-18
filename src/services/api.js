// API service configuration
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? 'https://totalmentegestionterapeutica.onrender.com/api' : 'http://localhost:3000/api')

// Get auth token from storage
const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}

// SMS Authentication APIs
export const smsAuth = {
  sendOTP: async (phone) => {
    console.log('📤 Sending OTP to:', phone)
    const payload = { phone }
    console.log('Payload:', payload)
    
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    console.log('Response:', data)
    
    if (!response.ok) throw new Error(data.message || 'Error sending OTP')
    return data
  },

  verifyOTP: async (phone, otp) => {
    console.log('🔐 Verifying OTP:', { phone, otp })
    const payload = { phone, otp }
    console.log('Payload:', payload)
    
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    console.log('Response:', data)
    
    if (!response.ok) throw new Error(data.message || 'Invalid OTP')
    return data
  }
}

// Generic API client
export const apiClient = {
  get: async (endpoint) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  },
  
  post: async (endpoint, data) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  },
  
  put: async (endpoint, data) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  },
  
  delete: async (endpoint) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  }
}

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  },
  
  validateToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Invalid token')
      return await response.json()
    } catch (error) {
      throw new Error('Token validation failed')
    }
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {})
    } catch (error) {
      console.error('Logout error:', error)
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al registrar usuario')
    }
  }
}
