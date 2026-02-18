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

  // Professional
  PROFESSIONAL_DASHBOARD: '/dashboard/professional',
  PROFESSIONAL_PATIENTS: '/dashboard/professional/patients',
  PROFESSIONAL_APPOINTMENTS: '/dashboard/professional/appointments',
  PROFESSIONAL_PROFILE: '/dashboard/professional/profile',
  PROFESSIONAL_VIDEO: '/professional/video/:appointmentId',

  // Patient
  PATIENT_DASHBOARD: '/dashboard/patient',
  PATIENT_APPOINTMENTS: '/dashboard/patient/appointments',
  PATIENT_VIDEO: '/video/join/:appointmentId',
  PATIENT_REGISTER: '/patient/register',
  PATIENT_INVITE: '/register/:inviteCode',
}

export const ROLES = {
  HEALTH_PROFESSIONAL: 'health_professional',
  PROFESSIONAL: 'professional',
  PATIENT: 'patient',
  PACIENT: 'pacient',
}
