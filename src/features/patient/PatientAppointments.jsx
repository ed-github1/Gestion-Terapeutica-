import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@components'
import { appointmentsService } from '@shared/services/appointmentsService'
import {
  normalizeAppointmentsResponse,
  toLocalDateObj,
  isToday,
} from '@shared/utils/appointments'

const PatientAppointments = ({ onClose }) => {
  // Always call hooks at the top level, in a consistent order
  const { user } = useAuth()

  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [filter,       setFilter]       = useState('all') // all | upcoming | past | today

  /* ── Data loading ──────────────────────────────────────────────────────── */

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await appointmentsService.getPatientAppointments()
      const normalized = normalizeAppointmentsResponse(response)
      console.log('✅ Patient appointments loaded:', normalized.length)
      setAppointments(normalized)
    } catch (err) {
      console.error('⚠️ Failed to load appointments:', err.message)
      setError('No se pudieron cargar tus citas. Verifica tu conexión e intenta de nuevo.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  /* ── Filtering ──────────────────────────────────────────────────────────── */

  const getFilteredAppointments = () => {
    const now = new Date()
    return appointments.filter((apt) => {
      if (!apt.date) return filter === 'all'

      // Use toLocalDateObj so date-only "YYYY-MM-DD" strings are parsed as
      // LOCAL midnight, not UTC midnight (avoids off-by-one in non-UTC zones).
      const aptLocal = toLocalDateObj(apt.date, apt.time)

      switch (filter) {
        case 'upcoming':
          return aptLocal >= now && apt.status !== 'cancelled' && apt.status !== 'completed'
        case 'past':
          return aptLocal < now || apt.status === 'completed'
        case 'today':
          return isToday(apt.date) && apt.status !== 'cancelled'
        default:
          return true
      }
    })
  }

  /* ── Actions ─────────────────────────────────────────────────────────────── */

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

    // Optimistic update
    const rollback = [...appointments]
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
      )
    )

    try {
      await appointmentsService.cancel(appointmentId, 'Cancelado por el paciente')
      showToast('✅ Cita cancelada exitosamente', 'success')
    } catch (err) {
      // Revert optimistic update on failure
      setAppointments(rollback)
      console.error('Cancel failed:', err.message)
      showToast('No se pudo cancelar la cita. Intenta de nuevo.', 'error')
    }
  }

  /* ── Display helpers ─────────────────────────────────────────────────────── */

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { color: 'bg-green-100 text-green-700',  text: '✓ Programada' },
      reserved:  { color: 'bg-yellow-100 text-yellow-700', text: '○ Reservada' },
      completed: { color: 'bg-blue-100 text-blue-700',    text: '✓ Completada' },
      cancelled: { color: 'bg-red-100 text-red-700',      text: '✗ Cancelada'  },
      pending:   { color: 'bg-gray-100 text-gray-600',    text: '… Pendiente'  },
    }
    return badges[status] ?? badges.scheduled
  }

  const getTypeLabel = (type) => {
    const types = {
      consultation: { label: 'Consulta General', icon: '🩺' },
      followup:     { label: 'Seguimiento',       icon: '🔄' },
      therapy:      { label: 'Terapia',           icon: '💆' },
      emergency:    { label: 'Urgencia',          icon: '🚨' },
    }
    return types[type] ?? types.consultation
  }

  const patientDisplayName = (() => {
    if (!user) return 'Paciente'
    const name = [
      user.firstName ?? user.nombre,
      user.lastName  ?? user.apellido,
    ].filter(Boolean).join(' ')
    return name || user.name || user.email || 'Paciente'
  })()

  const filteredAppointments = getFilteredAppointments()

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-sky-400 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mis Citas</h2>
              <p className="text-blue-100 mt-1">Gestiona tus citas médicas</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { key: 'all',      label: `Todas (${appointments.length})` },
              { key: 'today',    label: 'Hoy' },
              { key: 'upcoming', label: 'Próximas' },
              { key: 'past',     label: 'Pasadas' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                  filter === key
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1">{error}</span>
                <button
                  onClick={loadAppointments}
                  className="text-red-600 font-semibold hover:underline whitespace-nowrap"
                >
                  Reintentar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                <p className="text-gray-600">Cargando citas...</p>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin citas</h3>
              <p className="text-gray-500 text-sm">
                {filter === 'upcoming' && 'No tienes citas próximas programadas.'}
                {filter === 'past'     && 'No tienes citas pasadas.'}
                {filter === 'today'    && 'No tienes citas para hoy.'}
                {filter === 'all'      && 'Aún no tienes citas registradas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status  = getStatusBadge(appointment.status)
                const type    = getTypeLabel(appointment.type)
                const aptDate = toLocalDateObj(appointment.date, appointment.time)
                const id      = appointment.id

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl" aria-hidden>{type.icon}</span>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{type.label}</h3>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          {/* Date */}
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {aptDate.toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year:    'numeric',
                                month:   'long',
                                day:     'numeric',
                              })}
                            </span>
                          </div>

                          {/* Time + duration */}
                          {appointment.time && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{appointment.time} · {appointment.duration} min</span>
                            </div>
                          )}

                          {/* Professional name */}
                          {appointment.professionalName && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{appointment.professionalName}</span>
                            </div>
                          )}

                          {/* Reason */}
                          {appointment.reason && (
                            <div className="flex items-start gap-2 text-gray-600 mt-2 pt-2 border-t border-gray-100">
                              <svg className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span className="font-medium text-gray-700">Motivo: </span>
                                {appointment.reason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => cancelAppointment(id)}
                            className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                          >
                            Cancelar
                          </button>
                        )}
                        {appointment.isVideoCall && appointment.status === 'scheduled' && (
                          <button
                            onClick={() => {
                              window.location.href = `/video/join/${id}?name=${encodeURIComponent(patientDisplayName)}`
                            }}
                            className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                          >
                            Videollamada
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientAppointments