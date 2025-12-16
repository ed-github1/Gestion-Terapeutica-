import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../../services/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        const storedUser = localStorage.getItem('userData') || sessionStorage.getItem('userData')
        
        if (token && storedUser) {
          // Restore user from storage
          const userData = JSON.parse(storedUser)
          console.log('Restoring session for user:', userData)
          
          // Normalize role field
          if (userData && !userData.role && userData.rol) {
            userData.role = userData.rol
          }
          
          setUser(userData)
        }
      } catch (err) {
        console.error('Session restore failed:', err)
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        sessionStorage.removeItem('userData')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null)
      setLoading(true)
      console.log('AuthContext: Calling login API...')
      const response = await authAPI.login(email, password)
      console.log('AuthContext: Full login response:', response)
      console.log('AuthContext: Response.data:', response.data)
      
      // Extract data from axios response
      const responseData = response.data
      
      // Handle different backend response structures
      let userData, token
      
      if (responseData.user && responseData.token) {
        // Backend sends { user: {...}, token: "..." }
        userData = responseData.user
        token = responseData.token
      } else if (responseData.data) {
        // Backend sends { data: { user: {...}, token: "..." } }
        userData = responseData.data.user || responseData.data
        token = responseData.data.token
      } else if (responseData.token) {
        // Backend sends { token: "...", ...userData }
        token = responseData.token
        userData = { ...responseData }
        delete userData.token
      } else {
        // Fallback: entire response is user data with token somewhere
        token = responseData.accessToken || responseData.access_token
        userData = responseData
      }
      
      console.log('AuthContext: Extracted token:', token)
      console.log('AuthContext: Extracted user:', userData)
      console.log('AuthContext: User role field:', userData?.role || userData?.rol)
      
      if (!token) {
        throw new Error('No se recibió token del servidor')
      }
      
      // Normalize role field (backend might send 'rol' instead of 'role')
      if (userData && !userData.role && userData.rol) {
        userData.role = userData.rol
      }
      
      // Store token and user data
      if (rememberMe) {
        localStorage.setItem('authToken', token)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('authToken', token)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }
      
      setUser(userData)
      console.log('AuthContext: User state set, navigating...')
      return userData
    } catch (err) {
      console.error('AuthContext: Login error:', err)
      setError(err.message || 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('userData')
      sessionStorage.removeItem('userData')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
    }
  }

  const isHealthProfessional = () => {
    return user?.role === 'health_professional' || user?.role === 'professional'
  }

  const isPatient = () => {
    return user?.role === 'patient' || user?.role === 'pacient'
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isHealthProfessional,
    isPatient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
