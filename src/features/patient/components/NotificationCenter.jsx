import { AnimatePresence, motion } from 'motion/react'
import { TopBarBell } from '@shared/ui'

const TYPE_MAP = {
  'request-pending':         { emoji: '⏳', label: 'Solicitud enviada',       color: 'blue'   },
  'appointment-pending':     { emoji: '📩', label: 'Nueva cita pendiente',    color: 'amber'  },
  'appointment-booked':      { emoji: '📅', label: 'Nueva cita agendada',     color: 'blue'   },
  'appointment-confirmed':   { emoji: '✅', label: 'Cita confirmada',          color: 'green'  },
  'appointment-cancelled':   { emoji: '❌', label: 'Cita cancelada',           color: 'red'    },
  'appointment-rescheduled': { emoji: '🔄', label: 'Cita reprogramada',       color: 'amber'  },
  'appointment-paid':        { emoji: '💳', label: 'Pago recibido',            color: 'green'  },
}

const COLOR = {
  blue:  { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-800 dark:text-blue-300',   dot: 'bg-blue-500'  },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-500' },
  red:   { bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-800 dark:text-red-300',     dot: 'bg-red-500'   },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
}

const NotificationCenter = ({ notifications = [], onDismiss, onDismissAll, onAction }) => {
  const unread = notifications.length

  return (
    <TopBarBell count={unread}>
      {({ close }) => (
        <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-stone-100 dark:border-gray-700 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-gray-700">
            <span className="text-sm font-bold text-stone-800 dark:text-white">Notificaciones</span>
            {unread > 0 && (
              <button
                onClick={() => { onDismissAll(); close() }}
                className="text-[11px] font-medium text-stone-400 dark:text-gray-500 hover:text-stone-600 dark:hover:text-gray-300 transition-colors"
              >
                Limpiar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-90 overflow-y-auto divide-y divide-stone-50 dark:divide-gray-700 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <svg className="w-8 h-8 text-stone-200 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs text-stone-400 dark:text-gray-500 font-medium">Sin notificaciones</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((n) => {
                  const meta    = TYPE_MAP[n.event] || { emoji: '🔔', label: n.event, color: 'blue' }
                  const c       = COLOR[meta.color] || COLOR.blue
                  const date    = n.data?.date
                    ? new Date(n.data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : null
                  const relTime = n.at
                    ? (() => {
                        const diff = Math.floor((Date.now() - new Date(n.at)) / 60000)
                        if (diff < 1)  return 'Ahora'
                        if (diff < 60) return `${diff}m`
                        return `${Math.floor(diff / 60)}h`
                      })()
                    : null

                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors ${c.bg}`}
                    >
                      <span className="mt-1 shrink-0 relative flex h-2.5 w-2.5">
                        {n.event === 'request-pending' && (
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${c.text}`}>{meta.emoji}&nbsp;{meta.label}</p>
                        {(date || n.data?.time) && (
                          <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">
                            {[date, n.data?.time].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {n.data?.professionalName && (
                          <p className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5 truncate">{n.data.professionalName}</p>
                        )}
                        {n.message && (
                          <p className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">{n.message}</p>
                        )}
                        {(n.event === 'appointment-pending' || n.event === 'appointment-booked') && n.data && (
                          <button
                            onClick={() => { onAction?.('accept', n.data); close() }}
                            className="mt-1.5 px-2.5 py-1 text-[11px] font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                          >
                            Ver y aceptar
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {relTime && <span className="text-[10px] text-stone-400 dark:text-gray-500">{relTime}</span>}
                        <button
                          onClick={() => onDismiss(n.id)}
                          className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          aria-label="Descartar"
                        >
                          <svg className="w-3 h-3 text-stone-300 dark:text-gray-600 hover:text-stone-500 dark:hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </TopBarBell>
  )
}

export default NotificationCenter
