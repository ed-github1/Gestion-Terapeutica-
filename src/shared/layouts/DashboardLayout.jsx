/**
 * shared/layouts/DashboardLayout.jsx
 * Main dashboard shell with persistent sidebar (desktop) and bottom nav (mobile).
 */
import { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'

import DashboardSidebar from '@shared/layouts/sidebar/DashboardSidebar'
import MobileBottomNav from '@shared/layouts/MobileBottomNav'
import { useLocation } from 'react-router-dom'
import { useDarkModeContext } from '@shared/DarkModeContext'
import DashboardSearchBar from '@features/professional/components/DashboardSearchBar'
import { VideoCallNotificationManager } from '@shared/ui'
import { TopBarSlotProvider, useTopBarSlot } from '@shared/context/TopBarSlotContext'

const ROUTE_TITLES = {
  '/dashboard/professional': 'Mi Consulta',
  '/dashboard/professional/patients': 'Mis Pacientes',
  '/dashboard/professional/appointments': 'Agenda de Sesiones',
  '/dashboard/professional/stats': 'Estadísticas',
  '/dashboard/professional/settings': 'Configuración',
  '/dashboard/professional/profile': 'Mi Perfil Profesional',
  '/dashboard/patient': 'Mi Espacio de Bienestar',
  '/dashboard/patient/appointments': 'Mis Sesiones',
  '/dashboard/patient/sessions': 'Mis Sesiones',
  '/dashboard/patient/diary': 'Diario Personal',
  '/dashboard/patient/messages': 'Mensajes',
  '/dashboard/patient/profile': 'Mi Perfil',
  '/dashboard/patient/settings': 'Configuración',
  '/dashboard/admin': 'Administración',
  '/dashboard/admin/users': 'Gestión de Usuarios',
  '/dashboard/admin/professionals': 'Profesionales',
  '/dashboard/admin/subscriptions': 'Suscripciones',
}

// ── Inner layout (consumes the slot context) ──────────────────────────────────

const DashboardLayoutInner = ({ children, userRole }) => {
  const { slot } = useTopBarSlot()
  const location = useLocation()
  const { dark, toggleDark } = useDarkModeContext()

  const pageTitle = ROUTE_TITLES[location.pathname] ?? ''

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · TotalMente` : 'TotalMente'
  }, [pageTitle])

  return (
    <div className={`${dark ? 'dark' : ''} h-screen tm-bg flex flex-col overflow-hidden`}>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoSymbol} alt="" className="h-8 w-8 object-contain" />
          <span className="text-[18px] text-[#4A5568] dark:text-gray-200 tracking-tight leading-none">
            <span className="font-normal">Total</span><span className="font-bold">Mente</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Any role's notification bell lands here via TopBarSlotContext */}
          {slot}
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-600/60 transition-colors"
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {dark
              ? <Sun size={18} className="text-gray-200" />
              : <Moon size={18} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden pt-15 md:pt-0">
        <div className="hidden md:block shrink-0 md:relative md:h-full">
          <DashboardSidebar userRole={userRole} onClose={() => {}} />
        </div>
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-transparent relative pb-17 md:pb-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y">

            {/* Desktop Header Bar */}
            {(userRole === 'professional' || userRole === 'admin' || userRole === 'patient') && (
              <div className="hidden md:flex items-center gap-3 px-4 lg:px-6 py-2.5 bg-transparent border-b border-gray-100/80 dark:border-gray-800/60">
                {userRole === 'professional' && (
                  <DashboardSearchBar className="w-56 lg:w-72" />
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  {/* Professional registers its NotificationsPanel here */}
                  {slot}
                  <button
                    onClick={toggleDark}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-600/60 transition-colors"
                    aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
                  >
                    {dark
                      ? <Sun size={16} className="text-gray-200" />
                      : <Moon size={16} className="text-gray-500" />}
                  </button>
                </div>
              </div>
            )}

            {children}
          </div>
          {userRole === 'patient' && <VideoCallNotificationManager />}
        </div>
      </div>

      {/* Bottom Navigation – Mobile Only */}
      <MobileBottomNav userRole={userRole} />

    </div>
  )
}

// ── Public export (wraps inner with the slot provider) ────────────────────────

const DashboardLayout = ({ children, userRole }) => (
  <TopBarSlotProvider>
    <DashboardLayoutInner userRole={userRole}>{children}</DashboardLayoutInner>
  </TopBarSlotProvider>
)

export default DashboardLayout
