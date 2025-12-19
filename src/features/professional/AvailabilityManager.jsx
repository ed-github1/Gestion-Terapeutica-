import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '../../components'
import { appointmentsAPI } from '../../services/appointments'

const AvailabilityManager = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5,6,7]) // Monday to Friday
  const [timeSlots, setTimeSlots] = useState([])
  const [availability, setAvailability] = useState({})

  const daysOfWeek = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
  ]

  useEffect(() => {
    loadAvailability()
    generateTimeSlots()
  }, [])

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    setTimeSlots(slots)
  }

  const loadAvailability = async () => {
    setLoading(true)
    try {
      // Only fetch from backend or localStorage, no mock/default slots
      let loaded = {}
      try {
        const response = await appointmentsAPI.getAvailability?.()
        loaded = response?.data || {}
      } catch (error) {
        console.warn('Could not load availability from backend, trying localStorage')
        const local = localStorage.getItem('professionalAvailability')
        if (local) {
          try {
            loaded = JSON.parse(local)
          } catch (e) {
            loaded = {}
          }
        }
      }
      setAvailability(loaded)
      setLoading(false)
    } catch (err) {
      setLoading(false)
      console.error('Unexpected error loading availability:', err)
    }
  }

  const toggleDaySelection = (dayValue) => {
    setSelectedDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  const toggleTimeSlot = (day, time) => {
    setAvailability(prev => {
      const daySlots = prev[day] || []
      const newDaySlots = daySlots.includes(time)
        ? daySlots.filter(t => t !== time)
        : [...daySlots, time].sort()
      
      return {
        ...prev,
        [day]: newDaySlots
      }
    })
  }

  const selectAllSlots = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...timeSlots]
    }))
  }

  const clearAllSlots = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: []
    }))
  }

  const applyToAllDays = () => {
    const firstDay = selectedDays[0]
    const template = availability[firstDay] || []
    
    const newAvailability = {}
    selectedDays.forEach(day => {
      newAvailability[day] = [...template]
    })
    
    setAvailability(newAvailability)
    showToast('Horarios aplicados a todos los días seleccionados', 'success')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save to backend
      await appointmentsAPI.updateAvailability?.(availability)
      showToast('✅ Disponibilidad actualizada exitosamente', 'success')
      onClose?.()
    } catch (error) {
      console.error('Error saving availability:', error)
      // Save to localStorage as fallback
      localStorage.setItem('professionalAvailability', JSON.stringify(availability))
      showToast('✅ Disponibilidad guardada localmente', 'success')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestionar Disponibilidad</h2>
              <p className="text-purple-100 mt-1">Define tus horarios de atención</p>
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
        </div>

        {loading && !Object.keys(availability).length ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Cargando disponibilidad...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Day Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Días de Atención</h3>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDaySelection(day.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedDays.includes(day.value)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 items-center bg-gray-50 p-4 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Acciones rápidas:</span>
              <button
                type="button"
                onClick={applyToAllDays}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                Aplicar a todos los días
              </button>
            </div>

            {/* Time Slots by Day */}
            <div className="space-y-6">
              {selectedDays.map(dayValue => {
                const day = daysOfWeek.find(d => d.value === dayValue)
                if (!day) return null
                const daySlots = availability[dayValue] || []
                return (
                  <div key={dayValue} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{day.label}</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => selectAllSlots(dayValue)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          Seleccionar todo
                        </button>
                        <button
                          type="button"
                          onClick={() => clearAllSlots(dayValue)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {timeSlots.map(time => {
                        const isSelected = daySlots.includes(time)
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => toggleTimeSlot(dayValue, time)}
                            className={`px-2 py-2 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3">
                      {daySlots.length} horarios disponibles
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || selectedDays.length === 0}
              className="flex-1 px-6 py-3 bg-linear-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Disponibilidad'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AvailabilityManager
