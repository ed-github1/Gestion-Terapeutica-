import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { motion, AnimatePresence } from 'motion/react'
import VideoCallLauncher from './VideoCall'
import { showToast } from '../../components'
import { appointmentsAPI } from '../../services/appointments'
import AvailabilityManager from './AvailabilityManager'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const AppointmentModal = ({ appointment, onClose, onSave, onDelete }) => {
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || '',
    type: appointment?.type || 'consultation',
    date: appointment?.start ? format(appointment.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: appointment?.start ? format(appointment.start, 'HH:mm') : '09:00',
    duration: appointment?.duration || '60',
    notes: appointment?.notes || '',
    isVideoCall: appointment?.isVideoCall || false,
  })

  const copyVideoLink = () => {
    if (appointment) {
      const videoLink = `${window.location.origin}/video/join/${appointment.id}?name=${encodeURIComponent(formData.patientName)}`
      navigator.clipboard.writeText(videoLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
      showToast('🔗 Enlace de videollamada copiado', 'success')
    }
  }

  const sendNotification = async () => {
    if (!appointment) return
    
    setSendingNotification(true)
    try {
      const videoLink = `${window.location.origin}/video/join/${appointment.id}?name=${encodeURIComponent(formData.patientName)}`
      
      await appointmentsAPI.sendVideoLink(appointment.id, {
        patientName: formData.patientName,
        videoLink,
        appointmentTime: formData.date + ' ' + formData.time
      })

      showToast('✉️ Notificación enviada exitosamente', 'success')
    } catch (error) {
      console.error('Error sending notification:', error)
      showToast('❌ Error al enviar la notificación', 'error')
    } finally {
      setSendingNotification(false)
    }
  }

  if (showVideoCall && appointment) {
    return (
      <VideoCallLauncher
        appointmentId={appointment.id}
        patientName={appointment.patientName}
        patientId={appointment.patientId}
        onClose={() => setShowVideoCall(false)}
      />
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const [hours, minutes] = formData.time.split(':')
    const startDate = new Date(formData.date)
    startDate.setHours(parseInt(hours), parseInt(minutes), 0)
    
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + parseInt(formData.duration))

    onSave({
      id: appointment?.id || Date.now(),
      patientName: formData.patientName,
      type: formData.type,
      start: startDate,
      end: endDate,
      duration: formData.duration,
      notes: formData.notes,
      isVideoCall: formData.isVideoCall,
      status: appointment?.status || 'scheduled'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 via-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between text-white rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {appointment ? 'Editar Sesión' : 'Nueva Sesión'}
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {appointment ? 'Modifica los detalles de la sesión' : 'Agenda una nueva sesión terapéutica'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-xl transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {/* Patient Info Card (when viewing existing appointment) */}
            {appointment && (
              <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {formData.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {formData.patientName}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Paciente ID:</span>
                        <span className="text-gray-600">{appointment.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {appointment.status === 'scheduled' ? '✓ Programada' :
                           appointment.status === 'completed' ? '✓ Completada' :
                           appointment.status === 'cancelled' ? '✗ Cancelada' :
                           '○ Reservada'}
                        </span>
                      </div>
                      {appointment.reason && (
                        <div className="flex items-start gap-2 text-gray-700 mt-2">
                          <svg className="w-4 h-4 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <span className="font-medium">Motivo:</span>
                            <p className="text-gray-600 mt-1">{appointment.reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient & Type Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Información del Paciente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Paciente *
                  </label>
                  <input
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Ej: María González"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cita *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="consultation">🩺 Consulta General</option>
                    <option value="followup">🔄 Seguimiento</option>
                    <option value="therapy">💆 Terapia</option>
                    <option value="emergency">🚨 Emergencia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Fecha y Hora</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="30">⏱️ 30 min</option>
                    <option value="45">⏱️ 45 min</option>
                    <option value="60">⏱️ 1 hora</option>
                    <option value="90">⏱️ 1.5 horas</option>
                    <option value="120">⏱️ 2 horas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Video Call Option */}
            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="videoCall"
                  checked={formData.isVideoCall}
                  onChange={(e) => setFormData({ ...formData, isVideoCall: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                />
                <div className="ml-3">
                  <span className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Sesión por Videollamada
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Activa esta opción para realizar la sesión de forma virtual
                  </p>
                </div>
              </label>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Notas Adicionales</h3>
              </div>
              
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none bg-purple-50/30"
                placeholder="Escribe cualquier información adicional sobre la sesión, objetivos, preparación requerida, etc..."
              />
            </div>

            {/* Video Call Actions (if editing and is video call) */}
            {appointment && appointment.isVideoCall && (
              <div className="space-y-3 bg-linear-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Acciones de Videollamada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVideoCall(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-lg shadow-blue-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Iniciar Ahora
                  </button>
                  <button
                    type="button"
                    onClick={copyVideoLink}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {linkCopied ? '✓ Copiado' : 'Copiar Link'}
                  </button>
                  <button
                    type="button"
                    onClick={sendNotification}
                    disabled={sendingNotification}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {sendingNotification ? 'Enviando...' : 'Notificar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-purple-50/50 px-8 py-5 border-t border-purple-100 flex items-center justify-between rounded-b-3xl">
            {appointment ? (
              <button
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl transition font-semibold border border-red-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar Sesión
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-purple-300 rounded-2xl text-gray-700 hover:bg-purple-50 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30"
              >
                {appointment ? '✓ Actualizar Sesión' : '✓ Crear Sesión'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const AppointmentsCalendar = () => {
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Load appointments from backend + localStorage only (no demo data)
  const loadAppointments = async () => {
    let allAppointments = []
    // Try to load from backend
    try {
      const response = await appointmentsAPI.getAppointments({})
      console.log('✅ Loaded appointments from backend:', response.data?.length || 0)
      if (response.data && response.data.length > 0) {
        const backendAppointments = response.data.map(apt => {
          const [hours, minutes] = apt.time.split(':')
          const startDate = new Date(apt.date)
          startDate.setHours(parseInt(hours), parseInt(minutes), 0)
          const endDate = new Date(startDate)
          endDate.setMinutes(endDate.getMinutes() + apt.duration)
          return {
            id: apt._id || apt.id,
            patientName: apt.patientName,
            patientId: apt.patientId,
            type: apt.type,
            start: startDate,
            end: endDate,
            duration: String(apt.duration),
            isVideoCall: apt.isVideoCall || false,
            status: apt.status,
            notes: apt.notes,
            reason: apt.reason
          }
        })
        allAppointments = [...backendAppointments]
      }
    } catch (error) {
      console.warn('⚠️ Could not load from backend, using localStorage')
    }
    // Also load from localStorage (for offline bookings)
    const savedAppointments = localStorage.getItem('professionalAppointments')
    if (savedAppointments) {
      try {
        const parsed = JSON.parse(savedAppointments)
        const converted = parsed.map(apt => ({
          ...apt,
          start: new Date(apt.start),
          end: new Date(apt.end)
        }))
        allAppointments = [...allAppointments, ...converted]
      } catch (err) {
        console.warn('Failed to parse saved appointments')
      }
    }
    return allAppointments
  }
  
  const [appointments, setAppointments] = useState([])
  // Stat card state
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedSessions: 0,
    totalAppointments: 0
  })

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  // Load appointments and stats on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      const loaded = await loadAppointments()
      setAppointments(loaded)
      // Calculate stats
      const now = new Date()
      const upcoming = loaded.filter(apt => apt.start > now && apt.status !== 'cancelled')
      const completed = loaded.filter(apt => apt.status === 'completed')
      setStats({
        upcomingAppointments: upcoming.length,
        completedSessions: completed.length,
        totalAppointments: loaded.length
      })
      setLoading(false)
    }
    fetchAppointments()
  }, [])
  // Refresh appointments and stats periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const loaded = await loadAppointments()
      setAppointments(loaded)
      // Calculate stats
      const now = new Date()
      const upcoming = loaded.filter(apt => apt.start > now && apt.status !== 'cancelled')
      const completed = loaded.filter(apt => apt.status === 'completed')
      setStats({
        upcomingAppointments: upcoming.length,
        completedSessions: completed.length,
        totalAppointments: loaded.length
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end })
    setSelectedAppointment(null)
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event) => {
    setSelectedAppointment(event)
    setIsModalOpen(true)
  }, [])

  const handleSaveAppointment = (appointmentData) => {
    let updatedAppointments
    if (selectedAppointment) {
      updatedAppointments = appointments.map(apt => apt.id === appointmentData.id ? appointmentData : apt)
      setAppointments(updatedAppointments)
      showToast('✅ Cita actualizada exitosamente', 'success')
    } else {
      updatedAppointments = [...appointments, appointmentData]
      setAppointments(updatedAppointments)
      showToast('✅ Cita creada exitosamente', 'success')
    }
    
    // Save to localStorage (exclude demo appointments)
    const toSave = updatedAppointments.filter(apt => !apt.id.toString().startsWith('demo_'))
    localStorage.setItem('professionalAppointments', JSON.stringify(toSave))
    
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setSelectedSlot(null)
  }

  const handleDeleteAppointment = (id) => {
    const updatedAppointments = appointments.filter(apt => apt.id !== id)
    setAppointments(updatedAppointments)
    
    // Save to localStorage (exclude demo appointments)
    const toSave = updatedAppointments.filter(apt => !apt.id.toString().startsWith('demo_'))
    localStorage.setItem('professionalAppointments', JSON.stringify(toSave))
    
    showToast('🗑️ Cita eliminada exitosamente', 'info')
    setIsModalOpen(false)
    setSelectedAppointment(null)
  }

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6'
    
    if (event.type === 'therapy') backgroundColor = '#8b5cf6'
    else if (event.type === 'followup') backgroundColor = '#10b981'
    else if (event.type === 'emergency') backgroundColor = '#ef4444'
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block'
      }
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stat Cards - match patient dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Próximas Citas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.upcomingAppointments}</p>
                <p className="text-xs text-gray-500 mt-1">Agendadas</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Sesiones Completadas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.completedSessions}</p>
                <p className="text-xs text-gray-500 mt-1">Histórico</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalAppointments}</p>
                <p className="text-xs text-gray-500 mt-1">En el sistema</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Sesiones Activas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.upcomingAppointments}</p>
                <p className="text-xs text-gray-500 mt-1">En curso</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Header and actions */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-purple-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-linear-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Agenda de Sesiones</h1>
              <p className="text-gray-600 mt-1">Gestiona tus sesiones terapéuticas y horarios</p>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAvailabilityManager(true)}
              className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-2xl hover:bg-purple-50 transition shadow-md border-2 border-purple-200 font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mi Disponibilidad
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedAppointment(null)
                setIsModalOpen(true)
              }}
              className="flex items-center px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition shadow-lg shadow-purple-500/30 font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Sesión
            </motion.button>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm p-5 mb-4 flex flex-wrap items-center gap-6 border border-purple-100"
        >
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tipos de Sesión:
          </span>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-xl">
            <div className="w-4 h-4 bg-blue-500 rounded-lg shadow-sm"></div>
            <span className="text-sm font-medium text-blue-700">Consulta</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 rounded-xl">
            <div className="w-4 h-4 bg-emerald-500 rounded-lg shadow-sm"></div>
            <span className="text-sm font-medium text-emerald-700">Seguimiento</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-xl">
            <div className="w-4 h-4 bg-purple-500 rounded-lg shadow-sm"></div>
            <span className="text-sm font-medium text-purple-700">Terapia</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-100 rounded-xl">
            <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
            <span className="text-sm font-medium text-red-700">Emergencia</span>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-purple-100" 
          style={{ height: '700px' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Cargando citas...</p>
                <p className="text-sm text-gray-500 mt-2">Total citas: {appointments.length}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                📅 Mostrando {appointments.length} citas
              </div>
              <Calendar
                localizer={localizer}
                events={appointments}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="patientName"
                culture="es"
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="week"
                step={30}
                showMultiDayTimes
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Cita",
                  noEventsInRange: "No hay citas en este rango"
                }}
              />
            </>
          )}
        </motion.div>

        {/* Appointment Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <AppointmentModal
              appointment={selectedAppointment}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedAppointment(null)
                setSelectedSlot(null)
              }}
              onSave={handleSaveAppointment}
              onDelete={handleDeleteAppointment}
            />
          )}
          
          {showAvailabilityManager && (
            <AvailabilityManager
              onClose={() => setShowAvailabilityManager(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AppointmentsCalendar
