/**
 * shared/layouts/DashboardLayout.jsx
 * Main dashboard shell with persistent sidebar (desktop) and bottom nav (mobile).
 */
import { useState, useEffect } from 'react'
import {
  User, Bell, Home, Calendar, MessageCircle,
  Users, FileText, Settings, X, BookOpen, MoreHorizontal,
  Moon, Sun,
} from 'lucide-react'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'
import { motion, AnimatePresence } from 'motion/react'
import DashboardSidebar from '@components/layout/DashboardSidebar'
import { useAuth } from '@features/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDarkModeContext } from '@shared/DarkModeContext'
import { useSocketNotifications } from '@features/professional/hooks'
import NotificationsPanel from '@features/professional/components/NotificationsPanel'
import DashboardSearchBar from '@features/professional/components/DashboardSearchBar'
import { VideoCallNotificationManager } from '@components'

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
  '/dashboard/patient/settings': 'Configuración',
}

const DashboardLayout = ({ children, userRole }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggleDark } = useDarkModeContext()
  const { paidNotifications, setPaidNotifications } = useSocketNotifications()

  const pageTitle = ROUTE_TITLES[location.pathname] ?? ''

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · TotalMente` : 'TotalMente'
  }, [pageTitle])

  const getInitials = () => {
    if (!user) return '?'
    if (user.nombre && user.apellido) return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    if (user.name) {
      const parts = user.name.split(' ')
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : user.name.substring(0, 2).toUpperCase()
    }
    return user.email ? user.email[0].toUpperCase() : '?'
  }

  return (
    <div className={`${dark ? 'dark' : ''} h-screen tm-bg flex flex-col overflow-hidden`}>
      {/* Mobile Top Bar */}
      <div className="md:hidden glass-topbar px-4 py-3 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoSymbol} alt="" className="h-8 w-8 object-contain" />
          <span className="text-[18px] text-[#4A5568] dark:text-gray-200 tracking-tight leading-none">
            <span className="font-normal">Total</span><span className="font-bold">Mente</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-600/60 transition-colors"
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {dark
              ? <Sun size={18} className="text-gray-200" />
              : <Moon size={18} className="text-gray-500" />}
          </button>
          {userRole !== 'patient' && (
            <NotificationsPanel
              paidNotifications={paidNotifications}
              setPaidNotifications={setPaidNotifications}
              showNotifPanel={showNotifPanel}
              setShowNotifPanel={setShowNotifPanel}
            />
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden pt-15 md:pt-0">
        <div className="hidden md:block shrink-0 md:relative md:h-full">
          <DashboardSidebar userRole={userRole} onClose={() => {}} />
        </div>
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-transparent relative pb-17 md:pb-0">
          {/* Desktop Header Bar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y">
            {/* Desktop Header Bar — hidden for patients (controls are in PatientDashboard header) */}
            {userRole !== 'patient' && (
              <div className="hidden md:flex items-center gap-3 px-4 lg:px-6 py-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100/80 dark:border-gray-800/60 sticky top-0 z-40">
                {/* Search — only for professional role */}
                {userRole === 'professional' && (
                  <DashboardSearchBar className="w-56 lg:w-72" />
                )}

                {/* Push actions to right */}
                <div className="ml-auto flex items-center gap-1.5">
                  <NotificationsPanel
                    paidNotifications={paidNotifications}
                    setPaidNotifications={setPaidNotifications}
                    showNotifPanel={showNotifPanel}
                    setShowNotifPanel={setShowNotifPanel}
                  />
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
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {userRole === 'professional' ? (
            <>
              <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={Home} />
              <NavBtn path={`/dashboard/${userRole}/appointments`} label="Agenda" Icon={Calendar} />
              <NavBtn path={`/dashboard/${userRole}/patients`} label="Pacientes" Icon={Users} />
              <MoreBtn badge onClick={() => setShowNotifications(!showNotifications)} />
            </>
          ) : (
            <>
              <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={Home} />
              <NavBtn path={`/dashboard/${userRole}/appointments`} label="Citas" Icon={Calendar} />
              <NavBtn path={`/dashboard/${userRole}/diary`} label="Diario" Icon={BookOpen} />
              <MoreBtn badge onClick={() => setShowNotifications(!showNotifications)} />
            </>
          )}
        </div>
      </motion.div>

      {/* Slide-up panel (profile + notifications) */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-70 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-linear-to-br from-blue-700 to-blue-600 px-6 py-6 rounded-t-3xl z-10">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {getInitials()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{user?.name || user?.nombre || 'Usuario'}</h3>
                    <p className="text-sm text-white/80">{user?.email || 'usuario@email.com'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats – Professional */}
              {userRole === 'professional' && (
                <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                  {[['12', 'Pacientes', 'indigo'], ['5', 'Hoy', 'emerald'], ['3', 'Próximas', 'amber']].map(([n, lbl, c]) => (
                    <div key={lbl} className={`text-center p-3 bg-${c}-50 rounded-xl`}>
                      <div className={`text-2xl font-bold text-${c}-600`}>{n}</div>
                      <div className="text-xs text-gray-600 mt-1">{lbl}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Menu Options */}
              <div className="p-6 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Menú</h4>
                {userRole === 'professional' ? (
                  <>
                    <MenuOption icon={MessageCircle} label="Mensajes" badge={3} onClick={() => { navigate(`/dashboard/${userRole}/messages`); setShowNotifications(false) }} />
                    <MenuOption icon={FileText} label="Reportes" onClick={() => { navigate(`/dashboard/${userRole}/reports`); setShowNotifications(false) }} />
                  </>
                ) : (
                  <MenuOption icon={BookOpen} label="Mi Diario" onClick={() => { navigate(`/dashboard/${userRole}/diary`); setShowNotifications(false) }} />
                )}
                <MenuOption icon={User} label="Mi Perfil" onClick={() => { navigate(`/dashboard/${userRole}/profile`); setShowNotifications(false) }} />
                <MenuOption icon={Bell} label="Notificaciones" badge={3} onClick={() => { navigate(`/dashboard/${userRole}/notifications`); setShowNotifications(false) }} />
                <MenuOption icon={Settings} label="Configuración" onClick={() => { navigate(`/dashboard/${userRole}/settings`); setShowNotifications(false) }} />
              </div>

              {/* Recent Notifications */}
              <div className="px-6 pb-6 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notificaciones Recientes</h4>
                <NotificationItem
                  title={userRole === 'professional' ? 'Nueva cita agendada' : 'Cita confirmada'}
                  message={userRole === 'professional' ? 'Paciente María García para mañana a las 10:00 AM' : 'Tu sesión con Dr. García está confirmada para mañana'}
                  time="Hace 5 min" unread
                />
                <NotificationItem
                  title="Recordatorio"
                  message={userRole === 'professional' ? 'Tienes 3 citas programadas para hoy' : 'Completar tu registro de ánimo diario'}
                  time="Hace 1 hora"
                />
              </div>

              <div className="px-6 pb-4">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
const NavBtn = ({ path, exact, label, Icon, badge }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const active = exact ? location.pathname === path : location.pathname.startsWith(path)
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate(path)}
      className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${active ? 'bg-sky-100 dark:bg-sky-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
    >
      {active && <motion.div layoutId="activeTab" className="absolute -top-1 w-1 h-1 bg-blue-700 rounded-full" />}
      <Icon className="w-5 h-5" strokeWidth={2.5} />
      <span className="text-[10px] font-semibold">{label}</span>
      {badge && <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />}
    </motion.button>
  )
}

const MoreBtn = ({ badge, onClick }) => (
  <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all text-gray-500 dark:text-gray-400">
    <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
    <span className="text-[10px] font-semibold">Más</span>
    {badge && <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />}
  </motion.button>
)

const MenuOption = ({ icon: Icon, label, badge, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }} onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
  >
    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-600 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
      <Icon className="w-5 h-5" strokeWidth={2} />
    </div>
    <span className="flex-1 font-semibold text-gray-900 dark:text-gray-100">{label}</span>
    {badge && <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 text-center">{badge}</span>}
  </motion.button>
)

const NotificationItem = ({ title, message, time, unread }) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    className={`p-4 rounded-2xl border ${unread ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/40' : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700'} cursor-pointer hover:shadow-md transition-all`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${unread ? 'bg-blue-700' : 'bg-transparent'}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 inline-block">{time}</span>
      </div>
    </div>
  </motion.div>
)

export default DashboardLayout
