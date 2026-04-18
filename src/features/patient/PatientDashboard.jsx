import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, CalendarPlus, Calendar, Moon, Sun, Video } from 'lucide-react'
import { useDarkModeContext } from '@shared/DarkModeContext'
import AppointmentRequest from './AppointmentRequest'
import NotificationCenter from './components/NotificationCenter'
import PatientSessionsList from './components/PatientSessionsList'
import CrisisButton from './components/CrisisButton'
import DiaryWidget from './components/DiaryWidget'
import GoalsTracker from './components/GoalsTracker'
import HomeworkWidget from './components/HomeworkWidget'
import AppointmentAcceptanceModal from './components/AppointmentAcceptanceModal'
import AppointmentPaymentModal from './components/AppointmentPaymentModal'
import { useAppointmentNotifications } from './hooks/useAppointmentNotifications'
import { appointmentsService } from '@shared/services/appointmentsService'
import { notificationsService } from '@shared/services/notificationsService'
import { patientsService, resolveLinkedProfessional } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { normalizeAppointmentsResponse, toLocalDateObj, endTimeOf } from '@shared/utils/appointments'
import { useAppointments } from './AppointmentsContext'
import { VideoCallNotificationManager } from '@shared/ui'

/**
 * PatientDashboard — minimal, clean layout.
 * Core features: diary, appointments, real-time appointment notifications.
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const { dark, toggleDark } = useDarkModeContext()
  const navigate = useNavigate()
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
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, pending: 0 })
  const { appointments: allAppointments, loading, refresh: refreshAppointments } = useAppointments()
  const [professionalId, setProfessionalId] = useState(null)       // profile ID
  const [professionalUserId, setProfessionalUserId] = useState(     // user account ID (for socket routing)
    () => localStorage.getItem('_linkedProUserId') || null
  )

  // Helper — set state AND keep localStorage in sync
  const _setProUserId = (uid) => {
    if (uid) {
      setProfessionalUserId(uid)
      localStorage.setItem('_linkedProUserId', uid)
    }
  }

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
    if (lastBooking > 0) refreshAppointments()
  }, [lastBooking]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDashboardData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive nextAppointment, stats, and professionalUserId whenever the
  // shared appointment list updates.  No redundant API call needed.
  useEffect(() => {
    const now      = new Date()
    // Use endTimeOf so an in-progress appointment (started but not finished)
    // still shows in the "Hoy" card instead of silently disappearing.
    const upcoming = allAppointments
      .filter(a => endTimeOf(a) > now && a.status !== 'cancelled')
      .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))
    setNextAppointment(upcoming[0] || null)
    setStats({
      total:     allAppointments.filter(a => a.status !== 'cancelled').length,
      upcoming:  upcoming.length,
      completed: allAppointments.filter(a => a.status === 'completed').length,
      pending:   allAppointments.filter(a => a.status === 'reserved').length,
    })
    if (!professionalUserId) {
      const aptWithPro = allAppointments.find(a => a.professionalUserId)
      if (aptWithPro?.professionalUserId) _setProUserId(aptWithPro.professionalUserId)
    }
  }, [allAppointments]) // eslint-disable-line react-hooks/exhaustive-deps

  const appointmentToAcceptRef = useRef(appointmentToAccept)
  useEffect(() => { appointmentToAcceptRef.current = appointmentToAccept }, [appointmentToAccept])

  const appointmentToPayRef = useRef(appointmentToPay)
  useEffect(() => { appointmentToPayRef.current = appointmentToPay }, [appointmentToPay])

  // Track which appointment IDs the patient has already seen/dismissed so the
  // 30-second polling fallback never re-opens the modal for the same appointment.
  const dismissedAptIds = useRef(new Set())

  const _markDismissed = (apt) => {
    const id = apt?._id || apt?.id || apt?.appointmentId || apt?.data?.appointmentId || apt?.data?._id || apt?.data?.id
    if (id) dismissedAptIds.current.add(String(id))
  }

  // ── Fallback check for pending appointments & unread notifications ──
  // Runs once on mount and again after a socket reconnect so the patient
  // never misses a professional-initiated appointment. No polling interval —
  // real-time socket events handle the happy path.
  const checkPendingRef = useRef(null)
  useEffect(() => {
    const checkPending = async () => {
      // Step 1: Check server-side notification inbox.
      try {
        const notifRes = await notificationsService.getUnread()
        const notifs = notifRes.data?.data || notifRes.data || []
        const pendingNotif = Array.isArray(notifs)
          ? notifs.find(n => {
              if (n.type !== 'appointment-pending') return false
              const id = n.data?.appointmentId || n.data?._id || n._id
              return id ? !dismissedAptIds.current.has(String(id)) : true
            })
          : null
        if (pendingNotif && !appointmentToAcceptRef.current && !appointmentToPayRef.current) {
          setAppointmentToAccept(pendingNotif.data || pendingNotif)
          const notifId = pendingNotif._id || pendingNotif.id
          if (notifId) notificationsService.markRead(notifId).catch(() => {})
          return
        }
      } catch { /* notifications endpoint may not exist — fall through to step 2 */ }

      // Step 2: Fallback — look for professional-created reserved/pending appointments.
      try {
        const res = await appointmentsService.getPatientAppointments()
        const all = normalizeAppointmentsResponse(res)
        const pending = all.find(a => {
          if (a.status !== 'reserved' && a.status !== 'pending') return false
          // Only surface appointments the professional created, not patient self-bookings.
          if (a.createdBy === 'patient') return false
          const id = a._id || a.id
          return id ? !dismissedAptIds.current.has(String(id)) : true
        })
        if (pending && !appointmentToAcceptRef.current && !appointmentToPayRef.current) {
          setAppointmentToAccept(pending)
          if (pending.professionalUserId) _setProUserId(pending.professionalUserId)
        }
      } catch { /* silent — check is best-effort */ }
    }

    checkPendingRef.current = checkPending

    // Run once on mount
    checkPending()

    // Re-run whenever the socket reconnects (covers tab reopen / network blip)
    const unsubReconnect = socketNotificationService.on('reconnect', checkPending)
    return () => unsubReconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resolves the linked professional's IDs and triggers a shared appointment
  // refresh.  Appointment data is derived reactively from the context in the
  // useEffect above — no direct getPatientAppointments() call needed here.
  const loadDashboardData = async () => {
    try {
      const { professionalId: pid, professionalUserId: puid } = await resolveLinkedProfessional(user)
      if (pid)  setProfessionalId(pid)
      if (puid) _setProUserId(puid)
    } catch {}
    refreshAppointments()
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
    // Dismiss the patient-created appointment so polling never surfaces it
    // in the AppointmentAcceptanceModal (which is for professional-initiated ones).
    _markDismissed(data)
    addPatientAlert('request-pending', data, 'Tu solicitud fue enviada al profesional.')
    refreshAppointments()
  }

  // When a pending appointment arrives via socket, show acceptance modal
  useEffect(() => {
    if (pendingAppointment) {
      setAppointmentToAccept(pendingAppointment)
      // Cache the professional's user account ID from the socket payload
      const uid = pendingAppointment?.professionalUserId || pendingAppointment?.data?.professionalUserId
      if (uid) _setProUserId(uid)
    }
  }, [pendingAppointment])

  const handleAppointmentAccepted = (apt) => {
    _markDismissed(apt)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    // Show payment modal
    setAppointmentToPay(apt)
    addPatientAlert('appointment-confirmed', apt, 'Has aceptado la cita. Procede al pago.')
  }

  const handleAppointmentRejected = (apt) => {
    _markDismissed(apt)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    refreshAppointments()
  }

  const handlePaymentSuccess = (apt) => {
    _markDismissed(apt)
    setAppointmentToPay(null)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    addPatientAlert('appointment-paid', apt, 'Pago completado. ¡Tu cita está confirmada!')
    refreshAppointments()
  }

  // Minutes until next appointment — powers the auto-Join button
  const minutesToNext = () => {
    if (!nextAppointment) return Infinity
    return Math.floor((toLocalDateObj(nextAppointment.date, nextAppointment.time) - new Date()) / 60_000)
  }
  const canJoinNow = () => {
    const m = minutesToNext()
    return m <= 15 && m >= -30 // joinable 15m before → 30m after start
  }

  const handleJoinSession = () => {
    const id = nextAppointment?._id || nextAppointment?.id
    if (id) navigate(`/dashboard/patient/video-call/${id}`)
    else navigate('/dashboard/patient/appointments')
  }

  return (
  
    <div className="min-h-full bg-transparent pb-24 md:pb-6">

      {/* ── Mobile-first layout (single column) → md two columns ── */}
      <div className="p-3 md:p-5 lg:p-6 flex flex-col gap-4 max-w-5xl mx-auto">

        {/* ─── Compact header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-4 py-3.5 flex items-center gap-3.5 border border-gray-200/60 dark:border-gray-700/50 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#0075C9] flex items-center justify-center text-white font-bold text-sm shadow-md select-none shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight truncate">{fullName}</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize leading-none mt-0.5">{fmtDate(currentTime)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationCenter
              notifications={notifications}
              onDismiss={dismissNotification}
              onDismissAll={dismissAllNotifications}
              onAction={(action, data) => {
                if (action === 'accept') setAppointmentToAccept(data)
              }}
            />
            <button
              onClick={toggleDark}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {dark
                ? <Sun size={15} className="text-gray-500 dark:text-gray-300" />
                : <Moon size={15} className="text-gray-500 dark:text-gray-400" />}
            </button>
            <button
              onClick={loadDashboardData}
              title="Actualizar"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-gray-500 dark:text-gray-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* ─── HERO: Next Session — always above the fold ─── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm bg-white dark:bg-gray-800/70"
        >
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 border-t-sky-500 animate-spin" />
            </div>
          ) : nextAppointment ? (
            <div className="bg-linear-to-br from-[#0075C9] to-[#54C0E8] text-white p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    Próxima sesión · {nextApptLabel()}
                  </p>
                  <h2 className="text-lg md:text-xl font-bold truncate mt-1">
                    {nextAppointment.professionalName || 'Tu profesional'}
                  </h2>
                  <p className="text-sm text-white/90 mt-0.5">
                    {new Date(nextAppointment.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    &nbsp;·&nbsp;
                    {nextAppointment.time || new Date(nextAppointment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {canJoinNow() ? (
                  <button
                    onClick={handleJoinSession}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0075C9] rounded-xl font-bold text-sm hover:bg-white/90 transition shadow-md"
                  >
                    <Video className="w-4 h-4" />
                    Unirse a la sesión
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/dashboard/patient/appointments')}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold text-sm transition"
                  >
                    Ver detalles
                  </button>
                )}
                <button
                  onClick={() => setShowAppointmentRequest(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs transition border border-white/20"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Nueva cita
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Sin sesiones programadas</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Agenda tu próxima sesión y continúa tu proceso terapéutico.
              </p>
              <button
                onClick={() => setShowAppointmentRequest(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#0075C9] to-[#54C0E8] text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md"
              >
                <CalendarPlus className="w-4 h-4" />
                Agendar cita
              </button>
            </div>
          )}
        </motion.section>

        {/* ─── Responsive grid: mobile = single stack (priority order) · md+ = 2 columns ─── */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-5 md:gap-5 md:items-start">

          {/* Diary — Priority #2 on mobile (mood + journal in one), right column on md+ */}
          <div className="order-1 md:order-2 md:col-span-2 flex flex-col gap-4">
            <DiaryWidget />
            <GoalsTracker />

            {/* Recent activity — secondary, bottom of right column */}
            <AnimatePresence>
              {notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
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
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1">
                              {n.emoji}&nbsp;{n.title}
                              {date && <span className="text-gray-400 dark:text-gray-500 ml-2">{date}</span>}
                            </span>
                            <button
                              onClick={() => dismissNotification(n.id)}
                              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors shrink-0"
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
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-5">
                          +{notifications.length - 3} más en notificaciones
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main column — Homework → Sessions */}
          <div className="order-2 md:order-1 md:col-span-3 flex flex-col gap-4">
            <HomeworkWidget />
            <PatientSessionsList
              onRequestNew={() => setShowAppointmentRequest(true)}
              patientName={fullName}
            />
          </div>
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
            professionalUserId={professionalUserId}
            onSuccess={handleAppointmentRequestSuccess}
            onPatientCreated={(id) => { if (id) dismissedAptIds.current.add(id) }}
          />
        )}

        {appointmentToAccept && (
          <AppointmentAcceptanceModal
            appointment={appointmentToAccept}
            professionalUserId={professionalUserId}
            onClose={() => { _markDismissed(appointmentToAccept); setAppointmentToAccept(null); clearPendingAppointment() }}
            onAccepted={handleAppointmentAccepted}
            onRejected={handleAppointmentRejected}
          />
        )}

        {appointmentToPay && (
          <AppointmentPaymentModal
            appointment={appointmentToPay}
            onClose={() => setAppointmentToPay(null)}
            onPaymentSuccess={handlePaymentSuccess}
            professionalUserId={professionalUserId}
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
