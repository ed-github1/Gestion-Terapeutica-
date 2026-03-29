import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { authService } from '@shared/services/authService'
import { auditLog } from '@shared/services/auditService'
import { useIdleTimeout } from '@shared/hooks/useIdleTimeout'
import { setAuthToken } from '@shared/api/client'
import { revokeTrustToken } from '@shared/utils/deviceTrust'
import SessionLockOverlay from '@shared/ui/SessionLockOverlay'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const [locked, setLocked] = useState(false)

  // Ref to the currently logged-in user's email — used by lock/unlock without
  // needing the closure to capture a stale `user` value.
  const userEmailRef = useRef(null)
  useEffect(() => { userEmailRef.current = user?.email ?? null }, [user])

  // Ref used by proactive token refresh so the timer always has the latest handler
  const refreshTimerRef = useRef(null)

  // ── Session restore ───────────────────────────────────────────────────────
  // Only the JWT is persisted — never user/PHI data.
  // On mount we call GET /auth/me to re-hydrate the user object from the server.
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token =
          localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        if (token && token !== 'undefined' && token !== 'null') {
          try {
            const res = await authService.getMe()
            let userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data
            if (import.meta.env.DEV) console.debug('[initAuth] getMe OK')
            // Normalise every known role field name to `role`
            if (userData) {
              userData.role =
                userData.role ||
                userData.rol ||
                userData.userRole ||
                userData.user_role ||
                userData.tipo ||
                userData.type ||
                undefined
            }
            setUser(userData)
            // Restore the session lock if it was active before the page refresh
            if (sessionStorage.getItem('sessionLocked') === '1') {
              setLocked(true)
            }
          } catch (err) {
            // Token is invalid / expired — purge it
            console.warn('[initAuth] getMe failed, purging token:', err.status, err.message)
            localStorage.removeItem('authToken')
            sessionStorage.removeItem('authToken')
            sessionStorage.removeItem('sessionLocked')
          }
        }
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }
    initAuth()
  }, [])

  // ── Proactive token refresh ───────────────────────────────────────────────
  // Decodes the JWT exp claim (no library needed) and schedules a silent
  // refresh 5 min before expiry.  If /auth/refresh doesn't exist yet on the
  // backend the call fails silently — no user disruption.
  const scheduleTokenRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (!token) return
    try {
      const payload  = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1_000                   // ms
      const refreshAt = expiresAt - 5 * 60 * 1_000            // 5 min before expiry
      const delay     = refreshAt - Date.now()
      if (delay <= 0) return                                   // already expired
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const res      = await authService.refresh()
          const newToken =
            res.data?.data?.token ?? res.data?.token ?? res.data?.accessToken ?? null
          if (newToken) {
            setAuthToken(newToken)
            scheduleTokenRefresh(newToken)                     // chain next refresh
          }
        } catch {
          // Endpoint not yet available or token revoked — silently ignore
        }
      }, delay)
    } catch {
      // JWT decode failed — non-standard token shape, skip scheduling
    }
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password, rememberMe = false, deviceToken = null) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authService.login(email, password, deviceToken)
      const responseData = response.data

      // 2FA gate — return early without storing anything
      const requires2FA =
        responseData.requires2FA === true ||
        responseData.data?.requires2FA === true
      if (requires2FA) {
        const tempToken =
          responseData.data?.tempToken ??
          responseData.tempToken ??
          null
        return { requires2FA: true, tempToken }
      }

      // Handle different backend response structures
      let userData, token
      if (responseData.user && responseData.token) {
        userData = responseData.user; token = responseData.token
      } else if (responseData.data) {
        userData = responseData.data.user || responseData.data; token = responseData.data.token
      } else if (responseData.token) {
        token = responseData.token; userData = { ...responseData }; delete userData.token
      } else {
        token = responseData.accessToken || responseData.access_token; userData = responseData
      }

      if (!token) throw new Error('No se recibió token del servidor')
      if (userData && !userData.role && userData.rol) userData.role = userData.rol

      // Store ONLY the JWT — no PHI in localStorage
      if (rememberMe) {
        localStorage.setItem('authToken', token)
      } else {
        sessionStorage.setItem('authToken', token)
      }

      setUser(userData)
      scheduleTokenRefresh(token)
      auditLog('LOGIN', { userId: userData.id || userData._id, role: userData.role, rememberMe })
      return userData
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }
  // ── Complete login after 2FA ────────────────────────────────────────────────
  // Called by Verify2FAPage after the OTP is accepted.
  // Stores the real JWT, fetches user data and populates AuthContext.
  const completeLogin = async (token, rememberMe = false) => {
    if (!token || token === 'undefined' || token === 'null') {
      console.error('[completeLogin] received invalid token:', token)
      throw new Error('Token inválido recibido del servidor. Intentá de nuevo.')
    }
    if (import.meta.env.DEV) console.debug('[completeLogin] storing token')
    // Always use localStorage so the session survives a tab refresh
    setAuthToken(token)
    try {
      const res = await authService.getMe()
      // Unwrap various backend response shapes:
      // { data: { ...user } } | { data: { user: {...} } } | { user: {...} } | { ...user }
      let userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data

      if (import.meta.env.DEV) console.debug('[completeLogin] getMe OK')

      // Normalise every known role field name to `role`
      if (userData) {
        userData.role =
          userData.role ||
          userData.rol ||
          userData.userRole ||
          userData.user_role ||
          userData.tipo ||
          userData.type ||
          undefined
      }

      // flushSync forces the state update to commit synchronously so that
      // ProtectedRoute sees isAuthenticated=true before navigate() fires.
      flushSync(() => setUser(userData))
      scheduleTokenRefresh(token)
      auditLog('LOGIN_2FA', { userId: userData?.id || userData?._id, role: userData?.role })
      return userData
    } catch (err) {
      // Token might be invalid — purge it
      setAuthToken(null)
      throw err
    }
  }
  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (reason = 'user_initiated') => {
    auditLog('LOGOUT', { userId: user?.id || user?._id, reason })
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    // Revoke device trust only on explicit / admin logout — NOT on idle lock
    if (reason === 'user_initiated' || reason === 'admin') {
      revokeTrustToken(userEmailRef.current)
    }

    try { await authService.logout() } catch { /* ignore network errors */ }
    setUser(null)
    sessionStorage.removeItem('sessionLocked')
    setLocked(false)
    setAuthToken(null)

    // Purge all cached sensitive data
    sessionStorage.removeItem('professionalAppointments')
    sessionStorage.removeItem('professionalSettings')
    sessionStorage.removeItem('professionalAvailability')
    localStorage.removeItem('professional_todos')
  }, [user])

  // ── Session lock (replaces full logout on idle) ───────────────────────────
  // HIPAA §164.312(a)(2)(iii) — "automatic logoff" is satisfied by locking the
  // screen so no data is visible. A full logout is NOT required.
  const lockSession = useCallback(() => {
    auditLog('SESSION_LOCKED', { userId: user?.id || user?._id, reason: 'idle_timeout' })
    sessionStorage.setItem('sessionLocked', '1')
    setLocked(true)
  }, [user])

  /**
   * Unlock the session by verifying the user's password.
   *
   * Strategy
   * ────────
   * The session is only *locked* in the UI — the JWT is still valid.
   * We call POST /auth/verify-password (with the existing JWT attached by the
   * interceptor) so the backend can confirm the password WITHOUT triggering
   * the 2FA flow that a full /auth/login call would cause.
   */
  const unlockSession = useCallback(async (password) => {
    const email = userEmailRef.current
    if (!email) throw new Error('No hay sesión activa.')

    await authService.verifyPassword(email, password)
    // If the call succeeds the JWT is still valid — no new token needed.
    auditLog('SESSION_UNLOCKED', { userId: user?.id || user?._id })
    sessionStorage.removeItem('sessionLocked')
    setLocked(false)
  }, [user])

  // ── Idle timeout (HIPAA §164.312(a)(2)(iii)) ──────────────────────────────
  const handleIdle = useCallback(() => {
    lockSession()
  }, [lockSession])

  const { showWarning, secondsLeft, extend } = useIdleTimeout({
    onIdle: handleIdle,
    enabled: !!user,
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isHealthProfessional = () =>
    user?.role === 'health_professional' || user?.role === 'professional'

  const isPatient = () =>
    user?.role === 'patient' || user?.role === 'pacient'

  const getToken = () =>
    localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

  /** Re-fetches the user from GET /auth/me and syncs AuthContext state. */
  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getMe()
      let userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data
      if (userData) {
        userData.role =
          userData.role || userData.rol || userData.userRole ||
          userData.user_role || userData.tipo || userData.type || undefined
      }
      setUser(userData)
      return userData
    } catch {
      // silently ignore — session remains as-is
    }
  }, [])

  const value = {
    user,
    loading,
    initializing,
    error,
    token: getToken(),
    login,
    completeLogin,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isHealthProfessional,
    isPatient,
    locked,
    lockSession,
    unlockSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* ── Session lock overlay (HIPAA §164.312(a)(2)(iii)) ─────────────── */}
      {locked && user && (
        <SessionLockOverlay
          user={user}
          onUnlock={async (password) => {
            try {
              await unlockSession(password)
            } catch (err) {
              if (err.requiresFullLogin) {
                await logout('session_expired')
                navigate('/login', { state: { reason: 'session_expired' }, replace: true })
                return
              }
              throw err
            }
          }}
          onFullLogout={() => {
            logout('user_initiated')
            navigate('/login', { replace: true })
          }}
        />
      )}

      {/* ── Idle warning (while session is still active) ─────────────────── */}
      {showWarning && user && !locked && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">¿Seguís ahí?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tu sesión se bloqueará en{' '}
                <span className="font-bold text-amber-600">{secondsLeft}s</span>{' '}
                por inactividad.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { logout('user_initiated'); navigate('/login') }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cerrar sesión
              </button>
              <button
                onClick={extend}
                className="flex-1 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}
