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
import { Clock } from 'lucide-react'

/**
 * Patient Dashboard - Modern design matching professional dashboard
 * Designed with privacy-first principles for healthcare applications
 */
const PatientDashboard = () => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
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

  // Extract user name with fallback
  const userName = user?.name?.split(' ')[0] || user?.nombre || 'Paciente'
  const fullName = user?.name || user?.nombre || 'Patient'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    loadDashboardData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const appointments = await appointmentsAPI.getPatientAppointments()
      
      // Defensive check - ensure appointments is an array
      const appointmentsArray = Array.isArray(appointments) ? appointments : []
      
      if (appointmentsArray.length === 0) {
        console.log('No appointments returned from API')
      }
      
      const now = new Date()

      const upcoming = appointmentsArray
        .filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0])
      }

      const completed = appointmentsArray.filter(apt => apt.status === 'completed').length
      const upcomingCount = upcoming.length

      // Calculate week progress (sessions this week)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const weekSessions = appointmentsArray.filter(apt => 
        new Date(apt.date) >= startOfWeek && 
        new Date(apt.date) <= now && 
        apt.status === 'completed'
      ).length

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
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] min-h-screen">
        {/* Main Content */}
        <div className="p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-lg md:text-xl text-gray-600 mb-1">{getGreeting()},</h1>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                  {userName}! 👋
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(currentTime)}
                  </p>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
                    <Clock className="w-4 h-4 text-gray-900" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {/* New Appointment Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAppointmentRequest(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Nueva Cita</span>
                </motion.button>

                {/* Profile Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-sm md:text-lg"
                  title="Perfil"
                >
                  {initials}
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
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Main Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-br from-blue-400 to-indigo-500 rounded-2xl md:rounded-3xl lg:rounded-4xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{stats.totalAppointments}</span>
                  </div>
                  {stats.completedSessions > 0 && (
                    <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Activo
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-white text-lg font-bold">Citas Totales</h3>
                  <p className="text-white/60 text-sm">en tu historial</p>
                </div>

                {nextAppointment && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Próxima Cita</span>
                      <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {nextAppointment.professionalName || 'Profesional'}
                        </p>
                        <p className="text-xs text-white/50">
                          {nextAppointment.time || new Date(nextAppointment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-br from-emerald-100 via-teal-50 to-cyan-50 rounded-2xl md:rounded-3xl lg:rounded-4xl p-6 md:p-8 relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Tu Progreso</h3>
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-700 rounded-xl text-xs font-semibold">
                  Esta Semana
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">Sesiones completadas</p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso Semanal</span>
                    <span className="text-2xl font-bold text-gray-900">{Math.round(stats.weekProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.weekProgress}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.completedSessions}</div>
                    <div className="text-xs text-gray-600">Completadas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</div>
                    <div className="text-xs text-gray-600">Próximas</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl md:rounded-3xl lg:rounded-4xl p-4 md:p-6 shadow-sm mb-6 md:mb-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Acciones Rápidas</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <QuickActionCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                title="Agendar Cita"
                color="from-blue-500 to-indigo-500"
                onClick={() => setShowAppointmentRequest(true)}
              />
              <QuickActionCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="Mis Citas"
                color="from-purple-500 to-pink-500"
                onClick={() => setShowAppointments(true)}
              />
              <QuickActionCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Mi Diario"
                color="from-emerald-500 to-teal-500"
                onClick={() => setShowDiary(true)}
              />
              <QuickActionCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
                title="Videollamada"
                color="from-amber-500 to-orange-500"
                onClick={() => simulateIncomingCall('Dr. García', '1')}
              />
            </div>
          </motion.div>

          {/* Resources Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl md:rounded-3xl lg:rounded-4xl p-4 md:p-6 shadow-sm"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Recursos de Apoyo</h2>
            
            <div className="space-y-3">
              <ResourceCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Guías de Bienestar"
                description="Material educativo sobre salud mental"
              />
              <ResourceCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                title="Biblioteca Digital"
                description="Artículos y libros recomendados"
              />
              <ResourceCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Preguntas Frecuentes"
                description="Respuestas a dudas comunes"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Profile & Chat */}
        <div className="bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Profile Card */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{fullName}</h3>
              <p className="text-sm text-gray-600">Paciente</p>
            </div>
            
            {/* Next Appointment Quick Info */}
            {nextAppointment && (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-900">Próxima Sesión</span>
                  <span className="text-xs font-medium text-blue-600">{getNextAppointmentText()}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {nextAppointment.time || new Date(nextAppointment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
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
  )
}

// Reusable Components
const QuickActionCard = ({ icon, title, color, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-linear-to-br ${color} text-white shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="mb-2 md:mb-3">{icon}</div>
      <span className="font-semibold text-xs md:text-sm text-center">{title}</span>
    </motion.button>
  )
}

const ResourceCard = ({ icon, title, description }) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-start p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg mr-3 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.div>
  )
}

export default PatientDashboard
