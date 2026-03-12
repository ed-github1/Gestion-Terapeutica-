import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  BookOpen
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

]

/**
 * Get menu items based on user role
 * @param {string} userRole - 'professional' or 'patient'
 * @returns {Array} Menu items configuration
 */
export const getMenuItems = (userRole) => {
  return userRole === 'professional' ? professionalMenuItems : patientMenuItems
}

/**
 * Animation configuration
 */
export const sidebarAnimationConfig = {
  initial: { x: -20, opacity: 0 },
  animate: (isCollapsed) => ({
    x: 0,
    opacity: 1,
    width: isCollapsed ? '5rem' : '18rem'
  }),
  exit: { x: -20, opacity: 0 },
  transition: (prefersReducedMotion) =>
    prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}
