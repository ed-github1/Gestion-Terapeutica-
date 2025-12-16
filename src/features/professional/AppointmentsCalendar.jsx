import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { motion, AnimatePresence } from 'motion/react'
import VideoCallLauncher from './VideoCall'
import { showToast } from '../../components'

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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/appointments/${appointment.id}/send-video-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patientName: formData.patientName,
          videoLink,
          appointmentTime: formData.date + ' ' + formData.time
        })
      })

      if (response.ok) {
        showToast('✉️ Notificación enviada exitosamente', 'success')
      } else {
        throw new Error('Error al enviar notificación')
      }
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
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold">
              {appointment ? '📝 Editar Cita' : '➕ Nueva Cita'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {appointment ? 'Modifica los detalles de la cita' : 'Agenda una nueva cita médica'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {/* Patient & Type Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información del Paciente
              </h3>
              
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
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora
              </h3>
              
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="videoCall"
                  checked={formData.isVideoCall}
                  onChange={(e) => setFormData({ ...formData, isVideoCall: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Cita por Videollamada
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Activa esta opción para realizar la cita de forma virtual
                  </p>
                </div>
              </label>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Notas Adicionales
              </h3>
              
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Escribe cualquier información adicional sobre la cita, síntomas, preparación requerida, etc..."
              />
            </div>

            {/* Video Call Actions (if editing and is video call) */}
            {appointment && appointment.isVideoCall && (
              <div className="space-y-3 bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-3">Acciones de Videollamada</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVideoCall(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Iniciar Ahora
                  </button>
                  <button
                    type="button"
                    onClick={copyVideoLink}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
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
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex items-center justify-between">
            {appointment ? (
              <button
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar Cita
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
              >
                {appointment ? '✓ Actualizar Cita' : '✓ Crear Cita'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const AppointmentsCalendar = () => {
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientName: 'María González',
      type: 'consultation',
      start: new Date(2025, 11, 15, 9, 0),
      end: new Date(2025, 11, 15, 10, 0),
      duration: '60',
      isVideoCall: true,
      status: 'scheduled',
      notes: 'Primera consulta'
    },
    {
      id: 2,
      patientName: 'Juan Pérez',
      type: 'followup',
      start: new Date(2025, 11, 15, 14, 0),
      end: new Date(2025, 11, 15, 15, 0),
      duration: '60',
      isVideoCall: false,
      status: 'scheduled',
    },
  ])

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

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
    if (selectedAppointment) {
      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentData.id ? appointmentData : apt)
      )
      showToast('✅ Cita actualizada exitosamente', 'success')
    } else {
      setAppointments(prev => [...prev, appointmentData])
      showToast('✅ Cita creada exitosamente', 'success')
    }
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setSelectedSlot(null)
  }

  const handleDeleteAppointment = (id) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id))
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario de Citas</h1>
            <p className="text-gray-600 mt-2">Gestiona tus citas y horarios</p>
          </div>
          <button
            onClick={() => {
              setSelectedAppointment(null)
              setIsModalOpen(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Cita
          </button>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center space-x-6">
          <span className="text-sm font-medium text-gray-700">Tipos de Cita:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Consulta</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Seguimiento</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Terapia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Emergencia</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm p-4" style={{ height: '700px' }}>
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
        </div>

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
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AppointmentsCalendar
