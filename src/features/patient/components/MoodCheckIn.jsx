/**
 * MoodCheckIn.jsx
 * Quick daily mood tracker (5-point scale) embedded directly in the patient dashboard.
 * Stores today's mood in localStorage and optionally appends it to the diary via API.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth/AuthContext'
import { diaryService } from '@shared/services/diaryService'

const MOODS = [
  { value: 1, emoji: '😞', label: 'Muy mal',  color: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'     },
  { value: 2, emoji: '😕', label: 'Mal',       color: 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' },
  { value: 3, emoji: '😐', label: 'Regular',   color: 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200' },
  { value: 4, emoji: '🙂', label: 'Bien',      color: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'     },
  { value: 5, emoji: '😄', label: 'Muy bien',  color: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' },
]

const STORAGE_KEY = 'patientMoodHistory'
const todayKey = () => new Date().toISOString().slice(0, 10)

const MoodCheckIn = () => {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [history, setHistory]   = useState([]) // last 7 days

  // Load existing history and today's entry
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      const today = raw[todayKey()]
      if (today !== undefined) {
        setSelected(today)
        setSaved(true)
      }
      // Build last-7-days array
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const k = d.toISOString().slice(0, 10)
        return { key: k, value: raw[k] ?? null }
      }).reverse()
      setHistory(days)
    } catch { /* ignore */ }
  }, [])

  const handleSelect = async (value) => {
    if (saved) return
    setSelected(value)
    setSaving(true)

    // Persist locally
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      raw[todayKey()] = value
      // Keep only last 30 days
      const keys = Object.keys(raw).sort()
      if (keys.length > 30) delete raw[keys[0]]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))

      // Rebuild history
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const k = d.toISOString().slice(0, 10)
        return { key: k, value: raw[k] ?? null }
      }).reverse()
      setHistory(days)
    } catch { /* ignore */ }

    // Optionally push to diary
    try {
      const patientId = user?._id || user?.id
      if (patientId) {
        const mood = MOODS.find((m) => m.value === value)
        await diaryService.addNote(patientId, {
          type: 'mood',
          content: `Estado de ánimo: ${mood.emoji} ${mood.label} (${value}/5)`,
          mood: value,
          date: new Date().toISOString(),
        })
      }
    } catch { /* diary push is best-effort */ }

    setSaving(false)
    setSaved(true)
  }

  const selectedMood = MOODS.find((m) => m.value === selected)

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
          ¿Cómo te encuentras hoy?
        </p>
        {saved && selectedMood && (
          <span className="text-xs font-semibold text-stone-500">
            {selectedMood.emoji} {selectedMood.label}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!saved ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 justify-between"
          >
            {MOODS.map((mood) => (
              <motion.button
                key={mood.value}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.9 }}
                disabled={saving}
                onClick={() => handleSelect(mood.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${mood.color} ${
                  selected === mood.value ? 'ring-2 ring-offset-1 ring-stone-400' : ''
                } ${saving ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span className="text-xl leading-none">{mood.emoji}</span>
                <span className="text-[10px] font-semibold leading-none">{mood.label}</span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl">{selectedMood?.emoji}</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-stone-700">
                Registrado: {selectedMood?.label}
              </p>
              <p className="text-[11px] text-stone-400">Vuelve mañana para tu próximo registro</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-day history dots */}
      {history.some((d) => d.value !== null) && (
        <div className="mt-3 flex items-end gap-1.5 justify-between">
          {history.map((day, i) => {
            const isToday = i === history.length - 1
            const mood = MOODS.find((m) => m.value === day.value)
            return (
              <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                {day.value !== null ? (
                  <span title={mood?.label} className="text-sm leading-none">{mood?.emoji}</span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-stone-100 block" />
                )}
                <span className={`text-[9px] font-medium ${isToday ? 'text-blue-500' : 'text-stone-300'}`}>
                  {isToday
                    ? 'Hoy'
                    : new Date(day.key + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MoodCheckIn
