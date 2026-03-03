/**
 * NotificationCenter.jsx
 * Bell-icon notification hub that surfaces real-time appointment events
 * (from professionals) and patient-initiated request confirmations.
 * Receives `notifications` array and callbacks from the parent dashboard.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const TYPE_MAP = {
  // fired by patient
  'request-pending':         { emoji: '⏳', label: 'Solicitud enviada',       color: 'blue'   },
  // fired by professional / socket
  'appointment-pending':     { emoji: '📩', label: 'Nueva cita pendiente',    color: 'amber'  },
  'appointment-booked':      { emoji: '📅', label: 'Nueva cita agendada',     color: 'blue'   },
  'appointment-confirmed':   { emoji: '✅', label: 'Cita confirmada',          color: 'green'  },
  'appointment-cancelled':   { emoji: '❌', label: 'Cita cancelada',           color: 'red'    },
  'appointment-rescheduled': { emoji: '🔄', label: 'Cita reprogramada',       color: 'amber'  },
  'appointment-paid':        { emoji: '💳', label: 'Pago recibido',            color: 'green'  },
}

const COLOR = {
  blue:  { ring: 'ring-blue-200',  bg: 'bg-blue-50',   text: 'text-blue-800',  dot: 'bg-blue-500'  },
  green: { ring: 'ring-green-200', bg: 'bg-green-50',  text: 'text-green-800', dot: 'bg-green-500' },
  red:   { ring: 'ring-red-200',   bg: 'bg-red-50',    text: 'text-red-800',   dot: 'bg-red-500'   },
  amber: { ring: 'ring-amber-200', bg: 'bg-amber-50',  text: 'text-amber-800', dot: 'bg-amber-500' },
}

const NotificationCenter = ({ notifications = [], onDismiss, onDismissAll, onAction }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const unread = notifications.length

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-stone-200 shadow-sm hover:border-stone-300 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-4.5 h-4.5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <span className="text-sm font-bold text-stone-800">Notificaciones</span>
              {unread > 0 && (
                <button
                  onClick={() => { onDismissAll(); setOpen(false) }}
                  className="text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Limpiar todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-90 overflow-y-auto divide-y divide-stone-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <svg className="w-8 h-8 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-xs text-stone-400 font-medium">Sin notificaciones</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => {
                    const meta  = TYPE_MAP[n.event] || { emoji: '🔔', label: n.event, color: 'blue' }
                    const c     = COLOR[meta.color] || COLOR.blue
                    const date  = n.data?.date
                      ? new Date(n.data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                      : null
                    const time  = n.data?.time || null
                    const relTime = n.at
                      ? (() => {
                          const diff = Math.floor((Date.now() - new Date(n.at)) / 60000)
                          if (diff < 1)  return 'Ahora'
                          if (diff < 60) return `${diff}m`
                          const hrs = Math.floor(diff / 60)
                          return `${hrs}h`
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
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${c.bg}`}
                      >
                        {/* Animated live dot */}
                        <span className="mt-1 shrink-0 relative flex h-2.5 w-2.5">
                          {n.event === 'request-pending' && (
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${c.text}`}>
                            {meta.emoji}&nbsp;{meta.label}
                          </p>
                          {(date || time) && (
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {[date, time].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {n.data?.professionalName && (
                            <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                              {n.data.professionalName}
                            </p>
                          )}
                          {n.message && (
                            <p className="text-[10px] text-stone-400 mt-0.5">{n.message}</p>
                          )}
                          {(n.event === 'appointment-pending' || n.event === 'appointment-booked') && n.data && (
                            <button
                              onClick={() => { onAction?.('accept', n.data); setOpen(false) }}
                              className="mt-1.5 px-2.5 py-1 text-[11px] font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                            >
                              Ver y aceptar
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {relTime && (
                            <span className="text-[10px] text-stone-400">{relTime}</span>
                          )}
                          <button
                            onClick={() => onDismiss(n.id)}
                            className="p-0.5 rounded-md hover:bg-black/5 transition-colors"
                            aria-label="Descartar"
                          >
                            <svg className="w-3 h-3 text-stone-300 hover:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
