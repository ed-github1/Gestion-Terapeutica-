import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    User as UserIcon,
    LogOut,
    Briefcase,
    Settings,
    ChevronDown,
} from 'lucide-react'
import { useAuth } from '@features/auth'
import ProfessionalAccountTab from './ProfessionalAccountTab'
import RatesPanel from './RatesPanel'
import AvailabilityManager from './AvailabilityManager'
import ProfessionalSettings from './ProfessionalSettings'

const PracticaContent = () => (
    <div className="space-y-8">
        <AvailabilityManager embedded />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <RatesPanel embedded />
    </div>
)

const NAV = [
    { id: 'cuenta', label: 'Mi Perfil', short: 'Perfil', icon: UserIcon },
    { id: 'practica', label: 'Mi Práctica', short: 'Práctica', icon: Briefcase },
    { id: 'config', label: 'Configuración', short: 'Config', icon: Settings },
]

const CONTENT = {
    cuenta: <ProfessionalAccountTab />,
    practica: <PracticaContent />,
    config: <ProfessionalSettings embedded />,
}

const ProfessionalAccount = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [active, setActive] = useState(() =>
        new URLSearchParams(location.search).get('mp') ? 'config' : 'cuenta'
    )
    // Mobile accordion: which section is open (null = all closed)
    const [mobileOpen, setMobileOpen] = useState(() =>
        new URLSearchParams(location.search).get('mp') ? 'config' : null
    )

    const handleLogout = async () => { await logout(); navigate('/login') }
    const toggleMobile = (id) => setMobileOpen(prev => prev === id ? null : id)

    return (
        <div className="h-dvh bg-gray-100 dark:bg-gray-950 flex p-3 md:p-4">
            <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {/* ── Mobile accordion ── */}
                <div className="md:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {NAV.map(({ id, label, icon: Icon }) => {
                        const isOpen = mobileOpen === id
                        return (
                            <div key={id}>
                                <button
                                    onClick={() => toggleMobile(id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            className={`w-4.5 h-4.5 shrink-0 transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                                            strokeWidth={isOpen ? 2.5 : 1.8}
                                        />
                                        <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-6 pt-1 border-t border-gray-100 dark:border-gray-800">
                                                {CONTENT[id]}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}

                    {/* Logout row */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                        <LogOut className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} />
                        <span className="text-sm font-semibold">Cerrar sesión</span>
                    </button>
                </div>

                {/* ── Desktop sidebar ── */}
                <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800">

                    {/* Nav items */}
                    <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 space-y-0.5">
                        {NAV.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActive(id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-left ${active === id
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="shrink-0 px-2 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Cerrar sesión
                        </button>
                    </div>
                </div>

                {/* ── Desktop content area ── */}
                <div className="hidden md:flex flex-1 min-h-0 min-w-0 overflow-y-auto bg-white dark:bg-gray-900">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="w-full p-8"
                        >
                            {CONTENT[active]}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    )
}

export default ProfessionalAccount
