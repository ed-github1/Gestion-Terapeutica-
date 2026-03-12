import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const APP_NAME = 'Totalmente'

const EXACT_TITLES = {
  '/': 'Bienvenido a Totalmente',
  '/login': 'Accede a tu Espacio',
  '/register': 'Comienza tu Camino',
  '/pricing': 'Elige tu Plan de Bienestar',
  '/checkout': 'Confirma tu Suscripción',
  '/verify-2fa': 'Verificación de Acceso',
  '/patient/register': 'Únete a tu Terapia',
  '/dashboard/professional': 'Mi Consulta',
  '/dashboard/professional/patients': 'Mis Pacientes',
  '/dashboard/professional/appointments': 'Agenda de Sesiones',
  '/dashboard/professional/stats': 'Estadísticas',
  '/dashboard/professional/profile': 'Mi Perfil Profesional',
  '/dashboard/professional/settings': 'Configuración',
  '/dashboard/patient': 'Mi Espacio de Bienestar',
  '/dashboard/patient/appointments': 'Mis Sesiones',
  '/demo/patient': 'Mi Espacio de Bienestar',
}

const PATTERN_TITLES = [
  { pattern: /^\/professional\/video\//, title: 'Sesión en Curso' },
  { pattern: /^\/video\/join\//, title: 'Sesión en Curso' },
  { pattern: /^\/register\//, title: 'Tu Invitación Personal' },
  { pattern: /^\/onboarding\//, title: 'Primeros Pasos' },
]

export function usePageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    let title = EXACT_TITLES[pathname]

    if (!title) {
      const match = PATTERN_TITLES.find(({ pattern }) => pattern.test(pathname))
      title = match?.title
    }

    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
  }, [pathname])
}
