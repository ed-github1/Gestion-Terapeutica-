/**
 * AppointmentNotificationBanner.jsx
 * Renders a stack of real-time appointment alerts sent by the professional.
 */
import { motion, AnimatePresence } from 'motion/react'

const COLOR_MAP = {
  blue:  { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  dot: 'bg-blue-500'  },
  green: { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', dot: 'bg-green-500' },
  red:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   dot: 'bg-red-500'   },
  amber: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
}

const AppointmentNotificationBanner = ({ alerts, onDismiss, onDismissAll }) => {
  if (!alerts?.length) return null

  return (
    <div className="flex flex-col gap-2">
      {alerts.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={onDismissAll}
            className="text-[11px] text-stone-400 hover:text-stone-600 font-medium transition-colors"
          >
            Descartar todas
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const c = COLOR_MAP[alert.color] || COLOR_MAP.blue
          const date = alert.data?.date
            ? new Date(alert.data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
            : null
          const time = alert.data?.time || null

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${c.bg} ${c.border} shadow-sm`}
            >
              {/* Animated dot */}
              <span className="mt-0.5 shrink-0 relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${c.dot}`} />
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${c.text}`}>
                  {alert.emoji}&nbsp;{alert.title}
                </p>
                {(date || time) && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {[date, time].filter(Boolean).join(' · ')}
                  </p>
                )}
                {alert.data?.professionalName && (
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {alert.data.professionalName}
                  </p>
                )}
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Descartar"
              >
                <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default AppointmentNotificationBanner
