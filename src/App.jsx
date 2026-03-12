import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, ProtectedRoute, LoginPage, RegisterPage, Verify2FAPage } from '@features/auth'
import { ProfessionalDashboard, AppointmentsCalendar, ProfessionalStats } from '@features/professional'
import PatientsList from '@features/professional/components/PatientsList'
import ProfessionalProfile from '@features/professional/components/ProfessionalProfile'
import ProfessionalVideoCallWebRTC from '@features/professional/components/VideoCallWebRTC'
import ProfessionalSettings from '@features/professional/components/ProfessionalSettings'
import { PatientDashboard, PatientPersonalDiary } from '@features/patient'
import PatientSessionsPage from '@features/patient/PatientSessionsPage'
import PatientVideoCallWebRTC from '@features/patient/PatientVideoCallWebRTC'
import PatientRegisterPage from '@features/patient/PatientRegisterPage'
import PatientRegister from '@features/patient/PatientRegister'
import PatientOnboardingPage from '@features/patient/PatientOnboardingPage'
import LandingPage from '@pages/LandingPage'
import PricingPlans from '@pages/PricingPlans'
import CheckoutPage from '@pages/CheckoutPage'
import { Toast } from '@shared/ui'
import { ROUTES, ROLES } from '@shared/constants/routes'
import DashboardLayout from '@shared/layouts/DashboardLayout'
import { usePageTitle } from '@shared/hooks'
import { DarkModeProvider } from '@shared/DarkModeContext'

function PageTitleManager() {
  usePageTitle()
  return null
}

// Redirect authenticated users from login


const LoginRoute = () => {
  const { isAuthenticated, user, initializing } = useAuth()
  // Only block on the initial startup token check — NOT during a login attempt.
  // If we blocked on `loading`, LoginPage would unmount while waiting for the
  // API response, losing local error state when the call fails.
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }
  if (isAuthenticated && user) {
    const role = user.role || user.rol
    
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
      <DarkModeProvider>
      <AuthProvider>
        <PageTitleManager />
        <Toast />
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />
          <Route path="/register/:inviteCode" element={<PatientRegister />} />
          <Route path="/onboarding/:token" element={<PatientOnboardingPage />} />
          {/* Protected Routes - Professional */}
          <Route
            path={ROUTES.PROFESSIONAL_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ProfessionalDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/patients"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <PatientsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/appointments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <AppointmentsCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/stats"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ProfessionalStats />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFESSIONAL_PROFILE}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <ProfessionalProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFESSIONAL_SETTINGS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ProfessionalSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/video/:appointmentId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <ProfessionalVideoCallWebRTC />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PATIENT_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <DashboardLayout userRole="patient">
                  <PatientDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <DashboardLayout userRole="patient">
                  <PatientSessionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patient/diary"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <DashboardLayout userRole="patient">
                  <PatientPersonalDiary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/video/join/:appointmentId" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <PatientVideoCallWebRTC />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/demo/patient" 
            element={
              <DashboardLayout userRole="patient">
                <PatientDashboard />
              </DashboardLayout>
            } 
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </AuthProvider>
      </DarkModeProvider>
    </Router>
  )
}

export default App