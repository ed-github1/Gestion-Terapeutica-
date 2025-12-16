import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, ProtectedRoute, LoginPage, RegisterPage } from './features/auth'
import { ProfessionalDashboard, AppointmentsCalendar } from './features/professional'
import PatientsList from './features/professional/PatientsList'
import { PatientDashboard } from './features/patient'
import PatientVideoCall from './features/patient/PatientVideoCall'
import PatientRegisterPage from './features/patient/PatientRegisterPage'
import { Sidebar, Header } from './components/layout'
import { Toast } from './components'
import { ROUTES, ROLES } from './constants/routes'

// Dashboard Layout with Sidebar
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Redirect authenticated users from login
const LoginRoute = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    const role = user.role || user.rol
    console.log('LoginRoute: User is authenticated, role:', role)
    
    if (role === 'health_professional' || role === 'professional') {
      return <Navigate to={ROUTES.PROFESSIONAL_DASHBOARD} replace />
    } else if (role === 'patient' || role === 'pacient') {
      return <Navigate to={ROUTES.PATIENT_DASHBOARD} replace />
    }
  }

  return <LoginPage />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toast />
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />

          {/* Protected Routes - Professional */}
          <Route
            path={ROUTES.PROFESSIONAL_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout>
                  <ProfessionalDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/patients"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout>
                  <PatientsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/appointments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout>
                  <AppointmentsCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PATIENT_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <DashboardLayout>
                  <PatientDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/video/join/:appointmentId" element={<PatientVideoCall />} />
          <Route 
            path="/demo/patient" 
            element={
              <DashboardLayout>
                <PatientDashboard />
              </DashboardLayout>
            } 
          />
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App