import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Clock } from 'lucide-react'
import { showToast } from '@components'
import { appointmentsService } from '@shared/services/appointmentsService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const AvailabilityManager = ({ onClose }) => {
  const { dark } = useDarkModeContext()
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
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    setTimeSlots(slots)
  }

  const loadAvailability = async () => {
    setLoading(true)
    try {
      // Try fetching from backend first
      try {
        const res = await appointmentsService.getAvailability()
        const raw = res.data?.data || res.data
        if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
          const normalized = {}
          Object.entries(raw).forEach(([k, v]) => { normalized[Number(k)] = v })
          setAvailability(normalized)
          // Sync to localStorage for quick local reads
          localStorage.setItem('professionalAvailability', JSON.stringify(normalized))
          return
        }
      } catch {
        // Backend unavailable — fall through to localStorage
      }
      const local = localStorage.getItem('professionalAvailability')
      if (local) {
        const parsed = JSON.parse(local)
        const normalized = {}
        Object.entries(parsed).forEach(([k, v]) => { normalized[Number(k)] = v })
        setAvailability(normalized)
      }
    } catch (err) {
      console.error('Error loading availability:', err)
    } finally {
      setLoading(false)
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
      // Save to backend so patients can fetch it
      await appointmentsService.updateAvailability(availability)
      // Also sync to localStorage for immediate local access
      localStorage.setItem('professionalAvailability', JSON.stringify(availability))
      
      // Dispatch custom event to notify dashboard
      window.dispatchEvent(new Event('availabilityUpdated'))
      
      showToast('Disponibilidad actualizada exitosamente', 'success')
      onClose?.()
    } catch (error) {
      console.error('Error saving availability:', error)
      // Save to localStorage as fallback
      localStorage.setItem('professionalAvailability', JSON.stringify(availability))
      
      // Dispatch custom event even on fallback
      window.dispatchEvent(new Event('availabilityUpdated'))
      
      showToast('Disponibilidad guardada localmente', 'success')
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 pb-20 sm:pb-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] sm:max-h-[85vh] overflow-hidden flex flex-col ${dark ? 'bg-gray-900' : 'bg-white'}`}
      >
        {/* Header */}
        <div className={`relative p-4 sm:p-6 pb-4 sm:pb-5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-4 h-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${dark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Gestionar Disponibilidad</h2>
                <p className={`text-xs mt-0.5 hidden sm:block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Define tus horarios de atención</p>
            </div>
          </div>
        </div>

        {loading && !Object.keys(availability).length ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className={`text-sm sm:text-base ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Cargando disponibilidad...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Day Selection */}
            <div>
              <h3 className={`text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 sm:mb-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Días de Atención</h3>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDaySelection(day.value)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      selectedDays.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border ${dark ? 'bg-blue-950 border-blue-900' : 'bg-blue-50 border-blue-100'}`}>
              <span className={`text-xs sm:text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones rápidas:</span>
              <button
                type="button"
                onClick={applyToAllDays}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium shadow-sm"
              >
                Aplicar a todos los días
              </button>
            </div>

            {/* Time Slots by Day */}
            <div className="space-y-4 sm:space-y-6">
              {selectedDays.map(dayValue => {
                const day = daysOfWeek.find(d => d.value === dayValue)
                if (!day) return null
                const daySlots = availability[dayValue] || []
                return (
                  <div key={dayValue} className={`border rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                      <h4 className={`text-sm sm:text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{day.label}</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => selectAllSlots(dayValue)}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                        >
                          Seleccionar todo
                        </button>
                        <button
                          type="button"
                          onClick={() => clearAllSlots(dayValue)}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2">
                      {timeSlots.map(time => {
                        const isSelected = daySlots.includes(time)
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => toggleTimeSlot(dayValue, time)}
                            className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition ${
                              isSelected
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                    
                    <p className={`text-xs mt-2 sm:mt-3 font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {daySlots.length} horario{daySlots.length !== 1 ? 's' : ''} disponible{daySlots.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`border-t px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 text-sm border rounded-lg transition font-medium ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || selectedDays.length === 0}
            className="w-full sm:flex-1 order-1 sm:order-2 px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Disponibilidad'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AvailabilityManager
