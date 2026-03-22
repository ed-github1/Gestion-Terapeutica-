import { Bell } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

const NotificationsPanel = ({
    paidNotifications,
    setPaidNotifications,
    showNotifPanel,
    setShowNotifPanel,
}) => {
    return (
        <div className="relative shrink-0 ml-auto">
            <button
                onClick={() => setShowNotifPanel(v => !v)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Notificaciones"
            >
                <Bell
                    size={19}
                    className={paidNotifications.length > 0 ? 'text-gray-700 dark:text-gray-100' : 'text-gray-400 dark:text-gray-300'}
                    strokeWidth={1.7}
                />
                {paidNotifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
            </button>

            <AnimatePresence>
                {showNotifPanel && (
                    <motion.div
                        key="paid-notifs-dropdown"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                        className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificaciones</p>
                            <div className="flex items-center gap-3">
                                {paidNotifications.length > 0 && (
                                    <button
                                        onClick={() => setPaidNotifications([])}
                                        className="text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        Limpiar todo
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowNotifPanel(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
                            {paidNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                                    <Bell size={28} strokeWidth={1.4} className="mb-2 opacity-40" />
                                    <p className="text-xs">Sin notificaciones nuevas</p>
                                </div>
                            ) : (
                                paidNotifications.map((n) => {
                                    const dateStr = n.date
                                        ? new Date(n.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                        : ''
                                    return (
                                        <div
                                            key={n.id}
                                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                                        >
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                n.isRequest ? 'bg-blue-100 dark:bg-blue-900/40' :
                                                n.isRejected ? 'bg-red-100 dark:bg-red-900/40' :
                                                n.isCancelled ? 'bg-red-100 dark:bg-red-900/40' :
                                                n.isRescheduled ? 'bg-amber-100 dark:bg-amber-900/40' :
                                                'bg-emerald-100 dark:bg-emerald-900/40'
                                            }`}>
                                                {n.isRequest ? (
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                ) : n.isRejected || n.isCancelled ? (
                                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                ) : n.isRescheduled ? (
                                                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">{n.patientName}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                                    {n.isRequest ? 'Solicitó una cita' :
                                                     n.isAccepted ? 'Aceptó la cita' :
                                                     n.isRejected ? 'Rechazó la cita' :
                                                     n.isCancelled ? 'Canceló la cita' :
                                                     n.isRescheduled ? 'Reprogramó la cita' :
                                                     'Pagó su cita'}
                                                    {dateStr ? ` · ${dateStr}` : ''}{n.time ? ` ${n.time}` : ''}{n.amount ? ` · €${n.amount}` : ''}
                                                </p>
                                                {(n.isRejected || n.isCancelled) && n.reason && (
                                                    <p className="text-[10px] text-red-400 mt-0.5 truncate">{n.reason}</p>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-semibold mt-0.5 shrink-0 ${
                                                n.isRequest ? 'text-blue-500' :
                                                n.isRejected || n.isCancelled ? 'text-red-500' :
                                                n.isRescheduled ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                                {n.isRequest ? 'Solicitud' :
                                                 n.isAccepted ? 'Aceptada' :
                                                 n.isRejected ? 'Rechazada' :
                                                 n.isCancelled ? 'Cancelada' :
                                                 n.isRescheduled ? 'Reprogramada' :
                                                 'Pagado'}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default NotificationsPanel
