import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'
import VideoCallLauncher from './VideoCall'
import { showToast } from '@components'
import { appointmentsService } from '@shared/services/appointmentsService'
import AvailabilityManager from './AvailabilityManager'
import ModernAppointmentsCalendar from './ModernAppointmentsCalendar'

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
      
      await appointmentsService.updateStatus(appointment.id, 'notified')

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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-4 md:p-6 pb-4 md:pb-5 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">
                {appointment ? 'Editar Sesión' : 'Nueva Sesión'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {appointment ? 'Modifica los detalles de la sesión' : 'Agenda una nueva sesión terapéutica'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4 md:space-y-5">
            {/* Patient Info Card (when viewing existing appointment) */}
            {appointment && (
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {formData.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                      {formData.patientName}
                    </h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {appointment.status === 'scheduled' ? 'Programada' :
                           appointment.status === 'completed' ? 'Completada' :
                           appointment.status === 'cancelled' ? 'Cancelada' :
                           'Reservada'}
                        </span>
                      </div>
                      {appointment.reason && (
                        <p className="text-gray-600 mt-1.5 text-xs">{appointment.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient & Type Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Nombre del Paciente *
                </label>
                <input
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ej: María González"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tipo de Cita *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="consultation">Consulta General</option>
                  <option value="followup">Seguimiento</option>
                  <option value="therapy">Terapia</option>
                  <option value="emergency">Emergencia</option>
                </select>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Duración *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hora</option>
                  <option value="90">1.5 horas</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>

            {/* Video Call Option */}
            <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  id="videoCall"
                  checked={formData.isVideoCall}
                  onChange={(e) => setFormData({ ...formData, isVideoCall: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Sesión por Videollamada
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Realizar la sesión de forma virtual
                  </p>
                </div>
              </label>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Información adicional sobre la sesión..."
              />
            </div>

            {/* Video Call Actions (if editing and is video call) */}
            {appointment && appointment.isVideoCall && (
              <div className="space-y-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Acciones de Videollamada
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowVideoCall(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Iniciar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={copyVideoLink}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    title="Copiar enlace"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={sendNotification}
                    disabled={sendingNotification}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
                    title="Enviar notificación"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-3">
            {appointment ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </motion.button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm"
              >
                {appointment ? 'Actualizar' : 'Crear Sesión'}
              </motion.button>
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
      const response = await appointmentsService.getAll({})
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

  const handleSelectSlot = useCallback((date) => {
    setSelectedSlot({ start: date || new Date(), end: date || new Date() })
    setSelectedAppointment(null)
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event) => {
    setSelectedAppointment(event)
    setIsModalOpen(true)
  }, [])

  const handleEventDrop = useCallback(async ({ revert, start, end, ...apt }) => {
    try {
      const id = apt._id || apt.id
      await appointmentsService.updateStatus(id, apt.status || 'reserved')
      showToast('✅ Cita reagendada', 'success')
    } catch {
      revert?.()
      showToast('❌ No se pudo reagendar la cita', 'error')
    }
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

  return (
    <div className="bg-transparent">
      <div className="p-3 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-5"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            <h1 className="text-sm font-bold text-gray-800">Agenda</h1>
            <span className="text-[10px] text-gray-400">
              {loading ? '' : `· ${stats.upcomingAppointments} próximas · ${stats.totalAppointments} en total`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAvailabilityManager(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Disponibilidad</span>
            </button>
          </div>
        </motion.div>

        {/* Compact KPI strip */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 px-5 py-3 shadow-sm mb-5 flex items-center divide-x divide-stone-200">
          {[
            { value: loading ? '…' : stats.upcomingAppointments, Icon: Calendar,      label: 'Próximas',    color: 'text-sky-600',     bg: 'bg-sky-50' },
            { value: loading ? '…' : stats.completedSessions,    Icon: CheckCircle2,  label: 'Completadas', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { value: loading ? '…' : stats.totalAppointments,    Icon: Clock,         label: 'Total citas', color: 'text-gray-500',    bg: 'bg-gray-100' },
          ].map(({ value, Icon, label, color, bg }, i) => (
            <div key={label} className={`flex-1 flex items-center gap-3 px-4 ${i > 0 ? '' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] text-gray-400 leading-none mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-gray-900 border-t-transparent mb-4" />
                <p className="text-gray-700 font-semibold">Cargando agenda…</p>
              </div>
            </div>
          ) : (
            <ModernAppointmentsCalendar
              onSelectEvent={handleSelectEvent}
              onDateClick={handleSelectSlot}
              onEventDrop={handleEventDrop}
            />
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
