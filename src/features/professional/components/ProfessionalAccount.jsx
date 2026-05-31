import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    User as UserIcon,
    BarChart2,
    LogOut,
    Crown,
    ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@features/auth'
import ProfessionalStats from '../ProfessionalStats'
import ProfessionalAccountTab from './ProfessionalAccountTab'

const TABS = [
    { id: 'stats', label: 'Estadísticas', icon: BarChart2 },
    { id: 'cuenta', label: 'Cuenta', icon: UserIcon },
]

const tabFromPath = (pathname) => {
    if (pathname.includes('/stats')) return 'stats'
    return 'cuenta'
}

const ProfessionalAccount = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [active, setActive] = useState(() => tabFromPath(location.pathname))

    const fullName = user?.name || user?.nombre || 'Profesional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const specialty = user?.specialty || user?.especialidad || 'Profesional de Salud'
    const planRaw = (user?.subscriptionPlan || user?.plan || user?.planType || 'GRATUITO').toUpperCase()
    const isPro = planRaw === 'PRO' || planRaw === 'EMPRESA'
    const planLabel = planRaw === 'EMPRESA' ? 'Empresa' : planRaw === 'PRO' ? 'Pro' : 'Gratuito'

    const handleTab = (id) => {
        if (id === active) return
        setActive(id)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="h-screen bg-gray-100  dark:bg-gray-950  flex p-3 md:p-4">
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

                {/* ── Top bar: breadcrumb + tabs ── */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">

                    {/* tabs at top-right */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
                            {TABS.map(t => {
                                const isActive = active === t.id
                                const Icon = t.icon
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTab(t.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                                        <span className="hidden sm:inline">{t.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            onClick={handleLogout}
                            aria-label="Cerrar sesión"
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto bg-white  dark:bg-gray-900">
                    {/* Profile hero */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-2xl font-bold mb-4">
                            {initials}
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                            <svg className="w-5 h-5 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            {isPro ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wide">
                                    <Crown className="w-3 h-3" /> {planLabel}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 uppercase tracking-wide">
                                    {planLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{specialty}</p>
                    </div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="p-5 md:p-8"
                        >
                            {active === 'stats' && <ProfessionalStats embedded />}
                            {active === 'cuenta' && <ProfessionalAccountTab />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalAccount
