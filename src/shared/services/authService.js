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
      // HttpOnly auth cookie is cleared by the backend's Set-Cookie response.
      // Clean up any legacy storage remnants.
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      sessionStorage.removeItem('userData')
    }),

  // Fetch the authenticated user's profile — used on session restore
  // so we never need to cache PHI in localStorage.
  getMe: () =>
    apiClient.get('/auth/me'),

  // Cookie is sent automatically — no need to pass a token.
  validateToken: () =>
    apiClient.get('/auth/validate'),

  /**
   * Silently refresh the access token using the current JWT.
   * Backend should issue a new short-lived token from the existing valid one.
   * Endpoint: POST /auth/refresh
   */
  refresh: () =>
    apiClient.post('/auth/refresh'),

  /**
   * Verify the user's password during a session-lock unlock.
   * This is intentionally different from `login` — it must NEVER trigger 2FA.
   * The existing JWT (sent automatically by the request interceptor) proves the
   * user is already authenticated; this call only re-confirms the password.
   * Endpoint: POST /auth/verify-password
   * Body: { email, password }
   * Response: { valid: true } | 401
   */
  verifyPassword: (email, password) =>
    apiClient.post('/auth/verify-password', { email, password }),

  /**
   * Update the authenticated user's name and/or email.
   * Backend re-issues a new JWT when identity claims change — the caller
   * should update the stored token with the one in the response.
   * Endpoint: PATCH /auth/me
   * Body: { nombre?, apellido?, email? }
   * Response: { success: true, data: { user, token, csrfToken } }
   */
  updateMe: ({ nombre, apellido, email } = {}) =>
    apiClient.patch('/auth/me', { nombre, apellido, email }),

  /**
   * Change the authenticated user's password.
   * Endpoint: PATCH /auth/me/password
   * Body: { currentPassword, newPassword }
   * Response: { success: true, message }
   */
  changePassword: (currentPassword, newPassword) =>
    apiClient.patch('/auth/me/password', { currentPassword, newPassword }),

  sendOTP: (phone) =>
    apiClient.post('/auth/send-otp', { phone }),

  verifyOTP: (phone, otp) =>
    apiClient.post('/auth/verify-otp', { phone, otp }),
}
