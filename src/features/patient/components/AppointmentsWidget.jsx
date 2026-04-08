import { motion, AnimatePresence } from 'motion/react'
import { CalendarDays, Clock, CheckCircle2, XCircle, Loader2, Plus, ChevronRight } from 'lucide-react'
import { toLocalDateObj } from '@shared/utils/appointments'
import { useAppointments } from '../AppointmentsContext'

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmada',   bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', Icon: CheckCircle2 },
  completed:   { label: 'Completada',   bg: 'bg-stone-50 dark:bg-stone-800',          text: 'text-stone-500 dark:text-stone-400',     border: 'border-stone-200 dark:border-stone-600',       Icon: CheckCircle2 },
  reserved:    { label: 'Reservada',    bg: 'bg-blue-50 dark:bg-blue-900/30',         text: 'text-blue-700 dark:text-blue-400',      border: 'border-blue-200 dark:border-blue-700/50',      Icon: Clock        },
  cancelled:   { label: 'Cancelada',    bg: 'bg-red-50 dark:bg-red-900/30',           text: 'text-red-600 dark:text-red-400',        border: 'border-red-200 dark:border-red-700/50',        Icon: XCircle      },
  rescheduled: { label: 'Reprogramada', bg: 'bg-purple-50 dark:bg-purple-900/30',     text: 'text-purple-700 dark:text-purple-400',  border: 'border-purple-200 dark:border-purple-700/50',  Icon: Clock        },
  'no-show':   { label: 'No asistió',   bg: 'bg-orange-50 dark:bg-orange-900/30',     text: 'text-orange-700 dark:text-orange-400',  border: 'border-orange-200 dark:border-orange-700/50',  Icon: XCircle      },
}

function statusCfg(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.reserved
}

function fmtApptDate(date, time) {
  try {
    const d = toLocalDateObj(date, time)
    const now  = new Date()
    const diff = Math.ceil((d - now) / 86_400_000)
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    if (diff > 0 && diff <= 1)   return `Mañana · ${timeStr}`
    if (diff === 0)               return `Hoy · ${timeStr}`
    if (diff > 0 && diff <= 7)   return `${dateStr} · ${timeStr}`
    return dateStr
  } catch {
    return date ? new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'
  }
}

/**
 * AppointmentsWidget — inline appointments panel, mirrors the DiaryWidget style.
 * Props:
 *  onOpenAll        — open full PatientAppointments modal
 *  onRequestNew     — open AppointmentRequest modal
 *  refreshTrigger   — kept for interface compatibility; ignored (context auto-updates)
 */
const AppointmentsWidget = ({ onOpenAll, onRequestNew, refreshTrigger: _ignored = 0 }) => {
  const { appointments: allAppointments, loading } = useAppointments()

  const now = new Date()

  const upcoming = allAppointments
    .filter(a => toLocalDateObj(a.date, a.time) >= now && a.status !== 'cancelled')
    .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))

  const past = allAppointments
    .filter(a => toLocalDateObj(a.date, a.time) < now)
    .sort((a, b) => toLocalDateObj(b.date, b.time) - toLocalDateObj(a.date, a.time))

  const appointments = [...upcoming, ...past].slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.10 }}
      className="bg-white dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-stone-900 dark:text-white">Mis Citas</p>
        </div>
        {onOpenAll && (
          <button
            onClick={onOpenAll}
            className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Ver todas
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Appointments list */}
      <div className="px-5 pt-4 pb-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-stone-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <CalendarDays className="w-9 h-9 text-stone-200" strokeWidth={1.2} />
            <p className="text-xs text-stone-400 dark:text-gray-500 text-center leading-snug">
              Sin citas registradas.<br />¡Solicita tu primera sesión!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-2">
              {appointments.map((appt, i) => {
                const cfg = statusCfg(appt.status)
                const StatusIcon = cfg.Icon
                const isPast = toLocalDateObj(appt.date, appt.time) < new Date()

                return (
                  <motion.div
                    key={appt._id || appt.id || i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-2xl ${isPast ? 'bg-stone-50/70 dark:bg-gray-700/50' : 'bg-stone-50 dark:bg-gray-700/80'}`}
                  >
                    {/* Status badge */}
                    <span className={`shrink-0 mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <StatusIcon className="w-3 h-3" strokeWidth={2} />
                      {cfg.label}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate leading-snug ${isPast ? 'text-stone-400 dark:text-gray-500' : 'text-stone-800 dark:text-gray-100'}`}>
                        {appt.professionalName || appt.professional?.name || 'Profesional'}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {fmtApptDate(appt.date, appt.time)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer CTA */}
      {onRequestNew && (
        <div className="px-5 pb-4">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRequestNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Solicitar nueva cita
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

export default AppointmentsWidget
