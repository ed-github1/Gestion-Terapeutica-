 /**
 * shared/api/client.js
 * Single Axios instance used across all service modules.
 * Auth token stored in a SameSite cookie instead of localStorage (XSS-safer).
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
  withCredentials: true,
})

// ── Cookie helpers ────────────────────────────────────────────────────────────

/** Read a cookie value by name. */
export function readCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

/** Write the auth token into a SameSite cookie (replaces localStorage). */
function writeAuthCookie(token) {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  const maxAge = 7 * 24 * 60 * 60 // 7 days
  document.cookie = `authToken=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
}

/** Remove the auth token cookie. */
function clearAuthCookie() {
  document.cookie = 'authToken=; path=/; max-age=0; SameSite=Lax'
}

/**
 * Get the current auth token from the cookie.
 * Exported so other modules (Socket.IO, WebRTC) can read it.
 */
export function getAuthToken() {
  return readCookie('authToken')
}

/**
 * Store or clear the auth token.
 * - Pass a string to write the token cookie.
 * - Pass null/undefined to clear it.
 * Also purges any legacy localStorage/sessionStorage tokens.
 */
export function setAuthToken(token) {
  // Always clean up legacy storage
  localStorage.removeItem('authToken')
  sessionStorage.removeItem('authToken')

  if (token) {
    writeAuthCookie(token)
  } else {
    clearAuthCookie()
  }
}

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // CSRF double-submit (for when backend sets a csrf_token cookie)
    const csrf = readCookie('csrf_token')
    if (csrf) config.headers['X-CSRF-Token'] = csrf

    // Read the auth token from the cookie and send as Bearer header
    const token = getAuthToken()
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
      const onAuthPage = ['/login', '/register', '/verify-2fa'].some(p => window.location.pathname.startsWith(p))
      const isVerifyPassword = error.config?.url?.includes('/auth/verify-password')
      if (status === 401 && !onAuthPage && !isVerifyPassword) {
        clearAuthCookie()
        window.location.href = '/login'
      }
      // 403 role mismatch: JWT was likely issued with a different role value.
      // Clear the stale token and force re-login so a fresh JWT is issued.
      const message403 = data?.message || data?.error || ''
      const isRoleMismatch = status === 403 && /rol|role|acceso denegado/i.test(message403)
      if (isRoleMismatch && !onAuthPage) {
        clearAuthCookie()
        window.location.href = '/login?reason=rol'
      }
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
