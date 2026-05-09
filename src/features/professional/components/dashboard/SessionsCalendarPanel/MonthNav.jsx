import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MonthNav = ({ calendarData, setCalendarMonth, compact = false, inlineMode = false, onToday }) => {
    const [dir, setDir] = useState(0)

    const navigate = (delta) => {
        setDir(delta)
        setCalendarMonth((prev) => {
            const d = new Date(prev.year, prev.month + delta, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
        })
    }

    const btnClass = `flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors ${compact ? 'w-6 h-6' : 'w-7 h-7'}`

    const AnimatedTitle = ({ className }) => (
        <AnimatePresence mode="wait" initial={false}>
            <motion.span
                key={`${calendarData.monthName}-${calendarData.year}`}
                initial={{ opacity: 0, y: dir > 0 ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: dir > 0 ? -6 : 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={className}
            >
                {calendarData.monthName} {calendarData.year}
            </motion.span>
        </AnimatePresence>
    )

    if (inlineMode) {
        return (
            <div className="flex items-center gap-1 md:gap-1.5">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors" aria-label="Mes anterior">
                    <ChevronLeft size={14} />
                </button>
                <AnimatedTitle className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 leading-none whitespace-nowrap min-w-22.5 md:min-w-0 text-center" />
                <button onClick={() => navigate(1)} className="flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors" aria-label="Mes siguiente">
                    <ChevronRight size={14} />
                </button>
            </div>
        )
    }

    return (
        <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">
                    Calendario
                </p>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={`${calendarData.monthName}-${calendarData.year}`}
                        initial={{ opacity: 0, y: dir > 0 ? 8 : -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: dir > 0 ? -8 : 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5 ${compact ? 'text-base' : 'text-xl'}`}
                    >
                        {calendarData.monthName} {calendarData.year}
                    </motion.p>
                </AnimatePresence>
                {calendarData.totalSessions > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-none">
                        {calendarData.totalSessions} sesiones · {calendarData.completedSessions} completadas
                    </p>
                )}
            </div>
            <div className="flex items-center gap-1.5">
                <button onClick={() => navigate(-1)} className={btnClass} aria-label="Mes anterior">
                    <ChevronLeft size={compact ? 14 : 18} />
                </button>
                <button onClick={() => navigate(1)} className={btnClass} aria-label="Mes siguiente">
                    <ChevronRight size={compact ? 14 : 18} />
                </button>
            </div>
        </div>
    )
}

export default MonthNav
