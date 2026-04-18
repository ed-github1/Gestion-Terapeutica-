/**
 * shared/constants/routes.js
 * Centralised route path definitions and role constants.
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PRICING: '/pricing',
  CHECKOUT: '/checkout',
  PRIVACY: '/privacidad',
  TERMS: '/terminos',
  COOKIES: '/cookies',

  // Professional
  PROFESSIONAL_DASHBOARD: '/dashboard/professional',
  PROFESSIONAL_PATIENTS: '/dashboard/professional/patients',
  PROFESSIONAL_APPOINTMENTS: '/dashboard/professional/appointments',
  PROFESSIONAL_PROFILE: '/dashboard/professional/profile',
  PROFESSIONAL_SETTINGS: '/dashboard/professional/settings',
  PROFESSIONAL_VIDEO: '/professional/video/:appointmentId',
  PROFESSIONAL_CONSENT: '/dashboard/professional/consent',

  // Patient
  PATIENT_DASHBOARD: '/dashboard/patient',
  PATIENT_APPOINTMENTS: '/dashboard/patient/appointments',
  PATIENT_VIDEO: '/video/join/:appointmentId',
  PATIENT_REGISTER: '/patient/register',
  PATIENT_INVITE: '/register/:inviteCode',
  PATIENT_ONBOARDING: '/onboarding/:token',

  // Admin
  ADMIN_DASHBOARD: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_PROFESSIONALS: '/dashboard/admin/professionals',
  ADMIN_SUBSCRIPTIONS: '/dashboard/admin/subscriptions',
}

export const ROLES = {
  HEALTH_PROFESSIONAL: 'health_professional',
  PROFESSIONAL: 'professional',
  PATIENT: 'patient',
  PACIENT: 'pacient',
  ADMIN: 'admin',
}
