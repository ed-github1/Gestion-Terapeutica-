import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { UserPlus, CheckSquare } from 'lucide-react'
import TodoModal from '../TodoModal'

const STORAGE_KEY = 'professional_todos'

function getPendingCount() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const todos = raw ? JSON.parse(raw) : []
        return todos.filter(t => !t.done).length
    } catch { return 0 }
}

const Badge = ({ count, onDark = false }) => {
    if (!count || count <= 0) return null
    return (
        <span className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ${onDark ? 'ring-[#0075C9]' : 'ring-white dark:ring-gray-900'}`}>
            {count > 9 ? '9+' : count}
        </span>
    )
}

const springTransition = { type: 'spring', stiffness: 380, damping: 22 }

/**
 * Quick-action buttons.
 *
 * variant="mobile"   (default) — horizontal 2-col grid, hidden on xl
 * variant="calendar" — compact pill row inside the calendar header
 * variant="iconbar"  — icon grid with "Atajos" label (sidebar dark panel)
 * variant="sidebar"  — icon grid with "Atajos" label (sidebar light panel)
 */
const QuickActions = ({ setShowPatientForm, setShowCalendar, variant = 'mobile' }) => {
    const [todoOpen, setTodoOpen] = useState(false)
    const [pendingCount, setPendingCount] = useState(getPendingCount)

    const handleClose = () => {
        setTodoOpen(false)
        setPendingCount(getPendingCount())
    }

    useEffect(() => {
        const sync = () => setPendingCount(getPendingCount())
        window.addEventListener('storage', sync)
        return () => window.removeEventListener('storage', sync)
    }, [])

    const actions = [
        {
            label: 'Nuevo paciente',
            shortLabel: 'Nuevo',
            sublabel: 'Generar enlace',
            icon: UserPlus,
            primary: false,
            focusRing: 'focus-visible:ring-gray-400',
            onClick: () => setShowPatientForm(true),
        },
        {
            label: 'Mis Tareas',
            shortLabel: 'Tareas',
            sublabel: pendingCount > 0 ? `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : 'Sin pendientes',
            icon: CheckSquare,
            primary: true,
            focusRing: 'focus-visible:ring-[#0075C9]',
            badge: pendingCount,
            onClick: () => setTodoOpen(true),
        },
    ]

    /* ── iconbar: compact icons for collapsed sidebar ── */
    if (variant === 'iconbar') {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300 leading-none mb-3">
                        Atajos
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {actions.map((action) => (
                            <motion.button
                                key={action.label}
                                onClick={action.onClick}
                                aria-label={action.label}
                                title={action.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={springTransition}
                                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all outline-none focus-visible:ring-2 ${action.focusRing} focus-visible:ring-offset-1
                                    ${action.primary
                                        ? 'bg-[#0075C9] border-[#0075C9] hover:bg-[#005fa3] hover:border-[#005fa3]'
                                        : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/20'}`}
                            >
                                <div className="relative">
                                    <action.icon className={`w-5 h-5 ${action.primary ? 'text-white' : 'text-white/70'}`} strokeWidth={1.8} />
                                    <Badge count={action.badge} onDark={action.primary} />
                                </div>
                                <span className={`text-[10px] font-semibold leading-none text-center ${action.primary ? 'text-white' : 'text-white/60'}`}>
                                    {action.shortLabel}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
                <TodoModal open={todoOpen} onClose={handleClose} />
            </>
        )
    }

    /* ── calendar: compact inline pills ── */
    if (variant === 'calendar') {
        return (
            <>
                <div className="flex items-center gap-2">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            aria-label={action.label}
                            title={action.label}
                            className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all active:scale-[0.97] outline-none focus-visible:ring-2 ${action.focusRing} focus-visible:ring-offset-1
                                ${action.primary
                                    ? 'bg-[#0075C9] border-[#0075C9] hover:bg-[#005fa3]'
                                    : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 dark:bg-gray-700/60 dark:border-gray-600 dark:hover:bg-gray-600/60'}`}
                        >
                            <span className="relative">
                                <action.icon className={`w-4 h-4 shrink-0 ${action.primary ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} strokeWidth={2} />
                                <Badge count={action.badge} onDark={action.primary} />
                            </span>
                            <span className={`text-xs font-semibold leading-none ${action.primary ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {action.shortLabel}
                            </span>
                        </button>
                    ))}
                </div>
                <TodoModal open={todoOpen} onClose={handleClose} />
            </>
        )
    }

    /* ── sidebar: icon grid with label ── */
    if (variant === 'sidebar') {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300 leading-none mb-3">
                        Atajos
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {actions.map((action) => (
                            <motion.button
                                key={action.label}
                                onClick={action.onClick}
                                aria-label={action.label}
                                title={action.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={springTransition}
                                className={`relative flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-2xl border transition-all outline-none focus-visible:ring-2 ${action.focusRing} focus-visible:ring-offset-1
                                    ${action.primary
                                        ? 'bg-[#0075C9] border-[#0075C9] hover:bg-[#005fa3] hover:border-[#005fa3]'
                                        : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/20'}`}
                            >
                                <div className="relative">
                                    <action.icon className={`w-4.5 h-4.5 ${action.primary ? 'text-white' : 'text-white/70'}`} strokeWidth={1.8} />
                                    <Badge count={action.badge} onDark={action.primary} />
                                </div>
                                <span className={`text-[10px] font-semibold leading-none text-center ${action.primary ? 'text-white' : 'text-white/60'}`}>
                                    {action.shortLabel}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
                <TodoModal open={todoOpen} onClose={handleClose} />
            </>
        )
    }

    /* ── mobile (default): card-style grid ── */
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3 mb-6 xl:hidden"
            >
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        onClick={action.onClick}
                        aria-label={action.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.08, ...springTransition }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left outline-none focus-visible:ring-2 ${action.focusRing} focus-visible:ring-offset-2
                            ${action.primary
                                ? 'bg-[#0075C9] border-[#0075C9] hover:bg-[#005fa3] hover:shadow-lg hover:shadow-[#0075C9]/30'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
                    >
                        <div className="relative shrink-0 group-hover:scale-110 transition-transform duration-200">
                            <action.icon className={`w-5 h-5 ${action.primary ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.8} />
                            <Badge count={action.badge} onDark={action.primary} />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${action.primary ? 'text-white' : 'text-gray-700 dark:text-gray-100'}`}>{action.label}</p>
                            <p className={`text-[11px] truncate ${action.primary ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>{action.sublabel}</p>
                        </div>
                    </motion.button>
                ))}
            </motion.div>
            <TodoModal open={todoOpen} onClose={handleClose} />
        </>
    )
}

export default QuickActions
