import React, { useState, useEffect } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import PatientPersonalDiary from './PatientPersonalDiary'
import AppointmentRequest from './AppointmentRequest'
import PatientAppointments from './PatientAppointments'
import { appointmentsAPI } from '@services/appointments'
import { VideoCallNotificationManager } from '@components'
import useVideoCallNotifications from '@hooks/useVideoCallNotifications'
import ChatPanel from '@components/layout/ChatPanel'

/**
 * Professional Patient Dashboard
 * Designed with privacy-first principles for healthcare applications
 * Follows WCAG 2.1 AA accessibility standards
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const [showDiary, setShowDiary] = useState(false)
  const [showAppointmentRequest, setShowAppointmentRequest] = useState(false)
  const [showAppointments, setShowAppointments] = useState(false)
  const [nextAppointment, setNextAppointment] = useState(null)
  const { simulateIncomingCall } = useVideoCallNotifications()
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedSessions: 0,
    totalAppointments: 0,
    weekProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const appointments = await appointmentsAPI.getPatientAppointments()
      const now = new Date()

      const upcoming = appointments
        .filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0])
      }

      const completed = appointments.filter(apt => apt.status === 'completed').length
      const upcomingCount = upcoming.length

      // Calculate week progress (sessions this week)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const weekSessions = appointments.filter(apt => 
        new Date(apt.date) >= startOfWeek && 
        new Date(apt.date) <= now && 
        apt.status === 'completed'
      ).length

      setStats({
        upcomingAppointments: upcomingCount,
        completedSessions: completed,
        totalAppointments: appointments.length,
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
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Loading Skeleton Component
  const StatCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="w-16 h-10 bg-gray-200 rounded mb-2"></div>
      <div className="w-24 h-4 bg-gray-200 rounded"></div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] h-full">
      {/* Center Content */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 overflow-y-auto rounded-tl-none md:rounded-tl-[1.5rem] lg:rounded-tl-[2rem] xl:rounded-tl-[2.5rem]">
      {/* Privacy Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Información confidencial protegida</span>
            <span className="hidden sm:inline text-blue-100">• Conexión segura • Datos encriptados</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Paciente'}!👋
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAppointmentRequest(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Cita
              </motion.button>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
              >
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-amber-600 hover:text-amber-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Next Appointment Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {nextAppointment && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {getNextAppointmentText()}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {nextAppointment ? nextAppointment.time : '--:--'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Próxima Cita</div>
                {nextAppointment && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {new Date(nextAppointment.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Completed Sessions Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Completadas
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.completedSessions}
                </div>
                <div className="text-sm text-gray-600 font-medium">Sesiones Completadas</div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Progreso continuo
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Appointments Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Programadas
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.upcomingAppointments}
                </div>
                <div className="text-sm text-gray-600 font-medium">Citas Próximas</div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => setShowAppointments(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    Ver calendario
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>

              {/* Progress Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Esta semana
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.round(stats.weekProgress)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">Progreso</div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.weekProgress}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Next Appointment Highlight */}
        <AnimatePresence>
          {nextAppointment && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/30 overflow-hidden mb-8"
            >
              <div className="relative p-8">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24"></div>
                
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <span className="text-white/90 font-medium text-sm">Próxima Cita Agendada</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      {new Date(nextAppointment.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{nextAppointment.time}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{nextAppointment.professionalName || 'Profesional'}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{nextAppointment.type === 'video' ? 'Videollamada' : 'Presencial'}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAppointments(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Ver Detalles
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Nueva Cita"
              color="blue"
              onClick={() => setShowAppointmentRequest(true)}
            />
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              label="Mis Citas"
              color="purple"
              onClick={() => setShowAppointments(true)}
            />
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              label="Mi Diario"
              color="pink"
              onClick={() => setShowDiary(true)}
            />
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="Documentos"
              color="emerald"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label="Recursos"
              color="amber"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              label="Soporte"
              color="slate"
              onClick={() => {}}
            />
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              {stats.completedSessions > 0 ? (
                <>
                  <ActivityItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    title="Sesión Completada"
                    description="Última sesión terapéutica finalizada exitosamente"
                    time="Hace 2 días"
                    color="emerald"
                  />
                  {nextAppointment && (
                    <ActivityItem
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                      title="Próxima Cita Confirmada"
                      description={`${getNextAppointmentText()} - ${nextAppointment.time}`}
                      time={new Date(nextAppointment.date).toLocaleDateString('es-ES')}
                      color="blue"
                    />
                  )}
                  <ActivityItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                    title="Diario Personal Actualizado"
                    description="Registro de progreso y emociones"
                    time="Hace 3 días"
                    color="purple"
                    onClick={() => setShowDiary(true)}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No hay actividad reciente</p>
                  <p className="text-sm text-gray-500">Comienza agendando tu primera cita</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Resources & Support */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Recursos y Apoyo
            </h2>
            <div className="space-y-3">
              <ResourceItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Guías de Bienestar"
                description="Material educativo sobre salud mental"
                color="blue"
              />
              <ResourceItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
                title="Videos Educativos"
                description="Contenido en video sobre técnicas de manejo"
                color="emerald"
              />
              <ResourceItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                title="Biblioteca Digital"
                description="Artículos y libros recomendados"
                color="purple"
              />
              <ResourceItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Preguntas Frecuentes"
                description="Respuestas a dudas comunes"
                color="amber"
              />
            </div>
          </motion.div>
        </div>

        {/* Privacy Notice */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Tu privacidad es nuestra prioridad</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Toda tu información está protegida con encriptación de extremo a extremo. 
                Cumplimos con los más altos estándares de privacidad y seguridad de datos médicos. 
                Solo tú y tu profesional de salud pueden acceder a tu información confidencial.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Encriptación SSL/TLS
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cumplimiento GDPR
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Auditorías de seguridad
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showDiary && (
          <PatientPersonalDiary onClose={() => setShowDiary(false)} />
        )}

        {showAppointmentRequest && (
          <AppointmentRequest
            onClose={() => setShowAppointmentRequest(false)}
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
      </div>
          
      {/* Right Panel - Profile & Chat */}
      <div className="bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto rounded-tr-none md:rounded-tr-[1.5rem] lg:rounded-tr-[2rem] xl:rounded-tr-[2.5rem] rounded-br-none md:rounded-br-[1.5rem] lg:rounded-br-[2rem] xl:rounded-br-[2.5rem]">
            {/* Profile Card */}
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {(user?.name?.split(' ')[0]?.[0] || 'P').toUpperCase()}
                    {(user?.name?.split(' ')[1]?.[0] || 'A').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {user?.name || 'Patient'}!
                </h3>
                <p className="text-sm text-gray-600">Patient</p>
              </div>
              
              {/* Next Appointment Quick Info */}
              {nextAppointment && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-900">Next Session</span>
                    <span className="text-xs font-medium text-blue-600">{getNextAppointmentText()}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{nextAppointment.time}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(nextAppointment.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Panel */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel userRole="patient" />
            </div>
          </div>
    </div>
  )
}

// Reusable Components
const QuickActionButton = ({ icon, label, color, onClick }) => {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700',
    purple: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700',
    pink: 'border-pink-200 hover:border-pink-300 hover:bg-pink-50 text-pink-700',
    emerald: 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700',
    slate: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${colorClasses[color]}`}
    >
      <div className="mb-3 opacity-90">{icon}</div>
      <span className="font-semibold text-sm text-center">{label}</span>
    </motion.button>
  )
}

const ActivityItem = ({ icon, title, description, time, color, onClick }) => {
  const colorClasses = {
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-600',
    blue: 'from-blue-50 to-indigo-50 border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600',
    purple: 'from-purple-50 to-pink-50 border-purple-200 bg-gradient-to-br from-purple-500 to-pink-600',
  }

  const [bgGradient, borderColor, iconGradient] = colorClasses[color].split(' ')

  return (
    <motion.div 
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={`flex items-start p-4 rounded-xl border ${onClick ? 'cursor-pointer' : ''} bg-gradient-to-r ${bgGradient} ${borderColor}`}
    >
      <div className={`${iconGradient} p-2.5 rounded-lg mr-3 shrink-0 shadow-md text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-700 mb-2">{description}</p>
        <p className="text-xs text-gray-500 font-medium">{time}</p>
      </div>
      {onClick && (
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </motion.div>
  )
}

const ResourceItem = ({ icon, title, description, color }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-cyan-50 border-blue-200 bg-gradient-to-br from-blue-500 to-cyan-600',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-600',
    purple: 'from-purple-50 to-pink-50 border-purple-200 bg-gradient-to-br from-purple-500 to-pink-600',
    amber: 'from-amber-50 to-orange-50 border-amber-200 bg-gradient-to-br from-amber-500 to-orange-600',
  }

  const [bgGradient, borderColor, iconGradient] = colorClasses[color].split(' ')

  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className={`flex items-start p-4 rounded-xl border cursor-pointer bg-gradient-to-r ${bgGradient} ${borderColor}`}
    >
      <div className={`${iconGradient} p-2.5 rounded-lg mr-3 flex-shrink-0 shadow-md text-white`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.div>
  )
}

export default PatientDashboard
