import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Algo salió mal</h1>
            <p className="text-sm text-gray-500 mb-4">Recargá la página o volvé al inicio.</p>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition">
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
import { AuthProvider, useAuth, ProtectedRoute, LoginPage, RegisterPage, Verify2FAPage } from '@features/auth'
import { ProfessionalDashboard, AppointmentsCalendar } from '@features/professional'
import PatientsList from '@features/professional/components/ModernPatientsList'
import ProfessionalAccount from '@features/professional/components/ProfessionalAccount'
import ProfessionalVideoCallWebRTC from '@features/professional/components/VideoCallWebRTC'
import SessionSummary from '@features/professional/components/SessionSummary'
import ConsentSigner from '@features/professional/components/ConsentSigner'
import { PatientDashboard } from '@features/patient'
import PatientPersonalDiary from '@features/patient/PatientPersonalDiary'
import { AppointmentsProvider } from '@features/patient/AppointmentsContext'
import PatientSessionsPage from '@features/patient/PatientSessionsPage'
import PatientProfile from '@features/patient/PatientProfile'
import PatientVideoCallWebRTC from '@features/patient/PatientVideoCallWebRTC'
import PatientRegisterPage from '@features/patient/PatientRegisterPage'
import PatientRegister from '@features/patient/PatientRegister'
import PatientOnboardingPage from '@features/patient/PatientOnboardingPage'
import { AdminDashboard, AdminUsers, AdminSubscriptions, AdminProfessionals, AdminProfessionalDetail, AdminContracts } from '@features/admin'
import LandingPage from '@pages/LandingPage'
import PricingPlans from '@pages/PricingPlans'
import CheckoutPage from '@pages/CheckoutPage'
import PrivacyPolicyPage from '@pages/PrivacyPolicyPage'
import TermsPage from '@pages/TermsPage'
import CookiesPage from '@pages/CookiesPage'
import KycCompletePage from '@pages/KycCompletePage'
import ProfessionalContractPage from '@pages/ProfessionalContractPage'
import { Toast } from '@shared/ui'
import TopLoadingBar from '@shared/ui/TopLoadingBar'
import { ROUTES, ROLES } from '@shared/constants/routes'
import DashboardLayout from '@shared/layouts/DashboardLayout'
import { usePageTitle } from '@shared/hooks'
import { DarkModeProvider } from '@shared/DarkModeContext'
import { VideoCallProvider } from '@shared/context/VideoCallContext'

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
  if (initializing) return null
  if (isAuthenticated && user) {
    const role = user.role || user.rol
    
    if (role === 'health_professional' || role === 'professional') {
      return <Navigate to={ROUTES.PROFESSIONAL_DASHBOARD} replace />
    } else if (role === 'patient' || role === 'pacient') {
      return <Navigate to={ROUTES.PATIENT_DASHBOARD} replace />
    } else if (role === 'admin') {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
    }
  }

  return <LoginPage />
}

function App() {
  return (
    <Router>
      <DarkModeProvider>
      <AuthProvider>
        <VideoCallProvider>
        <TopLoadingBar />
        <PageTitleManager />
        <Toast />
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.TERMS} element={<TermsPage />} />
          <Route path={ROUTES.COOKIES} element={<CookiesPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.KYC_COMPLETE} element={<KycCompletePage />} />
          <Route
            path={ROUTES.PROFESSIONAL_CONTRACT}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <ProfessionalContractPage />
              </ProtectedRoute>
            }
          />
          <Route path="/patient/register" element={<PatientRegisterPage />} />
          <Route path="/register/:inviteCode" element={<PatientRegister />} />
          <Route path="/onboarding/:token" element={<PatientOnboardingPage />} />
          {/* Protected Routes - Professional */}
          <Route
            path={ROUTES.PROFESSIONAL_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <ErrorBoundary>
                  <DashboardLayout userRole="professional">
                    <ProfessionalDashboard />
                  </DashboardLayout>
                </ErrorBoundary>
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
                  <ProfessionalAccount />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFESSIONAL_PROFILE}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ProfessionalAccount />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFESSIONAL_SETTINGS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ProfessionalAccount />
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
            path="/professional/session-summary/:appointmentId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <SessionSummary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professional/consent"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
                <DashboardLayout userRole="professional">
                  <ConsentSigner />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PATIENT_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <ErrorBoundary>
                  <AppointmentsProvider>
                    <DashboardLayout userRole="patient">
                      <PatientDashboard />
                    </DashboardLayout>
                  </AppointmentsProvider>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <AppointmentsProvider>
                  <DashboardLayout userRole="patient">
                    <PatientSessionsPage />
                  </DashboardLayout>
                </AppointmentsProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patient/profile"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <DashboardLayout userRole="patient">
                  <PatientProfile />
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
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
                <PatientVideoCallWebRTC />
              </ProtectedRoute>
            } 
          />
          {/* Admin Routes */}
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <ErrorBoundary>
                  <DashboardLayout userRole="admin">
                    <AdminDashboard />
                  </DashboardLayout>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_USERS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout userRole="admin">
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_PROFESSIONALS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout userRole="admin">
                  <AdminProfessionals />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_PROFESSIONALS_DETAIL}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout userRole="admin">
                  <AdminProfessionalDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_CONTRACTS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout userRole="admin">
                  <AdminContracts />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_SUBSCRIPTIONS}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout userRole="admin">
                  <AdminSubscriptions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
        </VideoCallProvider>
      </AuthProvider>
      </DarkModeProvider>
    </Router>
  )
}

export default App