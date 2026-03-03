import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Smile, Meh, Frown, HeartCrack, Moon, Zap,
  BookOpen, Loader2, Send, Clock,
} from 'lucide-react'
import { useAuth } from '@features/auth/AuthContext'
import { diaryService } from '@shared/services/diaryService'
import { patientsService } from '@shared/services/patientsService'

const MOOD_OPTIONS = [
  { key: 'bien',    label: 'Bien',    Icon: Smile,      colors: 'bg-green-50  text-green-600  border-green-200  ring-green-300'  },
  { key: 'regular', label: 'Regular', Icon: Meh,        colors: 'bg-yellow-50 text-yellow-600 border-yellow-200 ring-yellow-300' },
  { key: 'triste',  label: 'Triste',  Icon: Frown,      colors: 'bg-blue-50   text-blue-600   border-blue-200   ring-blue-300'   },
  { key: 'dolor',   label: 'Dolor',   Icon: HeartCrack, colors: 'bg-red-50    text-red-600    border-red-200    ring-red-300'    },
  { key: 'cansado', label: 'Cansado', Icon: Moon,       colors: 'bg-sky-50    text-sky-600    border-sky-200    ring-sky-300'    },
  { key: 'ansioso', label: 'Ansioso', Icon: Zap,        colors: 'bg-orange-50 text-orange-600 border-orange-200 ring-orange-300' },
]

const EMPTY_FORM = { mood: 'bien', notes: '' }

function moodOption(key) {
  return MOOD_OPTIONS.find(m => m.key === key) || MOOD_OPTIONS[0]
}

function relDate(ds) {
  const d    = new Date(ds)
  const diff = Math.floor((Date.now() - d) / 86_400_000)
  const t    = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Hoy · ${t}`
  if (diff === 1) return `Ayer · ${t}`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

const DiaryWidget = () => {
  const { user } = useAuth()
  // Prefer the Patient document ID (matches what professional uses),
  // resolved from the profile API. Falls back to user id.
  const [patientId, setPatientId] = useState(
    user?.patientId || user?.patient_id || null
  )

  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // Resolve the correct Patient document _id on mount
  useEffect(() => {
    if (patientId) return // already resolved
    patientsService.getMyProfile()
      .then(res => {
        const p = res?.data?.data || res?.data
        const id = p?._id || p?.id || user?.id || user?._id
        if (id) setPatientId(id)
      })
      .catch(() => {
        setPatientId(user?.id || user?._id || null)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!patientId) { setLoading(false); return }
    try {
      const res = await diaryService.getNotes(patientId)
      const raw = res?.data?.data ?? res?.data ?? []
      setEntries(Array.isArray(raw) ? raw.slice(0, 4) : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load() }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.notes.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await diaryService.addNote(patientId, {
        mood:  form.mood,
        notes: form.notes.trim(),
      })
      const entry = res?.data?.data ?? res?.data
      const newEntry = entry || { id: Date.now(), date: new Date().toISOString(), mood: form.mood, notes: form.notes.trim() }
      setEntries(prev => [newEntry, ...prev].slice(0, 4))
      setForm(EMPTY_FORM)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-bold text-stone-900">Mi Diario</p>
      </div>

      {/* Compose — always visible */}
      <form onSubmit={handleSave} className="px-5 py-4 space-y-3 border-b border-stone-100">
        {/* Mood selector */}
        <div className="flex gap-1.5 flex-wrap">
          {MOOD_OPTIONS.map(({ key, label, Icon, colors }) => {
            const active = form.mood === key
            const parts  = colors.trim().split(/\s+/)
            const [bg, text, border, ring] = parts
            return (
              <button
                key={key}
                type="button"
                onClick={() => setForm(f => ({ ...f, mood: key }))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition select-none
                  ${active
                    ? `${bg} ${text} ${border} ring-2 ring-offset-1 ${ring}`
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Textarea + send button */}
        <div className="relative">
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(e) }}
            placeholder="¿Cómo te sientes hoy? (Ctrl+Enter para guardar)"
            rows={2}
            className="w-full px-3 py-2.5 pr-10 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none bg-stone-50 resize-none"
          />
          <motion.button
            type="submit"
            disabled={saving || !form.notes.trim()}
            whileTap={{ scale: 0.92 }}
            className="absolute right-2.5 bottom-2.5 w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Guardar"
          >
            {saving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3 h-3" />
            }
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500">{error}</motion.p>
          )}
          {savedFlash && (
            <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-emerald-600 font-medium">✓ Entrada guardada</motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* Entries list */}
      <div className="px-5 pb-4 pt-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-12 bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-5 gap-1.5">
            <BookOpen className="w-8 h-8 text-stone-200" strokeWidth={1.2} />
            <p className="text-xs text-stone-400">Sin entradas todavía. ¡Escribe la primera!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const m = moodOption(entry.mood)
              const parts = m.colors.trim().split(/\s+/)
              const [bg, text, border] = parts
              return (
                <motion.div
                  key={entry._id || entry.id || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50"
                >
                  <span className={`shrink-0 mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium ${bg} ${text} ${border}`}>
                    <m.Icon className="w-3 h-3" strokeWidth={2} />
                    {m.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    {entry.notes && (
                      <p className="text-xs text-stone-700 leading-snug line-clamp-2">{entry.notes}</p>
                    )}
                    <p className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                      <Clock className="w-2.5 h-2.5" />
                      {relDate(entry.date || entry.createdAt)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default DiaryWidget
