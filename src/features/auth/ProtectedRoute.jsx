import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role (support both 'role' and 'rol' from backend)
  const userRole = user?.role || user?.rol
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('ProtectedRoute: Access denied. User role:', userRole, 'Allowed:', allowedRoles)
    // Redirect to appropriate dashboard based on their actual role
    if (userRole === 'health_professional' || userRole === 'professional') {
      return <Navigate to="/dashboard/professional" replace />
    } else if (userRole === 'patient' || userRole === 'pacient') {
      return <Navigate to="/dashboard/patient" replace />
    }
    // Default fallback
    return <Navigate to="/login" replace />
  }
  
  console.log('ProtectedRoute: Access granted for role:', userRole)

  return children
}

export default ProtectedRoute
