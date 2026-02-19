 /**
 * shared/api/client.js
 * Single Axios instance used across all service modules.
 * Handles auth token injection and global 401 redirect.
 */

 
import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? 'https://totalmentegestionterapeutica.onrender.com/api'
    : 'http://localhost:3000/api')

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      // Only auto-redirect on 401 when outside of auth pages
      const onAuthPage = ['/login', '/register', '/verify-2fa'].some(p => window.location.pathname.startsWith(p))
      if (status === 401 && !onAuthPage) {
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
        window.location.href = '/login'
      }
      // Build error with status preserved so callers can do field-level placement
      const message = data?.message || data?.error || `Error ${status}`
      const err = new Error(message)
      err.status = status
      err.data = data
      return Promise.reject(err)
    }
    if (error.request) {
      const err = new Error('No se pudo conectar con el servidor')
      err.status = 0
      return Promise.reject(err)
    }
    return Promise.reject(new Error(error.message || 'Error desconocido'))
  },
)

export default apiClient
