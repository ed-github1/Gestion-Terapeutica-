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
      if (status === 401) {
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(data?.message || data?.error || `Error ${status}`))
    }
    if (error.request) {
      return Promise.reject(new Error('No se pudo conectar con el servidor'))
    }
    return Promise.reject(new Error(error.message || 'Error desconocido'))
  },
)

export default apiClient
