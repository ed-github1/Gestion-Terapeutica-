import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Smile, Meh, Frown, HeartCrack, Moon, Zap, X, Send, Loader2 } from 'lucide-react'
import { useAuth } from '@features/auth/AuthContext'
import { diaryService } from '@shared/services/diaryService'
import { patientsService } from '@shared/services/patientsService'

const MOODS = [
  { key: 'bien',    label: 'Bien',    Icon: Smile,      bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-300 dark:ring-emerald-700', dot: 'bg-emerald-500' },
  { key: 'regular', label: 'Regular', Icon: Meh,        bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800',   ring: 'ring-amber-300 dark:ring-amber-700',   dot: 'bg-amber-500'   },
  { key: 'triste',  label: 'Triste',  Icon: Frown,      bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-800',     ring: 'ring-blue-300 dark:ring-blue-700',     dot: 'bg-blue-500'    },
  { key: 'dolor',   label: 'Dolor',   Icon: HeartCrack, bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-800',     ring: 'ring-rose-300 dark:ring-rose-700',     dot: 'bg-rose-500'    },
  { key: 'cansado', label: 'Cansado', Icon: Moon,       bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-600 dark:text-indigo-400',   border: 'border-indigo-200 dark:border-indigo-800', ring: 'ring-indigo-300 dark:ring-indigo-700', dot: 'bg-indigo-500'  },
  { key: 'ansioso', label: 'Ansioso', Icon: Zap,        bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-800', ring: 'ring-orange-300 dark:ring-orange-700', dot: 'bg-orange-500'  },
]

const STORAGE_KEY = 'diary_checked_today'
const todayKey = () => new Date().toISOString().slice(0, 10)

export function hasCheckedInToday() {
  return localStorage.getItem(STORAGE_KEY) === todayKey()
}

function markCheckedIn() {
  localStorage.setItem(STORAGE_KEY, todayKey())
}

const DailyCheckInModal = ({ onSaved, onClose }) => {
  const { user } = useAuth()
  const [patientId, setPatientId] = useState(user?.patientId || user?.patient_id || null)
  const [mood, setMood]           = useState('bien')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (patientId) return
    patientsService.getMyProfile()
      .then(res => {
        const p = res?.data?.data || res?.data
        const id = p?._id || p?.id || user?.id || user?._id
        if (id) setPatientId(id)
      })
      .catch(() => setPatientId(user?.id || user?._id || null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    markCheckedIn()
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await diaryService.addNote(patientId, { mood, notes: notes.trim() })
      const entry = res?.data?.data ?? res?.data ?? {
        id: Date.now(), date: new Date().toISOString(), mood, notes: notes.trim(),
      }
      markCheckedIn()
      onSaved(entry)
      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || user?.firstName || ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={dismiss}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ y: 64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 64, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full md:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl shadow-2xl px-6 pt-6 pb-8 md:pb-6"
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden w-10 h-1 rounded-full bg-stone-200 dark:bg-gray-600 mx-auto mb-5" />

        <button
          onClick={dismiss}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-gray-700 text-stone-400 hover:text-stone-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <p className="text-xs font-medium text-stone-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </p>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">¿Cómo te sientes hoy?</h2>
        </div>

        {/* Mood grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {MOODS.map(({ key, label, Icon, bg, text, border, ring, dot }) => {
            const active = mood === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMood(key)}
                className={`relative flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all select-none
                  ${active
                    ? `${bg} ${text} ${border} ring-2 ring-offset-1 ${ring} scale-[1.04]`
                    : 'bg-stone-50 dark:bg-gray-700 border-stone-100 dark:border-gray-600 text-stone-400 dark:text-gray-500 hover:bg-stone-100 dark:hover:bg-gray-600'
                  }`}
              >
                {active && (
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${dot}`} />
                )}
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            )
          })}
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¿Algo más que quieras registrar? (opcional)"
          rows={2}
          className="w-full px-3.5 py-2.5 text-sm border border-stone-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none bg-stone-50 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 resize-none mb-4"
        />

        <AnimatePresence>
          {error && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 mb-3">{error}</motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-gray-600 text-sm text-stone-500 dark:text-gray-400 hover:bg-stone-50 dark:hover:bg-gray-700 transition font-medium"
          >
            Ahora no
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Send className="w-3.5 h-3.5" /> Guardar</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DailyCheckInModal
