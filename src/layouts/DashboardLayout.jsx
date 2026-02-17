import { useState } from 'react'
import { User, Brain, Bell, Home, Calendar, MessageCircle, Users, FileText, Plus, Settings, X, Video, BookOpen, MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import DashboardSidebar from '@components/layout/DashboardSidebar'
import { useAuth } from '@features/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@constants/routes'

// Dashboard Layout with persistent sidebar in rounded container
const DashboardLayout = ({ children, userRole }) => {
    const [showNotifications, setShowNotifications] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Get user initials
    const getInitials = () => {
        if (!user) return '?'
        if (user.nombre && user.apellido) {
            return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
        }
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
            {/* Mobile Top Bar - Clean with just branding */}
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
                {/* Sidebar - Only visible on desktop (md+) */}
                <div className="hidden md:block md:relative md:h-full">
                    <DashboardSidebar userRole={userRole} onClose={() => {}} />
                </div>

                {/* Main Content */}
                <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white md:bg-transparent relative touch-pan-y pb-20 md:pb-0">
                    {children}
                </div>
            </div>

            {/* Modern Bottom Navigation Bar - Mobile Only - Psychology App Specific */}
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
            >
                <div className="flex items-center justify-around px-2 py-2">
                    {userRole === 'professional' ? (
                        <>
                            {/* Professional Navigation - 5 items */}
                            
                            {/* Home */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname === `/dashboard/${userRole}` 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname === `/dashboard/${userRole}` && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <Home className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Inicio</span>
                            </motion.button>

                            {/* Appointments */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}/appointments`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname.includes('/appointments') 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname.includes('/appointments') && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <Calendar className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Agenda</span>
                            </motion.button>

                            {/* Quick Action - New Session/Appointment FAB */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => navigate(`/dashboard/${userRole}/appointments/new`)}
                                className="w-14 h-14 -mt-6 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30 flex flex-col items-center justify-center text-white"
                                title="Nueva Cita"
                            >
                                <Plus className="w-6 h-6" strokeWidth={2.5} />
                                <span className="text-[8px] font-semibold mt-0.5">CITA</span>
                            </motion.button>

                            {/* Patients */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}/patients`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname.includes('/patients') 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname.includes('/patients') && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <Users className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Pacientes</span>
                            </motion.button>

                            {/* More Menu */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all text-gray-500"
                            >
                                <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Más</span>
                                {/* Notification badge */}
                                <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                            </motion.button>
                        </>
                    ) : (
                        <>
                            {/* Patient Navigation - 5 items */}
                            
                            {/* Home */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname === `/dashboard/${userRole}` 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname === `/dashboard/${userRole}` && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <Home className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Inicio</span>
                            </motion.button>

                            {/* Appointments */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}/appointments`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname.includes('/appointments') 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname.includes('/appointments') && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <Calendar className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Citas</span>
                            </motion.button>

                            {/* Quick Action - Start/Book Session FAB */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => navigate(`/dashboard/${userRole}/appointments/request`)}
                                className="w-14 h-14 -mt-6 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30 flex flex-col items-center justify-center text-white"
                                title="Iniciar Sesión"
                            >
                                <Video className="w-6 h-6" strokeWidth={2.5} />
                                <span className="text-[8px] font-semibold mt-0.5">SESIÓN</span>
                            </motion.button>

                            {/* Messages */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/dashboard/${userRole}/messages`)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                    location.pathname.includes('/messages') 
                                        ? 'bg-indigo-100 text-indigo-600' 
                                        : 'text-gray-500'
                                }`}
                            >
                                {location.pathname.includes('/messages') && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
                                    />
                                )}
                                <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Chat</span>
                                {/* Unread messages badge */}
                                <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </motion.button>

                            {/* More Menu */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all text-gray-500"
                            >
                                <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">Más</span>
                                {/* Notification badge */}
                                <span className="absolute top-0.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                            </motion.button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Profile Menu + Notifications Panel - Slide from bottom */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="md:hidden fixed bottom-0 left-0 right-0 z-70 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                            style={{
                                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)'
                            }}
                        >
                            {/* Profile Header */}
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
                                        <h3 className="text-lg font-bold text-white">
                                            {user?.name || user?.nombre || 'Usuario'}
                                        </h3>
                                        <p className="text-sm text-white/80">
                                            {user?.email || 'usuario@email.com'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats - For Professionals */}
                            {userRole === 'professional' && (
                                <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                                    <div className="text-center p-3 bg-indigo-50 rounded-xl">
                                        <div className="text-2xl font-bold text-indigo-600">12</div>
                                        <div className="text-xs text-gray-600 mt-1">Pacientes</div>
                                    </div>
                                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                        <div className="text-2xl font-bold text-emerald-600">5</div>
                                        <div className="text-xs text-gray-600 mt-1">Hoy</div>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                                        <div className="text-2xl font-bold text-amber-600">3</div>
                                        <div className="text-xs text-gray-600 mt-1">Próximas</div>
                                    </div>
                                </div>
                            )}

                            {/* Menu Options */}
                            <div className="p-6 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Menú</h4>
                                
                                {userRole === 'professional' ? (
                                    <>
                                        <MenuOption 
                                            icon={MessageCircle}
                                            label="Mensajes"
                                            badge={3}
                                            onClick={() => {
                                                navigate(`/dashboard/${userRole}/messages`)
                                                setShowNotifications(false)
                                            }}
                                        />
                                        <MenuOption 
                                            icon={FileText}
                                            label="Reportes"
                                            onClick={() => {
                                                navigate(`/dashboard/${userRole}/reports`)
                                                setShowNotifications(false)
                                            }}
                                        />
                                    </>
                                ) : (
                                    <MenuOption 
                                        icon={BookOpen}
                                        label="Mi Diario"
                                        onClick={() => {
                                            navigate(`/dashboard/${userRole}/diary`)
                                            setShowNotifications(false)
                                        }}
                                    />
                                )}
                                
                                <MenuOption 
                                    icon={User}
                                    label="Mi Perfil"
                                    onClick={() => {
                                        navigate(`/dashboard/${userRole}/profile`)
                                        setShowNotifications(false)
                                    }}
                                />
                                
                                <MenuOption 
                                    icon={Bell}
                                    label="Notificaciones"
                                    badge={3}
                                    onClick={() => {
                                        navigate(`/dashboard/${userRole}/notifications`)
                                        setShowNotifications(false)
                                    }}
                                />
                                
                                <MenuOption 
                                    icon={Settings}
                                    label="Configuración"
                                    onClick={() => {
                                        navigate(`/dashboard/${userRole}/settings`)
                                        setShowNotifications(false)
                                    }}
                                />
                            </div>

                            {/* Recent Notifications */}
                            <div className="px-6 pb-6 space-y-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notificaciones Recientes</h4>
                                
                                <NotificationItem 
                                    title={userRole === 'professional' ? 'Nueva cita agendada' : 'Cita confirmada'}
                                    message={userRole === 'professional' ? 'Paciente María García para mañana a las 10:00 AM' : 'Tu sesión con Dr. García está confirmada para mañana'}
                                    time="Hace 5 min"
                                    unread
                                />
                                <NotificationItem 
                                    title="Recordatorio"
                                    message={userRole === 'professional' ? 'Tienes 3 citas programadas para hoy' : 'Completar tu registro de ánimo diario'}
                                    time="Hace 1 hora"
                                />
                            </div>

                            {/* Logout Button */}
                            <div className="px-6 pb-4">
                                <button 
                                    onClick={() => {
                                        // Add logout logic here
                                        setShowNotifications(false)
                                    }}
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

// Menu Option Component
const MenuOption = ({ icon: Icon, label, badge, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
    >
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shrink-0">
            <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="flex-1 font-semibold text-gray-900">{label}</span>
        {badge && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 text-center">
                {badge}
            </span>
        )}
    </motion.button>
)

// Notification Item Component
const NotificationItem = ({ title, message, time, unread }) => (
    <motion.div 
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-2xl border ${unread ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'} cursor-pointer hover:shadow-md transition-all`}
    >
        <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${unread ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
                <span className="text-[10px] text-gray-400 mt-1 inline-block">{time}</span>
            </div>
        </div>
    </motion.div>
)

export default DashboardLayout
