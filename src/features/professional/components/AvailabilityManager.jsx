import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { Clock, X, Check, Wallet } from 'lucide-react'
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
  const [saved, setSaved] = useState(false)
  const [rangeStart, setRangeStart] = useState(null)
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
    if (rangeStart === null) {
      setRangeStart(time)
      setAvailability(prev => {
        const cur = prev[activeDay] || []
        const next = cur.includes(time)
          ? cur.filter(t => t !== time)
          : [...cur, time].sort()
        return { ...prev, [activeDay]: next }
      })
    } else {
      const startIdx = SLOTS.indexOf(rangeStart)
      const endIdx = SLOTS.indexOf(time)
      const [from, to] = startIdx < endIdx
        ? [startIdx, endIdx]
        : [endIdx, startIdx]
      const rangeSlots = SLOTS.slice(from, to + 1)
      setAvailability(prev => {
        const cur = prev[activeDay] || []
        const anchorIsSelected = cur.includes(rangeStart)
        const next = anchorIsSelected
          ? [...new Set([...cur, ...rangeSlots])].sort()
          : cur.filter(t => !rangeSlots.includes(t))
        return { ...prev, [activeDay]: next }
      })
      setRangeStart(null)
    }
  }

  const clearDay = () => {
    setAvailability(prev => ({ ...prev, [activeDay]: [] }))
    setRangeStart(null)
  }

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
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose?.() }, 1200)
    } catch (error) {
      console.error('Error saving availability:', error)
      sessionStorage.setItem('professionalAvailability', JSON.stringify(availability))
      window.dispatchEvent(new Event('availabilityUpdated'))
      showToast('Disponibilidad guardada localmente', 'success')
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose?.() }, 1200)
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

  const border = dark ? 'border-gray-800' : 'border-gray-200'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // ↓ on mobile sits at bottom like a sheet, on desktop centered
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        // ↓ full width bottom sheet on mobile, constrained modal on desktop
        className={`w-full sm:max-w-2xl sm:max-h-[88vh] max-h-[92vh] overflow-hidden flex flex-col sm:rounded-xl rounded-t-2xl shadow-xl ${dark ? 'bg-gray-900' : 'bg-white'}`}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className={`w-9 h-1 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dark ? 'bg-slate-800' : 'bg-gray-transparent'}`}>
              <Clock strokeWidth='3' className={`w-4.5 h-4.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">Configuración</p>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Disponibilidad</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Total hours badge */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {totalHours}h
            </span>
            <button
              onClick={onClose}
              className={`p-1.5 -mr-1 rounded-md transition ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day selector */}
        <div className={`flex px-4 sm:px-6 py-2 sm:py-3 border-b ${border}`}>
          <div className="flex gap-1 w-full">
            {DAYS.map(day => {
              const count = (availability[day.value] || []).length
              const isActive = day.value === activeDay
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => { setActiveDay(day.value); setRangeStart(null) }}
                  className={`relative flex-1 min-w-0 py-2 sm:py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? dark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                      : dark ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {/* Always short on mobile to save space */}
                  <span className="hidden sm:inline">{day.label.slice(0, 3)}</span>
                  <span className="sm:hidden">{day.short}</span>
                  {count > 0 && (
                    <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white' : 'bg-emerald-500'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Range hint */}
        {rangeStart !== null && (
          <div className={`px-4 sm:px-6 py-2 text-[11px] font-medium border-b ${border} ${dark ? 'bg-sky-950/40 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            Desde <span className="font-bold">{rangeStart}</span> — toca otro horario para completar el rango
          </div>
        )}

        {/* Slot grid */}
        {loading && !Object.keys(availability).length ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className={`animate-spin rounded-full h-6 w-6 border-2 ${dark ? 'border-gray-700 border-t-gray-300' : 'border-gray-200 border-t-gray-600'}`} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-5 custom-scrollbar">
            {/* 4 cols on mobile, 8 on desktop */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-1">
              {SLOTS.map(time => {
                const selected = daySlots.includes(time)
                const isHour = time.endsWith(':00')
                const isAnchor = rangeStart === time

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleSlot(time)}
                    // ↓ taller tap target on mobile
                    className={`py-3 sm:py-2 rounded-lg sm:rounded text-[12px] sm:text-[11px] font-medium tabular-nums transition
                      ${isAnchor ? (dark ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-gray-900' : 'ring-2 ring-sky-400 ring-offset-1') : ''}
                      ${selected
                        ? dark
                          ? 'bg-slate-600 text-slate-200'
                          : 'bg-slate-200 text-slate-800 border border-slate-300'
                        : dark
                          ? `${isHour ? 'bg-slate-800' : 'bg-slate-800/50'} text-slate-500 hover:bg-slate-700 hover:text-slate-300`
                          : `bg-white border ${isHour ? 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700' : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`
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
        <div className={`shrink-0 border-t ${border} ${dark ? 'bg-gray-900' : 'bg-white'}`}>
          {/* mobile: stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-3 sm:py-3">
            <button
              type="button"
              onClick={applyToAllDays}
              disabled={daySlots.length === 0}
              className={`text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed text-left ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              Aplicar a toda la semana
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded-md transition ${dark ? 'text-gray-300 hover:bg-gray-800 border border-gray-700' : 'text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 text-xs font-bold rounded-lg sm:rounded-md transition-all duration-200 disabled:opacity-50 ${
                  saved
                    ? 'bg-emerald-500 text-white'
                    : dark
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-linear-to-r from-sky-500 to-teal-500 hover:to-teal-600 text-white active:scale-[0.98]'
                }`}
              >
                {saved ? (
                  <><Check className="w-3.5 h-3.5" /> ¡Guardado!</>
                ) : loading ? (
                  'Guardando…'
                ) : (
                  <><Wallet className="w-3.5 h-3.5" /> Guardar</>
                )}
              </button>
            </div>
          </div>
          <div className="sm:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>

      </motion.div>
    </motion.div>
  )
}

export default AvailabilityManager