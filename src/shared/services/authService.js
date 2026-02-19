/**
 * shared/services/authService.js
 * All HTTP calls related to authentication.
 */
import apiClient from '@shared/api/client'

export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  register: (userData) =>
    apiClient.post('/auth/register', userData),

  logout: () =>
    apiClient.post('/auth/logout').finally(() => {
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      sessionStorage.removeItem('userData')
    }),

  // Fetch the authenticated user's profile — used on session restore
  // so we never need to cache PHI in localStorage.
  getMe: () =>
    apiClient.get('/auth/me'),

  validateToken: (token) =>
    apiClient.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  sendOTP: (phone) =>
    apiClient.post('/auth/send-otp', { phone }),

  verifyOTP: (phone, otp) =>
    apiClient.post('/auth/verify-otp', { phone, otp }),
}
