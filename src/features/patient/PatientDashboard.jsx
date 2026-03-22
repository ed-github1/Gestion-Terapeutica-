import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, CalendarPlus, Calendar, CalendarCheck, CheckCircle2, Clock, Moon, Sun } from 'lucide-react'
import { useDarkModeContext } from '@shared/DarkModeContext'
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
import { patientsService, resolveLinkedProfessional } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { normalizeAppointmentsResponse, toLocalDateObj } from '@shared/utils/appointments'
import { VideoCallNotificationManager } from '@shared/ui'

/**
 * PatientDashboard — minimal, clean layout.
 * Core features: diary, appointments, real-time appointment notifications.
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const { dark, toggleDark } = useDarkModeContext()
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
  const [loading, setLoading] = useState(true)
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
    if (lastBooking > 0) loadDashboardData()
  }, [lastBooking]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDashboardData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadDashboardData = async () => {
    try {
      const { professionalId: pid, professionalUserId: puid } = await resolveLinkedProfessional(user)
      if (pid)  setProfessionalId(pid)
      if (puid) _setProUserId(puid)

      const response = await appointmentsService.getPatientAppointments()
      const all      = normalizeAppointmentsResponse(response)

      // Last-ditch: extract professionalUserId from any appointment that has it
      if (!puid) {
        const aptWithPro = all.find(a => a.professionalUserId)
        if (aptWithPro?.professionalUserId) _setProUserId(aptWithPro.professionalUserId)
      }

      const now      = new Date()

      const upcoming = all
        .filter(a => toLocalDateObj(a.date, a.time) > now && a.status !== 'cancelled')
        .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))

      setNextAppointment(upcoming[0] || null)
      setStats({
        total:     all.filter(a => a.status !== 'cancelled').length,
        upcoming:  upcoming.length,
        completed: all.filter(a => a.status === 'completed').length,
        pending:   all.filter(a => a.status === 'reserved').length,
      })
    } catch {
      const stored   = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      const now      = new Date()
      const upcoming = stored.filter(a => new Date(a.date) > now && a.status !== 'cancelled')
      setNextAppointment(upcoming[0] || null)
      setStats({
        total:     stored.filter(a => a.status !== 'cancelled').length,
        upcoming:  upcoming.length,
        completed: stored.filter(a => a.status === 'completed').length,
        pending:   stored.filter(a => a.status === 'reserved').length,
      })
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
    // Dismiss the patient-created appointment so polling never surfaces it
    // in the AppointmentAcceptanceModal (which is for professional-initiated ones).
    _markDismissed(data)
    addPatientAlert('request-pending', data, 'Tu solicitud fue enviada al profesional.')
    loadDashboardData()
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
    loadDashboardData()
  }

  const handlePaymentSuccess = (apt) => {
    _markDismissed(apt)
    setAppointmentToPay(null)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    addPatientAlert('appointment-paid', apt, 'Pago completado. ¡Tu cita está confirmada!')
    loadDashboardData()
  }

  return (
    <div className="min-h-full bg-transparent">
      <div className="min-h-full">

        {/* ── Main ── */}
        <div className="p-2 md:p-3 lg:p-4 flex flex-col gap-3">

          {/* Header — full width */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0075C9] flex items-center justify-center text-white font-bold text-xs shadow-sm select-none shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize leading-none mb-0.5">{fmtDate(currentTime)}</p>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {greeting()}, <span className="text-[#0075C9]">{userName}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
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
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 shadow-sm hover:border-stone-300 dark:hover:border-gray-600 transition-colors"
                aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {dark
                  ? <Sun size={16} className="text-gray-200" />
                  : <Moon size={16} className="text-gray-500" />}
              </button>
              <button
                onClick={loadDashboardData}
                title="Actualizar"
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAppointmentRequest(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0075C9] text-white rounded-xl text-xs font-semibold hover:bg-[#005fa0] transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva cita</span>
              </button>
            </div>
          </motion.div>

          {/* KPI stats — same card-grid design as professional dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-2 py-2 shadow-sm grid grid-cols-4 gap-2 overflow-hidden"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 animate-pulse flex flex-col gap-1.5">
                  <div className="h-2.5 w-full max-w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              ))
            ) : (
              [
                { value: stats.total,     label: 'Total',       Icon: Calendar,      iconColor: 'text-sky-400',     trend: null,    trendPos: false },
                { value: stats.upcoming,  label: 'Próximas',    Icon: CalendarCheck, iconColor: 'text-[#0075C9]',   trend: null,    trendPos: false },
                { value: stats.completed, label: 'Completadas', Icon: CheckCircle2,  iconColor: 'text-emerald-400', trend: null,    trendPos: false },
                { value: stats.pending,   label: 'Pendientes',  Icon: Clock,         iconColor: 'text-amber-400',   trend: null,    trendPos: false },
              ].map(({ value, label, Icon, iconColor, trend, trendPos }) => (
                <div key={label} className="min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 flex flex-col gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <Icon size={12} className={`shrink-0 ${iconColor}`} strokeWidth={2.5} />
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase truncate">{label}</span>
                    </div>
                    {trend != null && (
                      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        trendPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {trendPos ? '↑' : '↓'}{Math.abs(trend)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[22px] font-black text-gray-900 dark:text-white leading-none tabular-nums tracking-tight truncate">{value}</span>
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
                <div className="bg-white dark:bg-gray-800 border border-stone-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-stone-400 dark:text-gray-500 uppercase tracking-wide mb-3">
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
                          <span className="text-xs text-stone-700 dark:text-gray-300 font-medium flex-1">
                            {n.emoji}&nbsp;{n.title}
                            {date && <span className="text-stone-400 dark:text-gray-500 ml-2">{date}</span>}
                          </span>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-stone-300 dark:text-gray-600 hover:text-stone-500 dark:hover:text-gray-400 transition-colors shrink-0"
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
                      <p className="text-[11px] text-stone-400 dark:text-gray-500 pl-5">
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
