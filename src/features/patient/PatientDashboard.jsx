import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import PatientPersonalDiary from './PatientPersonalDiary'
import AppointmentRequest from './AppointmentRequest'
import PatientAppointments from './PatientAppointments'
import { appointmentsAPI } from '../../services/appointments'
import { VideoCallNotificationManager } from '../../components'
import useVideoCallNotifications from '../../hooks/useVideoCallNotifications'

const PatientDashboard = () => {
  const [showDiary, setShowDiary] = useState(false)
  const [showAppointmentRequest, setShowAppointmentRequest] = useState(false)
  const [showAppointments, setShowAppointments] = useState(false)
  const [nextAppointment, setNextAppointment] = useState(null)
  const { simulateIncomingCall } = useVideoCallNotifications()
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedSessions: 0,
    totalAppointments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
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

      setStats({
        upcomingAppointments: upcomingCount,
        completedSessions: completed,
        totalAppointments: appointments.length
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      const stored = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      const now = new Date()
      const upcoming = stored.filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0])
      }
      setStats({
        upcomingAppointments: upcoming.length,
        completedSessions: stored.filter(apt => apt.status === 'completed').length,
        totalAppointments: stored.length
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

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-purple-400">✨</span>
                ¡Bienvenido a tu Panel
              </h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
            <div className="flex gap-3">
              {simulateIncomingCall && (
                <button
                  onClick={simulateIncomingCall}
                  className="px-4 py-3 bg-orange-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  title="Simular llamada entrante (Demo)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Test Call
                </button>
              )}
              <button
                onClick={() => setShowAppointmentRequest(true)}
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
              >
                + Nueva Cita
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden bg-linear-to-br from-blue-400 to-blue-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="relative text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  {loading ? '...' : getNextAppointmentText()}
                </span>
              </div>
              <h3 className="text-4xl font-bold mb-2">
                {nextAppointment ? nextAppointment.time : '--:--'}
              </h3>
              <p className="text-sm text-white/90">Próxima Cita</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden bg-linear-to-br from-emerald-400 to-teal-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="relative text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">Completadas</span>
              </div>
              <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.completedSessions}</h3>
              <p className="text-sm text-white/90">Sesiones Completadas</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden bg-linear-to-br from-purple-400 to-pink-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="relative text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">Programadas</span>
              </div>
              <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.upcomingAppointments}</h3>
              <p className="text-sm text-white/90">Citas Próximas</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden bg-linear-to-br from-amber-400 to-orange-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="relative text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">Total</span>
              </div>
              <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.totalAppointments}</h3>
              <p className="text-sm text-white/90">Total Citas</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAppointmentRequest(true)}
              className="flex flex-col items-center justify-center p-5 border-2 border-blue-500 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Solicitar Cita</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAppointments(true)}
              className="flex flex-col items-center justify-center p-5 border-2 border-purple-500 text-purple-600 rounded-2xl hover:bg-purple-50 transition-all"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Mis Citas</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDiary(true)}
              className="flex flex-col items-center justify-center p-5 border-2 border-pink-500 text-pink-600 rounded-2xl hover:bg-pink-50 transition-all"
            >
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Mi Diario</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center p-5 border-2 border-green-500 text-green-600 rounded-2xl hover:bg-green-50 transition-all"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Tratamientos</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center p-5 border-2 border-gray-500 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">Ayuda</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Next Appointment Highlight */}
        {nextAppointment && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative overflow-hidden bg-linear-to-r from-purple-500 via-purple-600 to-pink-500 rounded-3xl shadow-lg p-8 text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white/90 font-medium text-sm">Próxima Cita Programada</p>
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  {new Date(nextAppointment.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{nextAppointment.time}</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-semibold">{nextAppointment.professionalName || 'Profesional de Salud'}</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">{nextAppointment.type === 'video' ? 'Videollamada' : 'Presencial'}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAppointments(true)}
                className="px-8 py-3 bg-white text-purple-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-lg"
              >
                Ver Detalles
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              {stats.completedSessions > 0 && (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-start p-4 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl"
                >
                  <div className="bg-linear-to-br from-green-400 to-emerald-500 p-2.5 rounded-xl mr-3 shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Sesión Completada</p>
                    <p className="text-sm text-gray-600 mt-1">Última sesión terapéutica finalizada</p>
                    <p className="text-xs text-gray-500 mt-2">Hace 2 días</p>
                  </div>
                </motion.div>
              )}

              {nextAppointment && (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-start p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl"
                >
                  <div className="bg-linear-to-br from-blue-400 to-indigo-500 p-2.5 rounded-xl mr-3 shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Próxima Cita Confirmada</p>
                    <p className="text-sm text-gray-600 mt-1">{getNextAppointmentText()} - {nextAppointment.time}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(nextAppointment.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.div 
                whileHover={{ x: 4, scale: 1.02 }}
                className="flex items-start p-4 bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl cursor-pointer"
                onClick={() => setShowDiary(true)}
              >
                <div className="bg-linear-to-br from-purple-400 to-pink-500 p-2.5 rounded-xl mr-3 shrink-0 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Diario Personal</p>
                  <p className="text-sm text-gray-600 mt-1">Registra tu progreso diario</p>
                  <p className="text-sm text-purple-600 mt-2 font-semibold flex items-center gap-1">
                    Abrir diario 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Resources */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Recursos y Consejos
            </h2>
            <div className="space-y-3">
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-start p-4 bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl cursor-pointer"
              >
                <div className="bg-linear-to-br from-blue-400 to-cyan-500 p-2.5 rounded-xl mr-3 flex-shrink-0 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Guías de Tratamiento</p>
                  <p className="text-sm text-gray-600 mt-1">Material educativo y recursos</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-start p-4 bg-linear-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl cursor-pointer"
              >
                <div className="bg-linear-to-br from-green-400 to-teal-500 p-2.5 rounded-xl mr-3 flex-shrink-0 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Biblioteca de Recursos</p>
                  <p className="text-sm text-gray-600 mt-1">Artículos y videos educativos</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-start p-4 bg-linear-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl cursor-pointer"
              >
                <div className="bg-linear-to-br from-orange-400 to-amber-500 p-2.5 rounded-xl mr-3 flex-shrink-0 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Preguntas Frecuentes</p>
                  <p className="text-sm text-gray-600 mt-1">Encuentra respuestas rápidas</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Personal Diary Modal */}
      {showDiary && (
        <PatientPersonalDiary onClose={() => setShowDiary(false)} />
      )}

      {/* Appointment Request Modal */}
      {showAppointmentRequest && (
        <AppointmentRequest
          onClose={() => setShowAppointmentRequest(false)}
          onSuccess={() => {
            // Refresh dashboard data after successful appointment request
            window.location.reload()
          }}
        />
      )}

      {/* Patient Appointments Modal */}
      {showAppointments && (
        <PatientAppointments onClose={() => setShowAppointments(false)} />
      )}

      {/* Video Call Notification Manager */}
      <VideoCallNotificationManager />
    </div>
  )
}

export default PatientDashboard
