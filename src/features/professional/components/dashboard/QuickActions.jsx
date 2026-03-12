import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { UserPlus, FileText, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@shared/constants/routes'
import TodoModal from '../TodoModal'

const STORAGE_KEY = 'professional_todos'

function getPendingCount() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const todos = raw ? JSON.parse(raw) : []
        return todos.filter(t => !t.done).length
    } catch { return 0 }
}

/**
 * Quick-action buttons.
 *
 * variant="mobile"   (default) — horizontal 3-col grid, hidden on xl
 * variant="calendar" — compact pill row inside the calendar header
 * variant="iconbar"  — icon grid with "Atajos" label (sidebar dark panel)
 * variant="sidebar"  — icon grid with "Atajos" label (sidebar light panel)
 *
 * @param {object}   props
 * @param {Function} props.setShowPatientForm - Opens the add-patient modal
 * @param {Function} props.setShowCalendar    - Opens the calendar/schedule modal
 * @param {string}   [props.variant="mobile"]
 */
const QuickActions = ({ setShowPatientForm, setShowCalendar, variant = 'mobile' }) => {
    const navigate = useNavigate()
    const [todoOpen, setTodoOpen] = useState(false)
    const [pendingCount, setPendingCount] = useState(getPendingCount)

    // Re-read count whenever modal closes (todos may have changed)
    const handleClose = () => {
        setTodoOpen(false)
        setPendingCount(getPendingCount())
    }

    // Also sync on mount via storage event (other tabs)
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
            color: 'bg-blue-600',
            iconBg: 'bg-blue-50',
            iconCls: '',
            iconStyle: { color: '#0075C9' },
            labelStyle: {},
            hoverBorder: 'hover:border-blue-200',
            hoverBg: 'hover:bg-blue-50',
            onClick: () => setShowPatientForm(true),
        },
        {
            label: 'Expediente',
            shortLabel: 'Expediente',
            sublabel: 'Historial clínico',
            icon: FileText,
            color: 'bg-sky-600',
            iconBg: 'bg-sky-50',
            iconCls: '',
            iconStyle: { color: '#54C0E8' },
            labelStyle: { color: '#54C0E8' },
            hoverBorder: 'hover:border-sky-200',
            hoverBg: 'hover:bg-sky-50',
            onClick: () => navigate(`${ROUTES.PROFESSIONAL_DASHBOARD}/patients`),
        },
        {
            label: 'Mis Tareas',
            shortLabel: 'Tareas',
            sublabel: pendingCount > 0 ? `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : 'Sin pendientes',
            icon: CheckSquare,
            color: 'bg-violet-600',
            iconBg: 'bg-violet-50',
            iconCls: '',
            iconStyle: { color: '#7C3AED' },
            labelStyle: { color: '#7C3AED' },
            hoverBorder: 'hover:border-violet-200',
            hoverBg: 'hover:bg-violet-50',
            badge: pendingCount,
            onClick: () => setTodoOpen(true),
        },
    ]

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
                    <div className="grid grid-cols-3 gap-2">
                        {actions.map((action) => (
                            <motion.button
                                key={action.label}
                                onClick={action.onClick}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="relative flex flex-col items-center gap-2 p-3 bg-white/80 border border-sky-100/70 rounded-2xl hover:bg-white hover:border-sky-200 hover:shadow-sm transition-colors"
                            >
                                <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                                    <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                                    {action.badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                                            {action.badge > 9 ? '9+' : action.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 leading-none text-center" style={action.labelStyle}>
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

    if (variant === 'calendar') {
        return (
            <>
                <div className="flex items-center gap-1.5">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            title={action.label}
                            className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 md:py-2 px-2 md:px-1 bg-white/70 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-600 rounded-lg md:rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 hover:shadow-sm transition-all active:scale-95 md:flex-col md:gap-1"
                        >
                            <span className="relative">
                                <action.icon className="w-3.5 h-3.5 shrink-0" style={action.iconStyle} strokeWidth={2} />
                                {action.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-violet-600 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                                        {action.badge > 9 ? '9+' : action.badge}
                                    </span>
                                )}
                            </span>
                            <span className="text-[10px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 leading-none text-center" style={action.labelStyle}>{action.shortLabel}</span>
                        </button>
                    ))}
                </div>
                <TodoModal open={todoOpen} onClose={handleClose} />
            </>
        )
    }

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
                    <div className="grid grid-cols-3 gap-2">
                        {actions.map((action) => (
                            <motion.button
                                key={action.label}
                                onClick={action.onClick}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.94 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                                className="relative flex flex-col items-center gap-1.5 py-3 px-1 bg-white/70 border border-sky-100/70 rounded-2xl hover:bg-white hover:border-sky-200 hover:shadow-sm transition-colors"
                            >
                                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                                    <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                                    {action.badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                                            {action.badge > 9 ? '9+' : action.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 leading-none text-center" style={action.labelStyle}>
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

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-3 mb-6 xl:hidden"
            >
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`group flex items-center gap-3 p-4 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600 ${action.hoverBorder} ${action.hoverBg} dark:hover:bg-gray-700 transition-all text-left`}
                    >
                        <div className={`relative w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                            <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                            {action.badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                                    {action.badge > 9 ? '9+' : action.badge}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100" style={action.labelStyle}>{action.label}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{action.sublabel}</p>
                        </div>
                    </button>
                ))}
            </motion.div>
            <TodoModal open={todoOpen} onClose={handleClose} />
        </>
    )
}

export default QuickActions
