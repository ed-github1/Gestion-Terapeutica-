import { motion } from 'motion/react'
import { Calendar, CalendarPlus, ArrowRight } from 'lucide-react'
import { toLocalDateObj, endTimeOf } from '@shared/utils/appointments'

const STATUS_LABEL = {
  confirmed: 'Confirmada', scheduled: 'Programada', reserved: 'Reservada',
  accepted: 'Aceptada', pending: 'Pendiente', paid: 'Pagada',
}

const DOT_COLOR = {
  confirmed: 'bg-emerald-500', scheduled: 'bg-emerald-500',
  accepted:  'bg-emerald-500', paid:      'bg-emerald-500',
  pending:   'bg-amber-400',   reserved:  'bg-blue-500',
}

const EMERALD_BADGE = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
const BADGE_STYLE = {
  confirmed: EMERALD_BADGE, scheduled: EMERALD_BADGE,
  accepted:  EMERALD_BADGE, paid:      EMERALD_BADGE,
  pending:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  reserved:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
}

const getRelativeLabel = (date) => {
  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString())    return { label: 'Hoy',      color: 'text-[#0075C9] dark:text-blue-400' }
  if (date.toDateString() === tomorrow.toDateString()) return { label: 'Mañana',   color: 'text-emerald-600 dark:text-emerald-400' }
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
  if (diff <= 7)                                       return { label: `En ${diff} días`, color: 'text-gray-500 dark:text-gray-400' }
  return null
}

const AppointmentsSummary = ({ appointments, loading, onViewAll, onRequestNew }) => {
  const now = new Date()
  const upcoming = appointments
    .filter(a => endTimeOf(a) > now && a.status !== 'cancelled')
    .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))
    .slice(0, 4)

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Citas</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRequestNew} className="flex items-center gap-1 text-xs text-[#0075C9] hover:underline">
            <CalendarPlus className="w-3 h-3" />
            Nueva
          </button>
          <button onClick={onViewAll} className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-2.5 w-2/5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="py-6 flex flex-col items-center text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sin citas próximas</p>
          <button onClick={onRequestNew} className="mt-2 text-xs text-[#0075C9] hover:underline">
            Agendar una cita
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          {upcoming.map((apt, i) => {
            const isLast   = i === upcoming.length - 1
            const isNext   = i === 0
            const d        = toLocalDateObj(apt.date, apt.time)
            const dateStr  = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
            const timeStr  = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            const rel      = getRelativeLabel(d)
            const dotColor = DOT_COLOR[apt.status] || 'bg-gray-400'
            const badge    = BADGE_STYLE[apt.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'

            return (
              <motion.div
                key={apt._id || apt.id || i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3"
              >
                {/* Dot + spine */}
                <div className="flex flex-col items-center w-4 shrink-0">
                  <div className="mt-1.5 shrink-0">
                    {isNext ? (
                      <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${dotColor}`} />
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
                      </span>
                    ) : (
                      <span className={`block h-2.5 w-2.5 rounded-full ${dotColor} opacity-50`} />
                    )}
                  </div>
                  {!isLast && <div className="flex-1 w-px bg-gray-100 dark:bg-gray-700 mt-1 min-h-4.5" />}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {rel ? (
                      <p className="text-xs font-bold">
                        <span className={rel.color}>{rel.label}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-normal"> · {timeStr}</span>
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
                        {dateStr} · {timeStr}
                      </p>
                    )}
                    {isNext && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0075C9]/10 text-[#0075C9] font-semibold leading-none">
                        Siguiente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {apt.professionalName && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{apt.professionalName}</p>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge}`}>
                      {STATUS_LABEL[apt.status] || apt.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AppointmentsSummary
