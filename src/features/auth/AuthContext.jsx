import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { authService } from '@shared/services/authService'
import { auditLog } from '@shared/services/auditService'
import { useIdleTimeout } from '@hooks/useIdleTimeout'

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

  // ── Session restore ───────────────────────────────────────────────────────
  // Only the JWT is persisted — never user/PHI data.
  // On mount we call GET /auth/me to re-hydrate the user object from the server.
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token =
          localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        if (token) {
          try {
            const res = await authService.getMe()
            const userData = res.data?.data || res.data?.user || res.data
            if (userData && !userData.role && userData.rol) userData.role = userData.rol
            setUser(userData)
          } catch {
            // Token is invalid / expired — purge it
            localStorage.removeItem('authToken')
            sessionStorage.removeItem('authToken')
          }
        }
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }
    initAuth()
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authService.login(email, password)
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
    if (rememberMe) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.setItem('authToken', token) // default to localStorage so session survives tab
    }
    try {
      const res = await authService.getMe()
      // Unwrap various backend response shapes:
      // { data: { ...user } } | { data: { user: {...} } } | { user: {...} } | { ...user }
      let userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data

      console.debug('[completeLogin] raw getMe response:', JSON.stringify(res.data))

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
      auditLog('LOGIN_2FA', { userId: userData?.id || userData?._id, role: userData?.role })
      return userData
    } catch (err) {
      // Token might be invalid — purge it
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      throw err
    }
  }
  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (reason = 'user_initiated') => {
    auditLog('LOGOUT', { userId: user?.id || user?._id, reason })
    try { await authService.logout() } catch { /* ignore network errors */ }
    setUser(null)
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
  }, [user])

  // ── Idle timeout (HIPAA §164.312(a)(2)(iii)) ──────────────────────────────
  const handleIdle = useCallback(async () => {
    await logout('idle_timeout')
    navigate('/login', { state: { reason: 'idle' }, replace: true })
  }, [logout, navigate])

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

  const value = {
    user,
    loading,
    initializing,
    error,
    token: getToken(),
    login,
    completeLogin,
    logout,
    isAuthenticated: !!user,
    isHealthProfessional,
    isPatient,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* HIPAA idle-timeout warning modal */}
      {showWarning && user && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
                Tu sesión cerrará automáticamente en{' '}
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
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
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
