import React, { useState, useEffect } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import PatientPersonalDiary from './PatientPersonalDiary'
import AppointmentRequest from './AppointmentRequest'
import PatientAppointments from './PatientAppointments'
import PatientHomeworkView from './components/PatientHomeworkView'
import AppointmentNotificationBanner from './components/AppointmentNotificationBanner'
import MoodCheckIn from './components/MoodCheckIn'
import GoalsTracker from './components/GoalsTracker'
import SessionNotesFeed from './components/SessionNotesFeed'
import CrisisButton from './components/CrisisButton'
import { useAppointmentNotifications } from './hooks/useAppointmentNotifications'
import { appointmentsService } from '@shared/services/appointmentsService'
import { patientsService } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import { normalizeAppointmentsResponse, toLocalDateObj } from '@shared/utils/appointments'
import { VideoCallNotificationManager } from '@components'
import useVideoCallNotifications from '@shared/hooks/useVideoCallNotifications'
import ChatPanel from '@components/layout/ChatPanel'
import { Clock } from 'lucide-react'

/**
 * Patient Dashboard - Modern design matching professional dashboard
 * Designed with privacy-first principles for healthcare applications
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showDiary, setShowDiary] = useState(false)
  const [showHomework, setShowHomework] = useState(false)
  const [showAppointmentRequest, setShowAppointmentRequest] = useState(false)
  const [showAppointments, setShowAppointments] = useState(false)
  const [nextAppointment, setNextAppointment] = useState(null)
  const { simulateIncomingCall } = useVideoCallNotifications()
  const { alerts: apptAlerts, dismiss: dismissApptAlert, dismissAll: dismissAllApptAlerts, lastBooking } = useAppointmentNotifications()
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedSessions: 0,
    totalAppointments: 0,
    weekProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [professionalId, setProfessionalId] = useState(null)

  // Extract user name with fallback
  const userName = user?.name?.split(' ')[0] || user?.nombre || 'Paciente'
  const fullName = user?.name || user?.nombre || 'Patient'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    loadDashboardData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Reload appointments when professional books/confirms a new appointment
  useEffect(() => {
    if (lastBooking > 0) loadDashboardData()
  }, [lastBooking]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setError(null)

      // Fetch patient profile to get the linked professionalId
      // Try multiple sources in order of reliability
      try {
        let pid = user?.professionalId || user?.professional_id || user?.professional?._id || null
        if (pid) console.log('[PatientDashboard] professionalId from user JWT:', pid)

        if (!pid) {
          // 1. Try /patients/me
          try {
            const profileRes = await patientsService.getMyProfile()
            const profile = profileRes.data?.data || profileRes.data
            console.log('[PatientDashboard] /patients/me raw:', profile)
            pid = profile?.professionalId || profile?.professional_id ||
                  profile?.professional?._id || profile?.professional?.id ||
                  profile?.assignedProfessional || null
            console.log('[PatientDashboard] professionalId from /patients/me:', pid)
          } catch (e) { console.warn('[PatientDashboard] /patients/me failed:', e.message) }
        }

        if (!pid) {
          // 2. Try /patients/my-professional
          try {
            const profRes = await patientsService.getMyProfessional()
            const prof = profRes.data?.data || profRes.data
            console.log('[PatientDashboard] /patients/my-professional raw:', prof)
            pid = prof?._id || prof?.id || null
            console.log('[PatientDashboard] professionalId from /patients/my-professional:', pid)
          } catch (e) { console.warn('[PatientDashboard] /patients/my-professional failed:', e.message) }
        }

        if (!pid) {
          // 3. Fallback: get professionalId from the patient's accepted invitation
          try {
            const invRes = await invitationsService.getAll()
            const invitations = invRes.data?.data || invRes.data || []
            console.log('[PatientDashboard] invitations raw:', invitations)
            const accepted = Array.isArray(invitations)
              ? invitations.find(i => i.status === 'accepted' || i.status === 'completed' || i.professionalId)
              : null
            pid = accepted?.professionalId || accepted?.professional_id || accepted?.professional?._id || null
            console.log('[PatientDashboard] professionalId from invitation:', pid, '| invitation:', accepted)
          } catch (e) { console.warn('[PatientDashboard] invitations fallback failed:', e.message) }
        }

        console.log('[PatientDashboard] final professionalId:', pid)
        if (pid) setProfessionalId(pid)
      } catch (profileErr) {
        console.warn('[PatientDashboard] could not resolve professionalId:', profileErr.message)
      }

      const response = await appointmentsService.getPatientAppointments()
      // normalizeAppointmentsResponse handles all backend response shapes and
      // returns a sorted array of appointments with stable field names.
      const appointmentsArray = normalizeAppointmentsResponse(response)
      console.log('[PatientDashboard] appointments loaded:', appointmentsArray.length)

      const now = new Date()

      const upcoming = appointmentsArray
        .filter(apt => toLocalDateObj(apt.date, apt.time) > now && apt.status !== 'cancelled')
        .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0])
      }

      const completed = appointmentsArray.filter(apt => apt.status === 'completed').length
      const upcomingCount = upcoming.length

      // Week progress — use local date comparisons to avoid UTC shifts
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const weekSessions = appointmentsArray.filter(apt => {
        const d = toLocalDateObj(apt.date, apt.time)
        return d >= startOfWeek && d <= now && apt.status === 'completed'
      }).length

      setStats({
        upcomingAppointments: upcomingCount,
        completedSessions: completed,
        totalAppointments: appointmentsArray.length,
        weekProgress: Math.min((weekSessions / 2) * 100, 100) // Assuming 2 sessions per week goal
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('No se pudo cargar la información. Mostrando datos locales.')
      
      // Fallback to local storage
      const stored = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      const now = new Date()
      const upcoming = stored.filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0])
      }
      setStats({
        upcomingAppointments: upcoming.length,
        completedSessions: stored.filter(apt => apt.status === 'completed').length,
        totalAppointments: stored.length,
        weekProgress: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getNextAppointmentText = () => {
    if (!nextAppointment) return 'Sin citas programadas'

    const appointmentDate = new Date(nextAppointment.date)
    const now = new Date()
    const diffTime = appointmentDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Mañana'
    return `En ${diffDays} días`
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] min-h-screen">

        {/* ── Main content ── */}
        <div className="p-3 md:p-5 lg:p-7 overflow-y-auto flex flex-col gap-4">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-stone-400 capitalize">{formatDate(currentTime)}</p>
              <h1 className="text-lg font-bold text-stone-900 leading-tight">
                {getGreeting()}, <span className="text-blue-600">{userName}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-lg shadow-sm">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-semibold text-stone-700">{formatTime(currentTime)}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAppointmentRequest(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva Cita</span>
              </motion.button>

              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
            </div>
          </motion.div>

          {/* Appointment notifications from professional */}
          <AppointmentNotificationBanner
            alerts={apptAlerts}
            onDismiss={dismissApptAlert}
            onDismissAll={dismissAllApptAlerts}
          />

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-medium text-amber-900 flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-amber-500 hover:text-amber-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm px-2 py-3 flex items-center divide-x divide-stone-100"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 px-4 animate-pulse">
                  <div className="h-6 w-10 bg-stone-200 rounded mb-1.5 mx-auto" />
                  <div className="h-3 w-14 bg-stone-100 rounded mx-auto" />
                </div>
              ))
            ) : (
              [
                { value: stats.totalAppointments,    label: 'Total citas' },
                { value: stats.completedSessions,    label: 'Completadas' },
                { value: stats.upcomingAppointments, label: 'Próximas' },
                { value: `${Math.round(stats.weekProgress)}%`, label: 'Progreso sem.' },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 text-center px-2">
                  <div className="text-xl font-bold text-stone-900">{value}</div>
                  <div className="text-[10px] font-medium text-stone-400 mt-0.5 leading-none">{label}</div>
                </div>
              ))
            )}
          </motion.div>

          {/* Next appointment banner */}
          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="bg-blue-600 text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/60 mb-0.5">Próxima sesión · {getNextAppointmentText()}</p>
                <p className="text-sm font-bold text-white truncate">
                  {nextAppointment.professionalName || 'Profesional'} &mdash;&nbsp;
                  {nextAppointment.time || new Date(nextAppointment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="text-xs font-medium bg-white/15 px-2.5 py-1 rounded-lg">
                {new Date(nextAppointment.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
            </motion.div>
          )}

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4"
          >
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Acciones rápidas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                {
                  label: 'Agendar Cita',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                  onClick: () => setShowAppointmentRequest(true),
                  accent: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
                },
                {
                  label: 'Mis Citas',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                  onClick: () => setShowAppointments(true),
                  accent: 'text-sky-600 bg-sky-50 hover:bg-sky-100',
                },
                {
                  label: 'Mi Diario',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
                  onClick: () => setShowDiary(true),
                  accent: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
                },
                {
                  label: 'Mis Tareas',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
                  onClick: () => setShowHomework(true),
                  accent: 'text-violet-600 bg-violet-50 hover:bg-violet-100',
                },
                {
                  label: 'Videollamada',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
                  onClick: () => simulateIncomingCall('Dr. García', '1'),
                  accent: 'text-amber-600 bg-amber-50 hover:bg-amber-100',
                },
              ].map(({ label, icon, onClick, accent }) => (
                <motion.button
                  key={label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClick}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${accent}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                  <span className="text-xs font-semibold text-center leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Week progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-500">Progreso semanal</p>
              <span className="text-xs font-bold text-stone-700">{Math.round(stats.weekProgress)}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.weekProgress}%` }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              {stats.completedSessions} sesiones completadas · meta: 2 por semana
            </p>
          </motion.div>

          {/* Daily mood check-in */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <MoodCheckIn />
          </motion.div>

          {/* Therapeutic goals + session notes (2-col on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <GoalsTracker />
            <SessionNotesFeed />
          </motion.div>
        </div>

        {/* ── Right panel: profile + chat ── */}
        <div className="bg-white border-l border-stone-200 flex flex-col">
          {/* Compact profile header */}
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{fullName}</p>
              <p className="text-xs text-stone-400">Paciente</p>
            </div>
            {nextAppointment && (
              <div className="ml-auto text-right shrink-0">
                <p className="text-[10px] text-stone-400 font-medium">Próxima</p>
                <p className="text-xs font-bold text-blue-600">{getNextAppointmentText()}</p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel userRole="patient" />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDiary && (
          <PatientPersonalDiary onClose={() => setShowDiary(false)} />
        )}

        {showHomework && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHomework(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Mis Tareas Terapéuticas</h2>
                <button
                  onClick={() => setShowHomework(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <PatientHomeworkView />
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAppointmentRequest && (
          <AppointmentRequest
            onClose={() => setShowAppointmentRequest(false)}
            professionalId={
              professionalId ||
              user?.professionalId ||
              user?.professional_id ||
              user?.professional?._id ||
              user?.professional?.id ||
              null
            }
            onSuccess={() => {
              setShowAppointmentRequest(false)
              loadDashboardData()
            }}
          />
        )}

        {showAppointments && (
          <PatientAppointments onClose={() => setShowAppointments(false)} />
        )}
      </AnimatePresence>

      {/* Video Call Notification Manager */}
      <VideoCallNotificationManager />

      {/* Crisis / emergency button — always accessible */}
      <CrisisButton />
    </div>
  )
}

export default PatientDashboard
