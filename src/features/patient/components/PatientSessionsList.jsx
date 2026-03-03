import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, Video, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { normalizeAppointmentsResponse, toLocalDateObj, isToday } from '@shared/utils/appointments'
import { showToast } from '@components'

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmada',  bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  scheduled:  { label: 'Programada',  bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  completed:  { label: 'Completada',  bg: 'bg-stone-50',    text: 'text-stone-500',   border: 'border-stone-200',   dot: 'bg-stone-400'   },
  pending:    { label: 'Pendiente',   bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  reserved:   { label: 'Reservada',   bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  accepted:   { label: 'Aceptada',    bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelada',   bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-400'     },
}
const statusCfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending

const getTimeComponents = (date) => {
  const h   = date.getHours()
  const m   = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const dh   = h % 12 || 12
  return { timeStr: `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ampm }
}

const shortMonths = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

/* ─────────────────────────────────────────────────────────────────────────────
   SessionCard — timeline pill (patient version)
───────────────────────────────────────────────────────────────────────────── */
const SessionCard = ({ appointment, index, isNext, onCancel, onJoinVideo, patientName }) => {
  const proName    = appointment.professionalName || appointment.professional?.name || 'Profesional'
  const startTime  = toLocalDateObj(appointment.date, appointment.time)
  const duration   = appointment.duration || 60
  const endTime    = new Date(startTime.getTime() + duration * 60 * 1000)
  const cfg        = statusCfg(appointment.status)
  const isPast     = startTime < new Date()

  const { timeStr, ampm }               = getTimeComponents(startTime)
  const { timeStr: endStr, ampm: endAmpm } = getTimeComponents(endTime)
  const timeRange = `${timeStr} – ${endStr} ${endAmpm}`

  const todayCheck = isToday(appointment.date)
  const dateLabel  = !todayCheck
    ? `${startTime.getDate()} ${shortMonths[startTime.getMonth()]}`
    : null

  // Countdown for next appointment
  const minsUntil = isNext ? Math.round((startTime - Date.now()) / 60_000) : null
  const isImminent = minsUntil !== null && minsUntil >= 0 && minsUntil <= 15
  const countdown  = minsUntil !== null
    ? minsUntil <= 0 ? 'Ahora'
      : minsUntil < 60 ? `${minsUntil} min`
      : `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`
    : null

  const bgClass = isNext
    ? 'bg-sky-50 border border-sky-200/80'
    : isPast
      ? 'bg-stone-50/70 border border-stone-100'
      : 'bg-white border border-gray-100'

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
        {/* Time stamp */}
        <div className="w-9 shrink-0 text-right pt-2.5">
          <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
          <div className="text-[9px] text-gray-400 uppercase mt-0.5">{dateLabel || ampm}</div>
        </div>

        {/* Timeline connector */}
        <div className="flex flex-col items-center pt-3 shrink-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isNext ? 'bg-sky-500' : cfg.dot}`} />
          <div className="w-px flex-1 bg-gray-200 mt-1 min-h-6" />
        </div>

        {/* Card */}
        <div className="flex-1 pb-1.5">
          <div className={`w-full ${bgClass} rounded-xl px-3 py-2.5`}>
            {/* Row 1: Avatar + name + badges + actions */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm ${
                isNext ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-xs leading-tight truncate ${isNext ? 'text-blue-950' : isPast ? 'text-stone-400' : 'text-gray-900'}`}>
                  {proName}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {isNext && countdown ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isImminent ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-blue-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isImminent ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    {countdown}
                  </span>
                ) : (
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                )}

                {/* Join video button — visible when scheduled/confirmed */}
                {appointment.isVideoCall && !isPast && ['scheduled', 'confirmed'].includes(appointment.status) && (
                  <button
                    type="button"
                    title="Videollamada"
                    onClick={() => onJoinVideo && onJoinVideo(appointment)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition-all shadow-sm ${
                      isImminent
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400'
                        : 'bg-white/80 border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: time range + duration */}
            <div className="flex items-center gap-1.5 mt-1.5 pl-10.5">
              <Clock className="w-2.5 h-2.5 text-gray-400 shrink-0" />
              <span className="text-[9px] text-gray-400">{timeRange}</span>
              <span className="text-gray-300">·</span>
              <span className="text-[9px] text-gray-400">{duration} min</span>
            </div>

            {/* Row 3: reason + cancel action */}
            <div className="flex items-center gap-1.5 mt-1 pl-10.5 flex-wrap">
              {appointment.reason && (
                <span className="text-[9px] text-gray-500 truncate max-w-[60%]" title={appointment.reason}>
                  {appointment.reason}
                </span>
              )}
              {!isPast && appointment.status === 'scheduled' && (
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
   Skeletons
───────────────────────────────────────────────────────────────────────────── */
const SessionCardSkeleton = ({ index }) => {
  const isFirst = index === 0
  return (
    <div className="flex items-start gap-2 animate-pulse" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="w-9 shrink-0 text-right pt-2.5 space-y-1">
        <div className="w-8 h-3 bg-gray-200 rounded ml-auto" />
        <div className="w-5 h-2 bg-gray-100 rounded ml-auto" />
      </div>
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isFirst ? 'bg-sky-200' : 'bg-gray-200'}`} />
        <div className="w-px flex-1 bg-gray-100 mt-1 min-h-10" />
      </div>
      <div className={`flex-1 rounded-xl px-3 py-3 mb-1.5 ${isFirst ? 'bg-sky-50/60 border border-sky-100/80' : 'bg-gray-50 border border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full shrink-0 ${isFirst ? 'bg-sky-200' : 'bg-gray-200'}`} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-2 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-14 bg-gray-200 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PatientSessionsList — main component
───────────────────────────────────────────────────────────────────────────── */
const FILTERS = [
  { key: 'upcoming', label: 'Próximas'  },
  { key: 'today',    label: 'Hoy'       },
  { key: 'past',     label: 'Pasadas'   },
  { key: 'all',      label: 'Todas'     },
]

const PatientSessionsList = ({ onRequestNew, refreshTrigger = 0, patientName = '' }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('upcoming')
  const scrollRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await appointmentsService.getPatientAppointments()
      const all = normalizeAppointmentsResponse(res)
      setAppointments(all)
    } catch {
      const stored = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      setAppointments(stored)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  /* ── Filtering ── */
  const now = new Date()
  const filtered = appointments.filter((apt) => {
    if (!apt.date) return filter === 'all'
    const d = toLocalDateObj(apt.date, apt.time)
    switch (filter) {
      case 'upcoming':
        return d >= now && apt.status !== 'cancelled' && apt.status !== 'completed'
      case 'today':
        return isToday(apt.date) && apt.status !== 'cancelled'
      case 'past':
        return d < now || apt.status === 'completed'
      default:
        return true
    }
  }).sort((a, b) => {
    const da = toLocalDateObj(a.date, a.time)
    const db = toLocalDateObj(b.date, b.time)
    return filter === 'past' ? db - da : da - db
  })

  /* ── Next upcoming session detection ── */
  const nextSession = appointments
    .filter(a => toLocalDateObj(a.date, a.time) >= now && a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))[0] || null

  const nextTimestamp = nextSession ? toLocalDateObj(nextSession.date, nextSession.time).getTime() : null

  /* ── Cancel action ── */
  const handleCancel = async (appointmentId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    const rollback = [...appointments]
    setAppointments(prev => prev.map(a => (a.id || a._id) === appointmentId ? { ...a, status: 'cancelled' } : a))
    try {
      await appointmentsService.cancel(appointmentId, 'Cancelado por el paciente')
      showToast('Cita cancelada exitosamente', 'success')
    } catch {
      setAppointments(rollback)
      showToast('No se pudo cancelar la cita. Intenta de nuevo.', 'error')
    }
  }

  /* ── Join video ── */
  const handleJoinVideo = (apt) => {
    const id = apt.id || apt._id
    window.location.href = `/video/join/${id}?name=${encodeURIComponent(patientName)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.10 }}
      className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-sky-600" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-stone-900">Mis Sesiones</p>
          {!loading && (
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              {filtered.length}
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

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-5 py-3 border-b border-stone-50">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              filter === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div ref={scrollRef} className="px-4 py-3 overflow-y-auto max-h-125 custom-scrollbar">
        {loading ? (
          <div className="space-y-0">
            {[0, 1, 2, 3].map(i => <SessionCardSkeleton key={i} index={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium mb-1 text-sm">
              {filter === 'upcoming' && 'No tienes citas próximas'}
              {filter === 'today'    && 'No tienes citas para hoy'}
              {filter === 'past'     && 'No tienes citas pasadas'}
              {filter === 'all'      && 'Sin citas registradas'}
            </p>
            <p className="text-xs text-stone-400">
              {filter === 'upcoming' ? '¡Solicita una nueva sesión!' : 'Tu historial aparecerá aquí'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-0">
              {filtered.map((apt, index) => {
                const aptTs = toLocalDateObj(apt.date, apt.time).getTime()
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
