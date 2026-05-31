import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ROUTES } from '@shared/constants/routes'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return null

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role (support both 'role' and 'rol' from backend)
  const userRole = user?.role || user?.rol

  // Gate: professional with approved KYC must sign the platform contract before accessing the dashboard
  const isProfessional = userRole === 'health_professional' || userRole === 'professional'
  if (
    isProfessional &&
    user?.kycStatus === 'approved' &&
    !user?.contractSigned &&
    location.pathname !== ROUTES.PROFESSIONAL_CONTRACT
  ) {
    return <Navigate to={ROUTES.PROFESSIONAL_CONTRACT} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on their actual role
    if (userRole === 'health_professional' || userRole === 'professional') {
      return <Navigate to="/dashboard/professional" replace />
    } else if (userRole === 'patient' || userRole === 'pacient') {
      return <Navigate to="/dashboard/patient" replace />
    } else if (userRole === 'admin') {
      return <Navigate to="/dashboard/admin" replace />
    }
    // Default fallback
    return <Navigate to="/login" replace />
  }
  

  return children
}

export default ProtectedRoute
