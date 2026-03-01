import { motion } from 'motion/react'
import { UserPlus, FileText, CalendarCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@shared/constants/routes'

/**
 * Quick-action buttons.
 *
 * variant="mobile"  (default) — horizontal 3-col grid, hidden on xl
 * variant="sidebar" — vertical full-width stack, for the desktop right panel
 *
 * @param {object}   props
 * @param {Function} props.setShowPatientForm - Opens the add-patient modal
 * @param {Function} props.setShowCalendar    - Opens the calendar/schedule modal
 * @param {string}   [props.variant="mobile"]
 */
const QuickActions = ({ setShowPatientForm, setShowCalendar, variant = 'mobile' }) => {
    const navigate = useNavigate()

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
            hoverBorder: 'hover:border-sky-200',
            hoverBg: 'hover:bg-sky-50',
            onClick: () => navigate(`${ROUTES.PROFESSIONAL_DASHBOARD}/patients`),
        },
        {
            label: 'Sesiones',
            shortLabel: 'Agenda',
            sublabel: 'Gestionar agenda',
            icon: CalendarCheck,
            color: 'bg-emerald-600',
            iconBg: 'bg-[#AEE058]/15',
            iconCls: '',
            iconStyle: { color: '#AEE058' },
            hoverBorder: 'hover:border-[#AEE058]/40',
            hoverBg: 'hover:bg-[#AEE058]/10',
            onClick: () => setShowCalendar(true),
        },
    ]

    if (variant === 'iconbar') {
        return (
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
                            className="flex flex-col items-center gap-2 p-3 bg-white/80 border border-sky-100/70 rounded-2xl hover:bg-white hover:border-sky-200 hover:shadow-sm transition-colors"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                                <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 leading-none text-center">
                                {action.shortLabel}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        )
    }

    if (variant === 'calendar') {
        return (
            <div className="flex items-center gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        title={action.label}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 md:py-2 px-2 md:px-1 bg-white/70 border border-gray-100 rounded-lg md:rounded-xl hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all active:scale-95 md:flex-col md:gap-1"
                    >
                        <action.icon className="w-3.5 h-3.5 shrink-0" style={action.iconStyle} strokeWidth={2} />
                        <span className="text-[10px] md:text-[9px] font-semibold text-gray-500 leading-none text-center">{action.shortLabel}</span>
                    </button>
                ))}
            </div>
        )
    }

    if (variant === 'sidebar') {
        return (
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
                            className={`flex flex-col items-center gap-1.5 py-3 px-1 bg-white/70 border border-sky-100/70 rounded-2xl hover:bg-white hover:border-sky-200 hover:shadow-sm transition-colors`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                                <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 leading-none text-center">
                                {action.shortLabel}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        )
    }

    return (
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
                    className={`group flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 ${action.hoverBorder} ${action.hoverBg} transition-all text-left`}
                >
                    <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <action.icon className="w-4 h-4" style={action.iconStyle} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                        <p className="text-xs text-gray-400 truncate">{action.sublabel}</p>
                    </div>
                </button>
            ))}
        </motion.div>
    )
}

export default QuickActions
