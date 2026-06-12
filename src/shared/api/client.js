/**
 * shared/api/client.js
 * Single Axios instance used across all service modules.
 * Auth token stored in a SameSite Lax cookie.
 *
 * NOTE (F-02): To make the auth cookie HttpOnly (unreadable by JS), the backend
 * must set it via a Set-Cookie response header with the HttpOnly flag.
 * That change is required on the server side — it cannot be done client-side.
 */
import axios from 'axios'
import { showToast } from '@shared/ui/Toast'

export const BASE_URL =
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

// ── Safe external redirect ────────────────────────────────────────────────────
// Only allow redirects to known third-party origins to prevent open-redirect
// attacks when a backend response URL is used as the redirect destination.
const TRUSTED_REDIRECT_HOSTS = /^([a-z][a-z0-9-]*\.didit\.me|(www\.)?mercadopago\.com(\.[a-z]{2})?|sandbox\.mercadopago\.com(\.[a-z]{2})?|auth\.mercadopago\.com|(www\.)?mercadolibre\.com|auth\.mercadolibre\.com)$/

export function safeRedirect(url) {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== 'https:' || !TRUSTED_REDIRECT_HOSTS.test(hostname)) {
      console.error('[safeRedirect] blocked untrusted URL:', hostname)
      return
    }
    window.location.href = url
  } catch {
    console.error('[safeRedirect] invalid URL')
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
      // Session is locked server-side: surface the lock overlay instead of
      // logging out. Dispatching the event lets AuthContext show the overlay
      // even when the lock was triggered from another tab or before the
      // frontend called POST /auth/lock.
      if (status === 401 && data?.code === 'SESSION_LOCKED') {
        window.dispatchEvent(new CustomEvent('session:locked'))
        const err = new Error(data?.message || 'Sesión bloqueada.')
        err.status = 401
        err.code = 'SESSION_LOCKED'
        err.data = data
        return Promise.reject(err)
      }

      const onAuthPage = ['/login', '/register', '/verify-2fa'].some(p => window.location.pathname.startsWith(p))
      const isVerifyPassword = error.config?.url?.includes('/auth/verify-password')
      if (status === 401 && !onAuthPage && !isVerifyPassword) {
        clearAuthCookie()
        window.location.href = '/login'
      }
      // 403 KYC required: redirect to the Didit verification URL
      if (status === 403 && data?.code === 'KYC_REQUIRED' && data?.kycSessionUrl) {
        showToast('Debes completar tu verificación de identidad para continuar.', 'warning')
        setTimeout(() => safeRedirect(data.kycSessionUrl), 800)
        return Promise.reject(new Error('KYC_REQUIRED'))
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
