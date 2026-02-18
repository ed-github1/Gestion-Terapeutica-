/**
 * shared/layouts/DashboardLayout.jsx
 * Main dashboard shell with persistent sidebar (desktop) and bottom nav (mobile).
 */
import { useState } from 'react'
import {
  User, Brain, Bell, Home, Calendar, MessageCircle,
  Users, FileText, Plus, Settings, X, Video, BookOpen, MoreHorizontal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import DashboardSidebar from '@components/layout/DashboardSidebar'
import { useAuth } from '@features/auth'
import { useNavigate, useLocation } from 'react-router-dom'

const DashboardLayout = ({ children, userRole }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    <div className="h-screen bg-indigo-50 flex flex-col overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center shadow-md fixed top-0 left-0 right-0 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">TotalMente</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden pt-15 md:pt-0">
        <div className="hidden md:block md:relative md:h-full">
          <DashboardSidebar userRole={userRole} onClose={() => {}} />
        </div>
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white md:bg-transparent relative touch-pan-y pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Bottom Navigation – Mobile Only */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {userRole === 'professional' ? (
            <>
              <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={Home} />
              <NavBtn path={`/dashboard/${userRole}/appointments`} label="Agenda" Icon={Calendar} />
              <FabBtn label="CITA" Icon={Plus} onClick={() => navigate(`/dashboard/${userRole}/appointments/new`)} />
              <NavBtn path={`/dashboard/${userRole}/patients`} label="Pacientes" Icon={Users} />
              <MoreBtn badge onClick={() => setShowNotifications(!showNotifications)} />
            </>
          ) : (
            <>
              <NavBtn path={`/dashboard/${userRole}`} exact label="Inicio" Icon={Home} />
              <NavBtn path={`/dashboard/${userRole}/appointments`} label="Citas" Icon={Calendar} />
              <FabBtn label="SESIÓN" Icon={Video} onClick={() => navigate(`/dashboard/${userRole}/appointments/request`)} />
              <NavBtn path={`/dashboard/${userRole}/messages`} label="Chat" Icon={MessageCircle} badge />
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
              className="md:hidden fixed bottom-0 left-0 right-0 z-70 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-linear-to-br from-indigo-600 to-blue-600 px-6 py-6 rounded-t-3xl z-10">
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Menú</h4>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notificaciones Recientes</h4>
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
  const active = exact ? location.pathname === path : location.pathname.includes(path.split('/').pop())
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate(path)}
      className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${active ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
    >
      {active && <motion.div layoutId="activeTab" className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full" />}
      <Icon className="w-5 h-5" strokeWidth={2.5} />
      <span className="text-[10px] font-semibold">{label}</span>
      {badge && <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />}
    </motion.button>
  )
}

const FabBtn = ({ label, Icon, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
    onClick={onClick}
    className="w-14 h-14 -mt-6 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30 flex flex-col items-center justify-center text-white"
  >
    <Icon className="w-6 h-6" strokeWidth={2.5} />
    <span className="text-[8px] font-semibold mt-0.5">{label}</span>
  </motion.button>
)

const MoreBtn = ({ badge, onClick }) => (
  <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all text-gray-500">
    <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
    <span className="text-[10px] font-semibold">Más</span>
    {badge && <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />}
  </motion.button>
)

const MenuOption = ({ icon: Icon, label, badge, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }} onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
  >
    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shrink-0">
      <Icon className="w-5 h-5" strokeWidth={2} />
    </div>
    <span className="flex-1 font-semibold text-gray-900">{label}</span>
    {badge && <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 text-center">{badge}</span>}
  </motion.button>
)

const NotificationItem = ({ title, message, time, unread }) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    className={`p-4 rounded-2xl border ${unread ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'} cursor-pointer hover:shadow-md transition-all`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${unread ? 'bg-indigo-600' : 'bg-transparent'}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
        <span className="text-[10px] text-gray-400 mt-1 inline-block">{time}</span>
      </div>
    </div>
  </motion.div>
)

export default DashboardLayout
