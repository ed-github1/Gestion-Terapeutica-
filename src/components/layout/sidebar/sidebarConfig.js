import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    FileText,
    TrendingUp,
    BookOpen,
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
        badge: 12,
        ariaLabel: 'Pacientes, 12 activos'
    },
    {
        icon: Calendar,
        path: '/dashboard/professional/calendar',
        label: 'Calendario',
        description: 'Sesiones y citas',
        ariaLabel: 'Calendario de sesiones'
    },
    {
        icon: MessageSquare,
        path: '/dashboard/professional/messages',
        label: 'Mensajes',
        description: 'Comunicación segura',
        badge: 3,
        ariaLabel: 'Mensajes, 3 sin leer',
        secure: true
    },
    {
        icon: FileText,
        path: '/dashboard/professional/notes',
        label: 'Notas',
        description: 'Documentación',
        ariaLabel: 'Notas clínicas'
    },
    {
        icon: TrendingUp,
        path: '/dashboard/professional/analytics',
        label: 'Análisis',
        description: 'Seguimiento',
        ariaLabel: 'Análisis y estadísticas'
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
        icon: MessageSquare,
        path: '/dashboard/patient/messages',
        label: 'Mensajes',
        description: 'Habla con tu terapeuta',
        badge: 2,
        ariaLabel: 'Mensajes, 2 sin leer',
        secure: true
    },
    {
        icon: TrendingUp,
        path: '/dashboard/patient/progress',
        label: 'Mi Progreso',
        description: 'Tu camino de crecimiento',
        ariaLabel: 'Mi progreso personal'
    }
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
