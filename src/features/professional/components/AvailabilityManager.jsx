import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, X, Check, Zap } from 'lucide-react'
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
  { value: 0, label: 'Domingo', short: 'D' },
]

const SLOTS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

// Quick-fill presets — (1) applied to active day only
const PRESETS = [
  { label: 'Mañana', range: '8–14h', slots: SLOTS.slice(8, 14) },
  { label: 'Tarde', range: '14–20h', slots: SLOTS.slice(14, 20) },
  { label: '9–18h', range: 'jornada completa', slots: SLOTS.slice(9, 18) },
]

function addOneHour(time) {
  const idx = SLOTS.indexOf(time)
  if (idx === -1) return time
  if (idx === SLOTS.length - 1) return '24:00'
  return SLOTS[idx + 1]
}

function slotsToRanges(slots) {
  if (!slots?.length) return []
  const sorted = [...slots].filter(t => t.endsWith(':00')).sort()
  const ranges = []
  let start = sorted[0]
  let prevIdx = SLOTS.indexOf(start)
  for (let i = 1; i < sorted.length; i++) {
    const idx = SLOTS.indexOf(sorted[i])
    if (idx !== prevIdx + 1) {
      ranges.push([start, addOneHour(sorted[i - 1])])
      start = sorted[i]
    }
    prevIdx = idx
  }
  ranges.push([start, addOneHour(sorted[sorted.length - 1])])
  return ranges
}

// ─── Week heatmap ─────────────────────────────────────────────────────────────
const WeekHeatmap = ({ availability, activeDay, onDayClick, dark }) => {
  const counts = DAYS.map(d => (availability[d.value] || []).length)
  const max = Math.max(...counts, 1)
  return (
    <div className="flex items-end gap-1 h-6">
      {DAYS.map((d, i) => {
        const h = counts[i]
        const isActive = d.value === activeDay
        const heightPct = h > 0 ? Math.max((h / max) * 100, 18) : 8
        return (
          <button
            key={d.value}
            type="button"
            title={`${d.label}: ${h}h`}
            onClick={() => onDayClick(d.value)}
            className={`flex-1 rounded-sm transition-all duration-200 ${isActive
                ? 'bg-blue-500'
                : h > 0
                  ? dark ? 'bg-emerald-500/70' : 'bg-emerald-400'
                  : dark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            style={{ height: `${heightPct}%` }}
          />
        )
      })}
    </div>
  )
}

const AvailabilityManager = ({ onClose, embedded = false }) => {
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
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
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

  const applyPreset = (slots) => {
    setAvailability(prev => {
      const cur = prev[activeDay] || []
      const allOn = slots.every(s => cur.includes(s))
      const next = allOn
        ? cur.filter(s => !slots.includes(s))
        : [...new Set([...cur, ...slots])].sort()
      return { ...prev, [activeDay]: next }
    })
    setRangeStart(null)
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

  const totalHours = useMemo(() => {
    let n = 0
    DAYS.forEach(d => { n += (availability[d.value] || []).filter(t => t.endsWith(':00')).length })
    return n
  }, [availability])

  const border = dark ? 'border-gray-800' : 'border-gray-200'

  // ─── Shared sub-components ──────────────────────────────────────────────────

  const DaySelector = () => (
    <div className={`flex gap-1 pb-3 border-b ${border}`}>
      {DAYS.map(day => {
        const count = (availability[day.value] || []).length
        const isActive = day.value === activeDay
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => { setActiveDay(day.value); setRangeStart(null) }}
            className={`relative flex-1 min-w-0 py-2 rounded-md text-xs font-medium transition-all ${isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : dark
                  ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
          >
            <span className="hidden sm:inline">{day.label.slice(0, 3)}</span>
            <span className="sm:hidden">{day.short}</span>
            {count > 0 && (
              <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-emerald-500'
                }`} />
            )}
          </button>
        )
      })}
    </div>
  )

  const Presets = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
        <Zap className="w-3 h-3" /> Preset
      </span>
      {PRESETS.map(p => {
        const allOn = p.slots.every(s => daySlots.includes(s))
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.slots)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${allOn
                ? 'bg-blue-600 text-white border-blue-600'
                : dark
                  ? 'border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400'
                  : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
          >
            {p.label} <span className={`font-normal ${allOn ? 'text-blue-200' : dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.range}</span>
          </button>
        )
      })}
      {daySlots.length > 0 && (
        <button
          type="button"
          onClick={clearDay}
          className={`ml-auto text-[11px] font-medium transition ${dark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
        >
          Limpiar día
        </button>
      )}
    </div>
  )

  const SlotGrid = ({ offsetClass = '' }) => (
    loading && !Object.keys(availability).length ? (
      <div className="flex items-center justify-center p-10">
        <div className={`animate-spin rounded-full h-6 w-6 border-2 ${dark ? 'border-gray-700 border-t-gray-300' : 'border-gray-200 border-t-gray-600'}`} />
      </div>
    ) : (
      <>
        {/* Empty state */}
        <AnimatePresence>
          {daySlots.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl text-center ${dark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
            >
              <Clock className={`w-7 h-7 ${dark ? 'text-gray-600' : 'text-gray-300'}`} strokeWidth={1.5} />
              <div>
                <p className={`text-[13px] font-semibold ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Sin horarios para {DAYS.find(d => d.value === activeDay)?.label}
                </p>
                <p className={`text-[11px] mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Usa un preset o toca los horarios abajo para agregar disponibilidad
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className={`grid grid-cols-4 sm:grid-cols-6 gap-1 ${offsetClass}`}>
          {SLOTS.map(time => {
            const selected = daySlots.includes(time)
            const isAnchor = rangeStart === time
            return (
              <button
                key={time}
                type="button"
                onClick={() => toggleSlot(time)}
                className={`py-2 rounded-lg text-[11px] font-medium tabular-nums transition-all duration-150
                  ${isAnchor ? (dark ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-gray-900' : 'ring-2 ring-sky-400 ring-offset-1') : ''}
                  ${selected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : dark
                      ? 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
                      : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {time}
              </button>
            )
          })}
        </div>
      </>
    )
  )

  // ─── Embedded ───────────────────────────────────────────────────────────────
  if (embedded) return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Disponibilidad</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Configura los horarios en que atiendes pacientes</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {totalHours}h / semana
            </span>
            <WeekHeatmap
              availability={availability}
              activeDay={activeDay}
              onDayClick={d => { setActiveDay(d); setRangeStart(null) }}
              dark={dark}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <DaySelector />
        <Presets />

        {/* Range hint */}
        {rangeStart !== null && (
          <div className={`px-3 py-2 text-[11px] font-medium rounded-lg ${dark ? 'bg-sky-950/40 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            Desde <span className="font-bold">{rangeStart}</span> — toca otro horario para completar el rango
          </div>
        )}

        <SlotGrid />

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t ${border}`}>
          <button
            type="button"
            onClick={applyToAllDays}
            disabled={daySlots.length === 0}
            className={`text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Aplicar a toda la semana
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
              }`}
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> Guardado</> : loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── Modal (portal) ─────────────────────────────────────────────────────────
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[88dvh] overflow-hidden flex flex-col rounded-xl shadow-xl ${dark ? 'bg-gray-900' : 'bg-white'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">Configuración</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Disponibilidad</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-gray-950 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {totalHours}h
              </span>
              <WeekHeatmap
                availability={availability}
                activeDay={activeDay}
                onDayClick={d => { setActiveDay(d); setRangeStart(null) }}
                dark={dark}
              />
            </div>
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
        <div className={`px-5 pb-3 border-b ${border}`}>
          <DaySelector />
        </div>

        {/* Presets */}
        <div className={`px-5 py-2.5 border-b ${border}`}>
          <Presets />
        </div>

        {/* Range hint */}
        {rangeStart !== null && (
          <div className={`px-5 py-2 text-[11px] font-medium border-b ${border} ${dark ? 'bg-sky-950/40 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            Desde <span className="font-bold">{rangeStart}</span> — toca otro horario para completar el rango
          </div>
        )}

        {/* Slot grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 custom-scrollbar space-y-3">
          <SlotGrid />
        </div>

        {/* Footer */}
        <div className={`shrink-0 border-t ${border} ${dark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex items-center justify-between gap-2 px-5 py-3">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${dark ? 'text-gray-300 hover:bg-gray-800 border border-gray-700' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-50 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                  }`}
              >
                {saved ? <><Check className="w-3.5 h-3.5" /> Guardado</> : loading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default AvailabilityManager
