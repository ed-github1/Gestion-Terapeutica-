/**
 * shared/services/authService.js
 * All HTTP calls related to authentication.
 */
import apiClient from '@shared/api/client'

export const authService = {
  /**
   * Standard credential login.
   * Pass `deviceToken` (from deviceTrust.getTrustToken) so the backend can
   * skip the 2FA challenge for recognised devices.
   */
  login: (email, password, deviceToken = null) => {
    const headers = {}
    if (deviceToken) headers['X-Device-Token'] = deviceToken
    return apiClient.post('/auth/login', { email, password }, { headers })
  },

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

  /**
   * Silently refresh the access token using the current JWT.
   * Backend should issue a new short-lived token from the existing valid one.
   * Endpoint: POST /auth/refresh
   */
  refresh: () =>
    apiClient.post('/auth/refresh'),

  sendOTP: (phone) =>
    apiClient.post('/auth/send-otp', { phone }),

  verifyOTP: (phone, otp) =>
    apiClient.post('/auth/verify-otp', { phone, otp }),
}
