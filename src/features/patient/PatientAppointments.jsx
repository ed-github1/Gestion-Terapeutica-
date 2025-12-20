import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '../../components'
import { appointmentsAPI } from '../../services/appointments'

const PatientAppointments = ({ onClose }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past, today

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      // Try to fetch from backend
      const response = await appointmentsAPI.getAppointments({})
      console.log('✅ Loaded patient appointments from backend:', response.data?.length || 0)
      
      if (response.data && response.data.length > 0) {
        setAppointments(response.data)
      } else {
        // Load from localStorage as fallback
        loadFromLocalStorage()
      }
    } catch (error) {
      console.warn('⚠️ Backend not available, loading from localStorage')
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('professionalAppointments')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAppointments(parsed.map(apt => ({
          ...apt,
          date: new Date(apt.start).toISOString().split('T')[0],
          time: new Date(apt.start).toTimeString().slice(0, 5)
        })))
      } catch (err) {
        console.error('Failed to parse appointments')
      }
    }
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()
    return appointments.filter(apt => {
      if (filter === 'upcoming') {
        // Keep as before
        const aptDate = new Date(apt.date)
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed'
      } else if (filter === 'past') {
        const aptDate = new Date(apt.date)
        return aptDate < now || apt.status === 'completed'
      } else if (filter === 'today') {
        let isToday = false
        if (/^\d{4}-\d{2}-\d{2}$/.test(apt.date)) {
          // Date-only string, treat as local date
          const [y, m, d] = apt.date.split('-').map(Number)
          const aptDateObj = new Date(todayYear, m - 1, d)
          isToday = (
            aptDateObj.getFullYear() === todayYear &&
            aptDateObj.getMonth() === todayMonth &&
            aptDateObj.getDate() === todayDate
          )
        } else if (typeof apt.date === 'string' && apt.date.endsWith('Z')) {
          // ISO string in UTC, compare UTC date parts
          const aptDateObj = new Date(apt.date)
          isToday = (
            aptDateObj.getUTCFullYear() === now.getUTCFullYear() &&
            aptDateObj.getUTCMonth() === now.getUTCMonth() &&
            aptDateObj.getUTCDate() === now.getUTCDate()
          )
        } else {
          // Fallback: parse as local date
          const aptDateObj = new Date(apt.date)
          isToday = (
            aptDateObj.getFullYear() === todayYear &&
            aptDateObj.getMonth() === todayMonth &&
            aptDateObj.getDate() === todayDate
          )
        }
        return isToday && apt.status !== 'cancelled'
      }
      return true
    })
  }

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    
    try {
      await appointmentsAPI.cancelAppointment(appointmentId, 'Cancelado por el paciente')
      showToast('✅ Cita cancelada exitosamente', 'success')
      loadAppointments()
    } catch (error) {
      console.warn('Could not cancel via backend, updating locally')
      // Update locally
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId || apt._id === appointmentId
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      )
      showToast('✅ Cita cancelada', 'success')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { color: 'bg-green-100 text-green-700', text: '✓ Programada', icon: '✓' },
      reserved: { color: 'bg-yellow-100 text-yellow-700', text: '○ Reservada', icon: '○' },
      completed: { color: 'bg-blue-100 text-blue-700', text: '✓ Completada', icon: '✓' },
      cancelled: { color: 'bg-red-100 text-red-700', text: '✗ Cancelada', icon: '✗' }
    }
    return badges[status] || badges.scheduled
  }

  const getTypeLabel = (type) => {
    const types = {
      consultation: { label: 'Consulta General', icon: '🩺' },
      followup: { label: 'Seguimiento', icon: '🔄' },
      therapy: { label: 'Terapia', icon: '💆' },
      emergency: { label: 'Urgencia', icon: '🚨' }
    }
    return types[type] || types.consultation
  }

  const filteredAppointments = getFilteredAppointments()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mis Citas</h2>
              <p className="text-blue-100 mt-1">Gestiona tus citas médicas</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Todas ({appointments.length})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'today' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'upcoming' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'past' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Pasadas
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Cargando citas...</p>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay citas</h3>
              <p className="text-gray-600">No tienes citas {filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'pasadas' : ''}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status = getStatusBadge(appointment.status)
                const type = getTypeLabel(appointment.type)
                const appointmentDate = new Date(appointment.date)
                
                return (
                  <motion.div
                    key={appointment.id || appointment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {type.label}
                            </h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {appointmentDate.toLocaleDateString('es-MX', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{appointment.time} - {appointment.duration} minutos</span>
                          </div>

                          {appointment.reason && (
                            <div className="flex items-start gap-2 text-gray-700 mt-2 pt-2 border-t">
                              <svg className="w-4 h-4 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span className="font-medium">Motivo:</span>
                                <p className="text-gray-600">{appointment.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => cancelAppointment(appointment.id || appointment._id)}
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                          >
                            Cancelar
                          </button>
                        )}
                        {appointment.isVideoCall && appointment.status === 'scheduled' && (
                          <button
                            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                          >
                            Videollamada
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientAppointments
