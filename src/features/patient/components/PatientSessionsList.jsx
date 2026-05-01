import { useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, Video, CheckCircle2, Plus } from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { toLocalDateObj, isToday, endTimeOf } from '@shared/utils/appointments'
import { showToast } from '@shared/ui/Toast'
import { useAppointments } from '../AppointmentsContext'

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmada',   bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', dot: 'bg-emerald-500'  },
  scheduled:   { label: 'Programada',   bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', dot: 'bg-emerald-500'  },
  pending:     { label: 'Pendiente',    bg: 'bg-amber-50 dark:bg-amber-900/30',       text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-700/50',    dot: 'bg-amber-400'    },
  completed:   { label: 'Completada',   bg: 'bg-stone-50 dark:bg-gray-700/50',       text: 'text-stone-500 dark:text-gray-400',     border: 'border-stone-200 dark:border-gray-600',        dot: 'bg-stone-400'    },
  reserved:    { label: 'Reservada',    bg: 'bg-blue-50 dark:bg-blue-900/30',        text: 'text-blue-700 dark:text-blue-400',      border: 'border-blue-200 dark:border-blue-700/50',      dot: 'bg-blue-500'     },
  accepted:    { label: 'Aceptada',     bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', dot: 'bg-emerald-500'  },
  cancelled:   { label: 'Cancelada',    bg: 'bg-red-50 dark:bg-red-900/30',          text: 'text-red-600 dark:text-red-400',        border: 'border-red-200 dark:border-red-700/50',        dot: 'bg-red-400'      },
  rescheduled: { label: 'Reprogramada', bg: 'bg-purple-50 dark:bg-purple-900/30',    text: 'text-purple-700 dark:text-purple-400',  border: 'border-purple-200 dark:border-purple-700/50',  dot: 'bg-purple-500'   },
  'no-show':   { label: 'No asistió',   bg: 'bg-orange-50 dark:bg-orange-900/30',    text: 'text-orange-700 dark:text-orange-400',  border: 'border-orange-200 dark:border-orange-700/50',  dot: 'bg-orange-400'   },
  paid:        { label: 'Pagada',       bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', dot: 'bg-emerald-500'  },
}
const statusCfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.reserved

const ACTIVE_STATUSES  = new Set(['scheduled', 'confirmed', 'reserved', 'accepted', 'pending', 'paid'])
const VIDEO_STATUSES   = new Set(['scheduled', 'confirmed', 'reserved', 'accepted'])

const derivedStatus = (apt) => {
  if (!ACTIVE_STATUSES.has(apt.status)) return apt.status
  const end = endTimeOf(apt)
  if (!isNaN(end) && end < new Date()) return 'completed'
  return apt.status
}

const isPastApt = (apt) => {
  if (apt.status === 'cancelled') return true
  if (apt.status === 'completed') return true
  const end = endTimeOf(apt)
  return !isNaN(end) && end < new Date()
}

const shortMonths = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const getTimeComponents = (date) => {
  const h    = date.getHours()
  const m    = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const dh   = h % 12 || 12
  return { timeStr: `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ampm }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SessionCard
───────────────────────────────────────────────────────────────────────────── */
const SessionCard = ({ appointment, index, isNext, onCancel, onJoinVideo, patientName }) => {
  const proName   = appointment.professionalName || appointment.professional?.name || 'Profesional'
  const startTime = toLocalDateObj(appointment.date, appointment.time)
  const duration  = appointment.duration || 60
  const endTime   = endTimeOf(appointment)
  const status    = derivedStatus(appointment)
  const cfg       = statusCfg(status)
  const isPast    = isPastApt(appointment)

  const { timeStr, ampm }                  = getTimeComponents(startTime)
  const { timeStr: endStr, ampm: endAmpm } = getTimeComponents(endTime)
  const timeRange = `${timeStr} – ${endStr} ${endAmpm}`

  const todayCheck = isToday(appointment.date)
  const dateLabel  = !todayCheck ? `${startTime.getDate()} ${shortMonths[startTime.getMonth()]}` : null

  const minsUntil   = isNext ? Math.round((startTime - Date.now()) / 60_000) : null
  const isImminent  = minsUntil !== null && minsUntil >= 0 && minsUntil <= 15
  const countdown   = minsUntil !== null
    ? minsUntil <= 0 ? 'Ahora'
      : minsUntil < 60 ? `${minsUntil} min`
      : `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`
    : null

  const bgClass = isNext
    ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200/80 dark:border-sky-800/50'
    : isPast
      ? 'bg-stone-50/70 dark:bg-gray-700/30 border border-stone-100 dark:border-gray-600'
      : 'bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600'

  const initials = proName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      className="min-w-0 w-full"
    >
      {isNext && (
        <div className="flex items-center gap-1.5 pl-12 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isImminent ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <span className={`text-[9px] font-bold uppercase tracking-widest ${isImminent ? 'text-emerald-600' : 'text-sky-500'}`}>
            Próxima sesión
          </span>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Timestamp */}
        <div className="w-9 shrink-0 text-right pt-2.5">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-none">{timeStr}</div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase mt-0.5">{dateLabel || ampm}</div>
        </div>

        {/* Timeline connector */}
        <div className="flex flex-col items-center pt-3 shrink-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isNext ? 'bg-sky-500' : cfg.dot}`} />
          <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600 mt-1 min-h-6" />
        </div>

        {/* Card */}
        <div className="flex-1 pb-1.5">
          <div className={`w-full ${bgClass} rounded-xl px-3 py-2.5`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm ${
                isNext ? 'bg-blue-700 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
              }`}>
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-xs leading-tight truncate ${isNext ? 'text-blue-950 dark:text-blue-100' : isPast ? 'text-stone-400 dark:text-stone-500' : 'text-gray-900 dark:text-gray-100'}`}>
                  {proName}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {isNext && countdown ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isImminent ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-sky-100 dark:bg-sky-900/30 text-blue-800 dark:text-sky-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isImminent ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    {countdown}
                  </span>
                ) : (
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                    {status !== appointment.status && status === 'completed' && (
                      <span className="ml-1 opacity-50">✓</span>
                    )}
                  </span>
                )}

                {appointment.isVideoCall && !isPast && VIDEO_STATUSES.has(appointment.status) && (
                  <button
                    type="button"
                    title="Videollamada"
                    onClick={() => onJoinVideo && onJoinVideo(appointment)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition-all shadow-sm ${
                      isImminent
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400'
                        : 'bg-white/80 dark:bg-gray-600/50 border border-gray-200 dark:border-gray-500 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 pl-10.5">
              <Clock className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="text-[9px] text-gray-400 dark:text-gray-500">{timeRange}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500">{duration} min</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 pl-10.5 flex-wrap">
              {appointment.reason && (
                <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[60%]" title={appointment.reason}>
                  {appointment.reason}
                </span>
              )}
              {!isPast && ACTIVE_STATUSES.has(appointment.status) && (
                <button
                  onClick={() => onCancel && onCancel(appointment.id || appointment._id)}
                  className="ml-auto text-[9px] font-medium text-red-400 hover:text-red-600 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────────────────────── */
const SessionCardSkeleton = ({ index }) => {
  const isFirst = index === 0
  return (
    <div className="flex items-start gap-2 animate-pulse" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="w-9 shrink-0 text-right pt-2.5 space-y-1">
        <div className="w-8 h-3 bg-gray-200 dark:bg-gray-600 rounded ml-auto" />
        <div className="w-5 h-2 bg-gray-100 dark:bg-gray-700 rounded ml-auto" />
      </div>
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isFirst ? 'bg-sky-200 dark:bg-sky-800' : 'bg-gray-200 dark:bg-gray-600'}`} />
        <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700 mt-1 min-h-10" />
      </div>
      <div className={`flex-1 rounded-xl px-3 py-3 mb-1.5 ${isFirst ? 'bg-sky-50/60 dark:bg-sky-900/10 border border-sky-100/80 dark:border-sky-800/30' : 'bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full shrink-0 ${isFirst ? 'bg-sky-200 dark:bg-sky-800' : 'bg-gray-200 dark:bg-gray-600'}`} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
            <div className="h-2 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PatientSessionsList
───────────────────────────────────────────────────────────────────────────── */
const PatientSessionsList = ({ onRequestNew, refreshTrigger: _ignored = 0, patientName = '' }) => {
  const { appointments, loading, updateOne } = useAppointments()
  const scrollRef = useRef(null)

  const upcoming = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return appointments
      .filter(apt => {
        const start = toLocalDateObj(apt.date, apt.time)
        return !isNaN(start) && start >= todayStart && apt.status !== 'cancelled' && apt.status !== 'completed'
      })
      .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))
  }, [appointments])

  const nextTimestamp = upcoming[0] ? toLocalDateObj(upcoming[0].date, upcoming[0].time).getTime() : null

  const handleCancel = async (appointmentId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    const original = appointments.find(a => (a.id || a._id) === appointmentId)
    updateOne(appointmentId, { status: 'cancelled' })
    try {
      await appointmentsService.cancel(appointmentId, 'Cancelado por el paciente')
      showToast('Cita cancelada exitosamente', 'success')
    } catch {
      if (original) updateOne(appointmentId, { status: original.status })
      showToast('No se pudo cancelar la cita. Intenta de nuevo.', 'error')
    }
  }

  const handleJoinVideo = (apt) => {
    const id = apt.id || apt._id
    window.location.href = `/video/join/${id}?name=${encodeURIComponent(patientName)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.10 }}
      className="bg-white dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-stone-900 dark:text-white">Mis Sesiones</p>
          {!loading && upcoming.length > 0 && (
            <span className="text-[10px] font-bold text-stone-400 dark:text-gray-400 bg-stone-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </div>
        {onRequestNew && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRequestNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-3 h-3" />
            Nueva cita
          </motion.button>
        )}
      </div>

      {/* Sessions list */}
      <div ref={scrollRef} className="px-4 py-3 overflow-y-auto max-h-125 custom-scrollbar">
        {loading ? (
          <div className="space-y-0">
            {[0, 1, 2, 3].map(i => <SessionCardSkeleton key={i} index={i} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-stone-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-stone-300 dark:text-gray-600" />
            </div>
            <p className="text-stone-500 dark:text-gray-400 font-medium mb-1 text-sm">Sin citas próximas</p>
            <p className="text-xs text-stone-400 dark:text-gray-500">¡Solicita una nueva sesión!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-0">
              {upcoming.map((apt, index) => {
                const aptTs  = toLocalDateObj(apt.date, apt.time).getTime()
                const isNext = nextTimestamp !== null && aptTs === nextTimestamp
                return (
                  <SessionCard
                    key={apt._id || apt.id || index}
                    appointment={apt}
                    index={index}
                    isNext={isNext}
                    onCancel={handleCancel}
                    onJoinVideo={handleJoinVideo}
                    patientName={patientName}
                  />
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

export default PatientSessionsList
