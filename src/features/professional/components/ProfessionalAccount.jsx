import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    User as UserIcon,
    BarChart2,
    Settings as SettingsIcon,
    LogOut,
    Crown,
    Shield,
    ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@features/auth'
import ProfessionalStats from '../ProfessionalStats'
import ProfessionalProfile from './ProfessionalProfile'
import ProfessionalSettings from './ProfessionalSettings'

const TABS = [
    { id: 'profile',  label: 'Perfil',        icon: UserIcon,      path: '/dashboard/professional/profile' },
    { id: 'stats',    label: 'Estadísticas',  icon: BarChart2,     path: '/dashboard/professional/stats' },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon,  path: '/dashboard/professional/settings' },
]

const tabFromPath = (pathname) => {
    if (pathname.includes('/stats'))    return 'stats'
    if (pathname.includes('/settings')) return 'settings'
    return 'profile'
}

const ProfessionalAccount = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [active, setActive] = useState(() => tabFromPath(location.pathname))

    const fullName  = user?.name || user?.nombre || 'Profesional'
    const initials  = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const email     = user?.email || user?.correo || ''
    const specialty = user?.specialty || user?.especialidad || 'Profesional de Salud'
    const planRaw   = (user?.subscriptionPlan || user?.plan || user?.planType || 'GRATUITO').toUpperCase()
    const isPro     = planRaw === 'PRO' || planRaw === 'EMPRESA'
    const planLabel = planRaw === 'EMPRESA' ? 'Empresa' : planRaw === 'PRO' ? 'Pro' : 'Gratuito'

    const handleTab = (id) => {
        if (id === active) return
        setActive(id)
        const tab = TABS.find(t => t.id === id)
        if (tab && location.pathname !== tab.path) {
            navigate(tab.path, { replace: true })
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-5">

                {/* ── Identity hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-white dark:bg-linear-to-br dark:from-gray-900 dark:via-gray-900 dark:to-sky-950/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 md:p-5 shadow-sm dark:shadow-xl overflow-hidden"
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: 'linear-gradient(to right, #0075C9, #54C0E8, #AEE058)' }}
                    />
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                            aria-label="Volver"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-base md:text-lg font-bold shadow-lg shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-none truncate">{fullName}</h1>
                                {isPro ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide leading-none">
                                        <Crown className="w-2.5 h-2.5" /> {planLabel}
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">
                                        {planLabel}
                                    </span>
                                )}
                                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 leading-none">
                                    <Shield className="w-2.5 h-2.5" /> Verificado
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{specialty}</p>
                            {email && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{email}</p>}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex shrink-0 items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/70 transition-colors border border-red-200 dark:border-red-900/60"
                        >
                            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
                        </button>
                        <button
                            onClick={handleLogout}
                            aria-label="Cerrar sesión"
                            className="sm:hidden shrink-0 w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/70 border border-red-200 dark:border-red-900/60"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* ── Tabs ── */}
                <div className="sticky top-2 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-1 flex gap-1 shadow-sm">
                    {TABS.map(t => {
                        const isActive = active === t.id
                        const Icon = t.icon
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleTab(t.id)}
                                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 md:py-2.5 px-2 md:px-3 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="accountTabPill"
                                        className="absolute inset-0 bg-linear-to-br from-blue-600 to-sky-500 rounded-xl shadow"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <Icon className="w-3.5 h-3.5 relative z-10" strokeWidth={2.5} />
                                <span className="relative z-10">{t.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ── Active tab ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        {active === 'profile'  && <ProfessionalProfile embedded />}
                        {active === 'stats'    && <ProfessionalStats embedded />}
                        {active === 'settings' && <ProfessionalSettings embedded />}
                    </motion.div>
                </AnimatePresence>

                {/* bottom spacer for mobile nav */}
                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalAccount
