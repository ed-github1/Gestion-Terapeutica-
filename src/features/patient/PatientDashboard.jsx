import React, { useState, useEffect } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import AppointmentRequest from './AppointmentRequest'
import NotificationCenter from './components/NotificationCenter'
import PatientSessionsList from './components/PatientSessionsList'
import CrisisButton from './components/CrisisButton'
import DiaryWidget from './components/DiaryWidget'
import AppointmentAcceptanceModal from './components/AppointmentAcceptanceModal'
import AppointmentPaymentModal from './components/AppointmentPaymentModal'
import { useAppointmentNotifications } from './hooks/useAppointmentNotifications'
import { appointmentsService } from '@shared/services/appointmentsService'
import { notificationsService } from '@shared/services/notificationsService'
import { patientsService } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import { normalizeAppointmentsResponse, toLocalDateObj } from '@shared/utils/appointments'
import { VideoCallNotificationManager } from '@components'

/**
 * PatientDashboard — minimal, clean layout.
 * Core features: diary, appointments, real-time appointment notifications.
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAppointmentRequest, setShowAppointmentRequest] = useState(false)
  const [nextAppointment, setNextAppointment] = useState(null)
  const [appointmentToAccept, setAppointmentToAccept] = useState(null)
  const [appointmentToPay, setAppointmentToPay] = useState(null)
  const {
    alerts: notifications,
    dismiss: dismissNotification,
    dismissAll: dismissAllNotifications,
    lastBooking,
    addPatientAlert,
    pendingAppointment,
    clearPendingAppointment,
  } = useAppointmentNotifications()
  const [stats, setStats] = useState({ upcoming: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [professionalId, setProfessionalId] = useState(null)

  // Names / initials
  const userName = user?.name?.split(' ')[0] || user?.nombre || 'Paciente'
  const fullName  = user?.name || user?.nombre || 'Paciente'
  const initials  = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Clock tick (every minute is enough)
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Reload when pro books/confirms
  useEffect(() => {
    if (lastBooking > 0) loadDashboardData()
  }, [lastBooking]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDashboardData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const appointmentToAcceptRef = React.useRef(appointmentToAccept)
  useEffect(() => { appointmentToAcceptRef.current = appointmentToAccept }, [appointmentToAccept])

  // ── Polling fallback: check for pending appointments & unread notifications ──
  // Runs on mount and every 30s so the patient sees reserved appointments
  // even if the real-time socket notification was missed (offline / reopen tab).
  useEffect(() => {
    const checkPending = async () => {
      // Step 1: Check server-side notification inbox — wrapped in its own
      // try/catch so a missing/erroring notifications endpoint does NOT abort
      // the appointment-list fallback in step 2.
      try {
        const notifRes = await notificationsService.getUnread()
        const notifs = notifRes.data?.data || notifRes.data || []
        const pendingNotif = Array.isArray(notifs)
          ? notifs.find(n => n.type === 'appointment-pending' || n.type === 'appointment-booked')
          : null
        if (pendingNotif && !appointmentToAcceptRef.current) {
          addPatientAlert('appointment-pending', pendingNotif.data || pendingNotif, pendingNotif.body)
          return
        }
      } catch { /* notifications endpoint may not exist — fall through to step 2 */ }

      // Step 2: Fallback — look for reserved/pending appointments in the list
      try {
        const res = await appointmentsService.getPatientAppointments()
        const all = normalizeAppointmentsResponse(res)
        const pending = all.find(a => a.status === 'reserved' || a.status === 'pending')
        if (pending && !appointmentToAcceptRef.current) {
          setAppointmentToAccept(pending)
        }
      } catch { /* silent — polling is best-effort */ }
    }

    checkPending()
    const interval = setInterval(checkPending, 30_000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      // Resolve professionalId from multiple sources
      let pid = user?.professionalId || user?.professional_id || user?.professional?._id || null
      if (!pid) {
        try {
          const res = await patientsService.getMyProfile()
          const p   = res.data?.data || res.data
          pid = p?.professionalId || p?.professional_id || p?.professional?._id || p?.professional?.id || null
        } catch { /* continue */ }
      }
      if (!pid) {
        try {
          const res = await patientsService.getMyProfessional()
          const p   = res.data?.data || res.data
          pid = p?._id || p?.id || null
        } catch { /* continue */ }
      }
      if (!pid) {
        try {
          const res  = await invitationsService.getAll()
          const list = res.data?.data || res.data || []
          const acc  = Array.isArray(list)
            ? list.find(i => i.status === 'accepted' || i.status === 'completed' || i.professionalId)
            : null
          pid = acc?.professionalId || acc?.professional_id || acc?.professional?._id || null
        } catch { /* continue */ }
      }
      if (pid) setProfessionalId(pid)

      const response = await appointmentsService.getPatientAppointments()
      const all      = normalizeAppointmentsResponse(response)
      const now      = new Date()

      const upcoming = all
        .filter(a => toLocalDateObj(a.date, a.time) > now && a.status !== 'cancelled')
        .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))

      setNextAppointment(upcoming[0] || null)
      setStats({
        upcoming:  upcoming.length,
        completed: all.filter(a => a.status === 'completed').length,
      })
    } catch {
      const stored   = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      const now      = new Date()
      const upcoming = stored.filter(a => new Date(a.date) > now && a.status !== 'cancelled')
      setNextAppointment(upcoming[0] || null)
      setStats({ upcoming: upcoming.length, completed: stored.filter(a => a.status === 'completed').length })
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const h = currentTime.getHours()
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  }

  const fmtDate = (d) =>
    d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const nextApptLabel = () => {
    if (!nextAppointment) return null
    const diff = Math.ceil((toLocalDateObj(nextAppointment.date, nextAppointment.time) - new Date()) / 86_400_000)
    if (diff <= 0) return 'Hoy'
    if (diff === 1) return 'Mañana'
    return `En ${diff} días`
  }

  const handleAppointmentRequestSuccess = (data) => {
    setShowAppointmentRequest(false)
    addPatientAlert('request-pending', data, 'Tu solicitud fue enviada al profesional.')
    loadDashboardData()
  }

  // When a pending appointment arrives via socket, show acceptance modal
  useEffect(() => {
    if (pendingAppointment) {
      setAppointmentToAccept(pendingAppointment)
    }
  }, [pendingAppointment])

  const handleAppointmentAccepted = (apt) => {
    setAppointmentToAccept(null)
    clearPendingAppointment()
    // Show payment modal
    setAppointmentToPay(apt)
    addPatientAlert('appointment-confirmed', apt, 'Has aceptado la cita. Procede al pago.')
  }

  const handleAppointmentRejected = () => {
    setAppointmentToAccept(null)
    clearPendingAppointment()
    loadDashboardData()
  }

  const handlePaymentSuccess = (apt) => {
    setAppointmentToPay(null)
    addPatientAlert('appointment-paid', apt, 'Pago completado. ¡Tu cita está confirmada!')
    loadDashboardData()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="min-h-screen">

        {/* ── Main ── */}
        <div className="p-4 md:p-7 lg:p-9 flex flex-col gap-5">

          {/* Header — full width */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] text-stone-400 capitalize">{fmtDate(currentTime)}</p>
              <h1 className="text-xl font-bold text-stone-900 leading-tight">
                {greeting()}, <span className="text-blue-600">{userName}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter
                notifications={notifications}
                onDismiss={dismissNotification}
                onDismissAll={dismissAllNotifications}
                onAction={(action, data) => {
                  if (action === 'accept') setAppointmentToAccept(data)
                }}
              />
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm select-none">
                {initials}
              </div>
            </div>
          </motion.div>

          {/* Stats pills — full width */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="flex gap-3"
          >
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="flex-1 h-14 bg-stone-100 rounded-2xl animate-pulse" />
              ))
            ) : (
              [
                { value: stats.upcoming,  label: 'Citas próximas',       color: 'bg-blue-50 border-blue-100',       text: 'text-blue-700'    },
                { value: stats.completed, label: 'Sesiones completadas', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
              ].map(({ value, label, color, text }) => (
                <div key={label} className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border ${color}`}>
                  <span className={`text-2xl font-bold ${text}`}>{value}</span>
                  <span className="text-xs font-medium text-stone-500 leading-tight">{label}</span>
                </div>
              ))
            )}
          </motion.div>

          {/* Next appointment banner — full width, only when present */}
          <AnimatePresence mode="wait">
            {nextAppointment && (
              <motion.div
                key="next-appt"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: 0.10 }}
                className="bg-blue-600 text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/60">Próxima sesión · {nextApptLabel()}</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">
                    {nextAppointment.professionalName || 'Profesional'}&nbsp;&mdash;&nbsp;
                    {nextAppointment.time || new Date(nextAppointment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium bg-white/20 px-2.5 py-1 rounded-lg">
                  {new Date(nextAppointment.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Widgets row: Sesiones + Mi Diario side by side ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <PatientSessionsList
              onRequestNew={() => setShowAppointmentRequest(true)}
              refreshTrigger={lastBooking}
              patientName={fullName}
            />
            <DiaryWidget />
          </div>

          {/* Recent activity — full width, only when there are notifications */}
          <AnimatePresence>
            {notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                    Actividad reciente
                  </p>
                  <div className="flex flex-col gap-2">
                    {notifications.slice(0, 3).map((n) => {
                      const dotColor = {
                        blue: 'bg-blue-500', green: 'bg-green-500',
                        red: 'bg-red-500',   amber: 'bg-amber-500',
                      }[n.color] || 'bg-blue-500'
                      const date = n.data?.date
                        ? new Date(n.data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                        : null
                      return (
                        <div key={n.id} className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <span className="text-xs text-stone-700 font-medium flex-1">
                            {n.emoji}&nbsp;{n.title}
                            {date && <span className="text-stone-400 ml-2">{date}</span>}
                          </span>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-stone-300 hover:text-stone-500 transition-colors shrink-0"
                            aria-label="Descartar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                    {notifications.length > 3 && (
                      <p className="text-[11px] text-stone-400 pl-5">
                        +{notifications.length - 3} más en notificaciones
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAppointmentRequest && (
          <AppointmentRequest
            onClose={() => setShowAppointmentRequest(false)}
            professionalId={
              professionalId ||
              user?.professionalId ||
              user?.professional_id ||
              user?.professional?._id ||
              null
            }
            onSuccess={handleAppointmentRequestSuccess}
          />
        )}

        {appointmentToAccept && (
          <AppointmentAcceptanceModal
            appointment={appointmentToAccept}
            onClose={() => { setAppointmentToAccept(null); clearPendingAppointment() }}
            onAccepted={handleAppointmentAccepted}
            onRejected={handleAppointmentRejected}
          />
        )}

        {appointmentToPay && (
          <AppointmentPaymentModal
            appointment={appointmentToPay}
            onClose={() => setAppointmentToPay(null)}
            onPaymentSuccess={handlePaymentSuccess}
            professionalId={
              appointmentToPay?.professionalId ||
              appointmentToPay?.professional_id ||
              professionalId ||
              user?.professionalId ||
              null
            }
          />
        )}
      </AnimatePresence>

      <VideoCallNotificationManager />
      <CrisisButton />
    </div>
  )
}

export default PatientDashboard
