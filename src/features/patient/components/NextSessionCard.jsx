import React from 'react'
import { motion } from 'motion/react'
import { Calendar, CalendarPlus, Video } from 'lucide-react'
import { toLocalDateObj } from '@shared/utils/appointments'

// ── Helpers ──────────────────────────────────────────────────────────────────

const minutesToNext = (appointment) => {
  if (!appointment) return Infinity
  return Math.floor((toLocalDateObj(appointment.date, appointment.time) - new Date()) / 60_000)
}

const nextApptLabel = (appointment) => {
  if (!appointment) return null
  const diff = Math.ceil((toLocalDateObj(appointment.date, appointment.time) - new Date()) / 86_400_000)
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `En ${diff} días`
}

const aptTimeLabel = (appointment) => {
  if (!appointment) return ''
  const d = toLocalDateObj(appointment.date, appointment.time)
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

const aptDateLabel = (appointment) => {
  if (!appointment) return ''
  const d = toLocalDateObj(appointment.date, appointment.time)
  const wd = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const mo = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)}, ${d.getDate()} ${mo}`
}

const countdown = (appointment) => {
  const mins = minutesToNext(appointment)
  if (!isFinite(mins) || mins < 0) return 'En curso'
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const sessionTypeLabel = (appointment) => {
  const t = appointment?.type || appointment?.modality || appointment?.sessionType
  if (!t) return 'Video'
  return { video: 'Video', presencial: 'Presencial', phone: 'Teléfono', in_person: 'Presencial' }[t.toLowerCase()] || t
}

const profInitials = (appointment) =>
  appointment?.professionalName
    ? appointment.professionalName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

const countdownProgress = (appointment) => {
  const mins = minutesToNext(appointment)
  if (!isFinite(mins) || mins <= 0) return 100
  return Math.max(2, Math.round((1 - Math.min(mins, 2880) / 2880) * 100))
}

// ── Component ─────────────────────────────────────────────────────────────────

const INFO_FIELDS = (apt) => [
  { label: 'Fecha', value: aptDateLabel(apt), accent: false },
  { label: 'Duración', value: `${apt.duration || 50} min`, accent: true },
  { label: 'Tipo', value: sessionTypeLabel(apt), accent: false },
]

const NextSessionCard = ({ appointment, loading, onJoin, onRequestNew, onViewAppointments }) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 }}
    className="relative overflow-hidden rounded-2xl shadow-sm bg-white dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60"
  >

    {loading ? (
      <div className="py-10 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-gray-500 dark:border-t-teal-400 animate-spin" />
      </div>
    ) : appointment ? (
      <>
        {/* Header: pill badge + appointment time */}
        <div className="relative flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
            <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
              Próxima sesión · {nextApptLabel(appointment)}
            </span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{aptTimeLabel(appointment)}</span>
        </div>

        {/* Professional info */}
        <div className="relative flex items-center gap-3 px-4 pb-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-sm select-none ring-2 ring-gray-300 dark:ring-gray-600">
              {profInitials(appointment)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight">
              {appointment.professionalName || 'Tu profesional'}
            </h2>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {appointment.professionalSpecialty || 'Psicología clínica'} · Sesión individual
            </p>
          </div>
          <button
            onClick={onViewAppointments}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/6 dark:hover:bg-white/12 flex items-center justify-center transition shrink-0"
          >
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Info grid — unified card with column dividers */}
        <div className="relative mx-4 mb-4 rounded-2xl bg-gray-50 dark:bg-white/6 border border-gray-100 dark:border-white/10">
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/6">
            {INFO_FIELDS(appointment).map(({ label, value, accent }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
                <p className={`text-sm font-bold mt-1 ${accent ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    ) : (
      <div className="relative p-5 md:p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <Calendar className="w-7 h-7 text-gray-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Sin sesiones programadas</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Agenda tu próxima sesión y continúa tu proceso terapéutico.
        </p>
        <button
          onClick={onRequestNew}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0075C9]  text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:opacity-95 transition"
        >
          <CalendarPlus className="w-4 h-4" />
          Agendar cita
        </button>
      </div>
    )}
  </motion.section>
)

export default NextSessionCard
