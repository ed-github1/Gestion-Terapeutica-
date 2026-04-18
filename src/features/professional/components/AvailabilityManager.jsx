import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { appointmentsService } from '@shared/services/appointmentsService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const DAYS = [
  { value: 1, label: 'Lunes', short: 'L' },
  { value: 2, label: 'Martes', short: 'M' },
  { value: 3, label: 'Miércoles', short: 'X' },
  { value: 4, label: 'Jueves', short: 'J' },
  { value: 5, label: 'Viernes', short: 'V' },
  { value: 6, label: 'Sábado', short: 'S' },
  { value: 0, label: 'Domingo', short: 'D' }
]

const SLOTS = (() => {
  const s = []
  for (let h = 0; h <= 23; h++) {
    s.push(`${String(h).padStart(2, '0')}:00`)
    s.push(`${String(h).padStart(2, '0')}:30`)
  }
  return s
})()

function addHalfHour(time) {
  const idx = SLOTS.indexOf(time)
  if (idx === -1) return time
  if (idx === SLOTS.length - 1) return '24:00'
  return SLOTS[idx + 1]
}

function slotsToRanges(slots) {
  if (!slots?.length) return []
  const sorted = [...slots].sort()
  const ranges = []
  let start = sorted[0]
  let prevIdx = SLOTS.indexOf(start)
  for (let i = 1; i < sorted.length; i++) {
    const idx = SLOTS.indexOf(sorted[i])
    if (idx !== prevIdx + 1) {
      ranges.push([start, addHalfHour(sorted[i - 1])])
      start = sorted[i]
    }
    prevIdx = idx
  }
  ranges.push([start, addHalfHour(sorted[sorted.length - 1])])
  return ranges
}

const AvailabilityManager = ({ onClose }) => {
  const { dark } = useDarkModeContext()
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState({})
  const [activeDay, setActiveDay] = useState(1)

  useEffect(() => { loadAvailability() }, [])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      try {
        const res = await appointmentsService.getAvailability()
        const raw = res.data?.data || res.data
        if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
          const normalized = {}
          Object.entries(raw).forEach(([k, v]) => { normalized[Number(k)] = v })
          setAvailability(normalized)
          sessionStorage.setItem('professionalAvailability', JSON.stringify(normalized))
          return
        }
      } catch { /* fallthrough */ }
      const local = sessionStorage.getItem('professionalAvailability')
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

  const daySlots = availability[activeDay] || []

  const toggleSlot = (time) => {
    setAvailability(prev => {
      const cur = prev[activeDay] || []
      const next = cur.includes(time) ? cur.filter(t => t !== time) : [...cur, time].sort()
      return { ...prev, [activeDay]: next }
    })
  }

  const clearDay = () => setAvailability(prev => ({ ...prev, [activeDay]: [] }))

  const applyToAllDays = () => {
    const template = availability[activeDay] || []
    const next = {}
    DAYS.forEach(d => { next[d.value] = [...template] })
    setAvailability(next)
    showToast('Horario aplicado a toda la semana', 'success')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await appointmentsService.updateAvailability(availability)
      sessionStorage.setItem('professionalAvailability', JSON.stringify(availability))
      window.dispatchEvent(new Event('availabilityUpdated'))
      showToast('Disponibilidad actualizada', 'success')
      onClose?.()
    } catch (error) {
      console.error('Error saving availability:', error)
      sessionStorage.setItem('professionalAvailability', JSON.stringify(availability))
      window.dispatchEvent(new Event('availabilityUpdated'))
      showToast('Disponibilidad guardada localmente', 'success')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  const ranges = useMemo(() => slotsToRanges(daySlots), [daySlots])
  const totalHours = useMemo(() => {
    let n = 0
    DAYS.forEach(d => { n += (availability[d.value] || []).length })
    return n * 0.5
  }, [availability])

  // Styles
  const border = dark ? 'border-gray-800' : 'border-gray-200'
  const subtle = dark ? 'text-gray-500' : 'text-gray-500'
  const muted = dark ? 'text-gray-400' : 'text-gray-600'
  const heading = dark ? 'text-white' : 'text-gray-900'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 pb-20 sm:pb-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col rounded-xl shadow-xl ${dark ? 'bg-gray-900' : 'bg-white'}`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between px-6 pt-5 pb-4 border-b ${border}`}>
          <div>
            <h2 className={`text-base font-semibold ${heading}`}>Disponibilidad</h2>
            <p className={`text-xs mt-0.5 ${subtle}`}>
              {totalHours > 0 ? `${totalHours} h semanales` : 'Sin horarios configurados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 -mr-1 rounded-md transition ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day selector */}
        <div className={`flex px-6 py-3 border-b ${border}`}>
          <div className="flex gap-1 w-full">
            {DAYS.map(day => {
              const count = (availability[day.value] || []).length
              const isActive = day.value === activeDay
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setActiveDay(day.value)}
                  className={`relative flex-1 min-w-0 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? dark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                      : dark ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden sm:inline">{day.label.slice(0, 3)}</span>
                  <span className="sm:hidden">{day.short}</span>
                  {count > 0 && (
                    <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white' : dark ? 'bg-emerald-500' : 'bg-emerald-500'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading && !Object.keys(availability).length ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className={`animate-spin rounded-full h-6 w-6 border-2 ${dark ? 'border-gray-700 border-t-gray-300' : 'border-gray-200 border-t-gray-600'}`} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
            {/* Day status */}
            <div className="flex items-baseline justify-between mb-4">
              <div className={`text-sm ${muted}`}>
                {ranges.length === 0 ? (
                  <span>Sin horarios</span>
                ) : (
                  ranges.map(([s, e], i) => (
                    <span key={i}>
                      {i > 0 && <span className={subtle}> · </span>}
                      <span className={heading}>{s}–{e}</span>
                    </span>
                  ))
                )}
              </div>
              {daySlots.length > 0 && (
                <button
                  type="button"
                  onClick={clearDay}
                  className={`text-xs ${subtle} hover:underline`}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Slot grid — 8 cols, ticks at each hour */}
            <div className="grid grid-cols-8 gap-1">
              {SLOTS.map(time => {
                const selected = daySlots.includes(time)
                const isHour = time.endsWith(':00')
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleSlot(time)}
                    className={`py-2 rounded text-[11px] font-medium tabular-nums transition ${
                      selected
                        ? dark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                        : dark
                          ? `${isHour ? 'bg-gray-800' : 'bg-gray-800/50'} text-gray-400 hover:bg-gray-700`
                          : `${isHour ? 'bg-gray-100' : 'bg-gray-50'} text-gray-600 hover:bg-gray-200`
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between gap-3 px-6 py-3 border-t ${border}`}>
          <button
            type="button"
            onClick={applyToAllDays}
            disabled={daySlots.length === 0}
            className={`text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
          >
            Aplicar a toda la semana
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${dark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-50 ${dark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AvailabilityManager
