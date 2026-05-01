import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  BarChart2,
  ShieldCheck,
  CreditCard,
  PenLine,
  UserCircle,
} from 'lucide-react'

/**
 * Professional menu items configuration
 * Used for therapists/professional users
 */
export const professionalMenuItems = [
  {
    icon: LayoutDashboard,
    path: '/dashboard/professional',
    label: 'Panel',
    description: 'Vista general',
    ariaLabel: 'Panel de control general'
  },
  {
    icon: Users,
    path: '/dashboard/professional/patients',
    label: 'Pacientes',
    description: 'Gestionar clientes',
    ariaLabel: 'Gestionar pacientes'
  },
  {
    icon: Calendar,
    path: '/dashboard/professional/appointments',
    label: 'Citas',
    description: 'Sesiones y citas',
    ariaLabel: 'Citas y sesiones programadas'
  },
  {
    icon: PenLine,
    path: '/dashboard/professional/consent',
    label: 'Consentimiento',
    description: 'Firmar consentimiento',
    ariaLabel: 'Firmar consentimiento informado'
  }
]

/**
 * Patient menu items configuration
 * Used for patient users - more personalized, supportive language
 */
export const patientMenuItems = [
  {
    icon: LayoutDashboard,
    path: '/dashboard/patient',
    label: 'Inicio',
    description: 'Tu espacio personal',
    ariaLabel: 'Página de inicio'
  },
  {
    icon: Calendar,
    path: '/dashboard/patient/appointments',
    label: 'Mis Sesiones',
    description: 'Próximas y pasadas',
    ariaLabel: 'Mis sesiones programadas'
  },
  {
    icon: BookOpen,
    path: '/dashboard/patient/diary',
    label: 'Mi Diario',
    description: 'Espacio privado',
    ariaLabel: 'Mi diario personal privado',
    secure: true
  },
  {
    icon: UserCircle,
    path: '/dashboard/patient/profile',
    label: 'Mi Perfil',
    description: 'Tu cuenta',
    ariaLabel: 'Mi perfil y cuenta'
  },
]

/**
 * Get menu items based on user role
 * @param {string} userRole - 'professional', 'patient', or 'admin'
 * @returns {Array} Menu items configuration
 */
export const getMenuItems = (userRole) => {
  if (userRole === 'professional') return professionalMenuItems
  if (userRole === 'admin') return adminMenuItems
  return patientMenuItems
}

/**
 * Admin menu items configuration
 */
export const adminMenuItems = [
  {
    icon: LayoutDashboard,
    path: '/dashboard/admin',
    label: 'Panel',
    description: 'Visión general',
    ariaLabel: 'Panel de administración',
  },
  {
    icon: Users,
    path: '/dashboard/admin/users',
    label: 'Usuarios',
    description: 'Gestionar cuentas',
    ariaLabel: 'Gestión de usuarios',
  },
  {
    icon: ShieldCheck,
    path: '/dashboard/admin/professionals',
    label: 'Profesionales',
    description: 'Terapeutas y clínicos',
    ariaLabel: 'Gestión de profesionales',
  },
  {
    icon: CreditCard,
    path: '/dashboard/admin/subscriptions',
    label: 'Suscripciones',
    description: 'Planes y facturación',
    ariaLabel: 'Gestión de suscripciones',
  },
]

/**
 * Animation configuration
 */
export const sidebarAnimationConfig = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
  transition: (prefersReducedMotion) =>
    prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}
