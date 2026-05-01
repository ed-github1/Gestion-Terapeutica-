import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Smile, Meh, Frown, HeartCrack, Moon, Zap,
  BookOpen, PenLine, Send, Loader2, Check,
} from 'lucide-react'
import { useAuth } from '@features/auth/AuthContext'
import { diaryService } from '@shared/services/diaryService'
import { patientsService } from '@shared/services/patientsService'

const MOODS = [
  {
    key: 'bien', label: 'Bien', Icon: Smile,
    pill: 'bg-emerald-500 text-white ring-emerald-300 dark:ring-emerald-700',
    dim:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    bar:  'bg-emerald-500',
  },
  {
    key: 'regular', label: 'Regular', Icon: Meh,
    pill: 'bg-amber-500 text-white ring-amber-300 dark:ring-amber-700',
    dim:  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    bar:  'bg-amber-500',
  },
  {
    key: 'triste', label: 'Triste', Icon: Frown,
    pill: 'bg-blue-500 text-white ring-blue-300 dark:ring-blue-700',
    dim:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    bar:  'bg-blue-500',
  },
  {
    key: 'dolor', label: 'Dolor', Icon: HeartCrack,
    pill: 'bg-rose-500 text-white ring-rose-300 dark:ring-rose-700',
    dim:  'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    bar:  'bg-rose-500',
  },
  {
    key: 'cansado', label: 'Cansado', Icon: Moon,
    pill: 'bg-indigo-500 text-white ring-indigo-300 dark:ring-indigo-700',
    dim:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    bar:  'bg-indigo-500',
  },
  {
    key: 'ansioso', label: 'Ansioso', Icon: Zap,
    pill: 'bg-orange-500 text-white ring-orange-300 dark:ring-orange-700',
    dim:  'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
    bar:  'bg-orange-500',
  },
]

const EMOJI_TO_KEY = { '😊': 'bien', '😐': 'regular', '😔': 'triste', '😣': 'dolor', '😴': 'cansado', '😰': 'ansioso' }
const normalizeMood = (v) => EMOJI_TO_KEY[v] || v || 'bien'
const moodOf = (key) => MOODS.find(m => m.key === normalizeMood(key)) || MOODS[0]

function fmtRel(ds) {
  const d    = new Date(ds)
  const diff = Math.floor((Date.now() - d) / 86_400_000)
  const t    = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Hoy · ${t}`
  if (diff === 1) return `Ayer · ${t}`
  if (diff < 7)  return `Hace ${diff} días`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

const EMPTY_FORM = { mood: 'bien', notes: '' }

const EntryCard = ({ entry, index }) => {
  const m = moodOf(entry.mood)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      className="flex bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden"
    >
      <div className={`w-1 shrink-0 ${m.bar}`} />
      <div className="flex-1 px-3 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${m.dim}`}>
            <m.Icon className="w-3 h-3" strokeWidth={2.2} />
            {m.label}
          </span>
          <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
            {fmtRel(entry.date || entry.createdAt)}
          </span>
        </div>
        {entry.notes && (
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
            {entry.notes}
          </p>
        )}
      </div>
    </motion.div>
  )
}

const DiaryWidget = ({ refreshKey = 0 }) => {
  const { user } = useAuth()
  const [patientId, setPatientId] = useState(user?.patientId || user?.patient_id || null)

  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [savedFlash, setSavedFlash]   = useState(false)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (patientId) return
    patientsService.getMyProfile()
      .then(res => {
        const p  = res?.data?.data || res?.data
        const id = p?._id || p?.id || user?.id || user?._id
        if (id) setPatientId(id)
      })
      .catch(() => setPatientId(user?.id || user?._id || null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!patientId) { setLoading(false); return }
    try {
      const res = await diaryService.getNotes(patientId)
      const raw = res?.data?.data ?? res?.data ?? []
      setEntries(Array.isArray(raw) ? raw.slice(0, 5) : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (refreshKey > 0) load()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.notes.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res      = await diaryService.addNote(patientId, { mood: form.mood, notes: form.notes.trim() })
      const entry    = res?.data?.data ?? res?.data
      const newEntry = entry || { id: Date.now(), date: new Date().toISOString(), mood: form.mood, notes: form.notes.trim() }
      setEntries(prev => [newEntry, ...prev].slice(0, 5))
      setForm(EMPTY_FORM)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2500)
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
      className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">Mi Diario</p>
      </div>

      {/* Compose card */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        {/* Mood pills */}
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2.5">
          ¿Cómo te sientes?
        </p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {MOODS.map(({ key, label, Icon, pill, dim }) => {
            const active = form.mood === key
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setForm(f => ({ ...f, mood: key }))}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all duration-150
                  ${active
                    ? `${pill} border-transparent ring-2 ring-offset-1 dark:ring-offset-gray-800`
                    : `${dim} hover:opacity-80`
                  }`}
              >
                <Icon className="w-3 h-3" strokeWidth={active ? 2.3 : 1.8} />
                {label}
              </motion.button>
            )
          })}
        </div>

        {/* Notebook textarea */}
        <form onSubmit={handleSave}>
          <div className="relative rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="absolute top-0 bottom-0 left-9 w-px bg-rose-300/40 dark:bg-rose-500/20 pointer-events-none" />
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(e) }}
              placeholder="Escribe cómo te has sentido hoy…"
              rows={4}
              className="w-full outline-none resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
              style={{
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '48px',
                paddingRight: '44px',
                lineHeight: '1.75rem',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent calc(1.75rem - 1px), color-mix(in srgb, currentColor 7%, transparent) calc(1.75rem - 1px), color-mix(in srgb, currentColor 7%, transparent) 1.75rem)',
                backgroundSize: '100% 1.75rem',
                backgroundPositionY: '12px',
              }}
            />
            <div className="absolute right-2.5 bottom-2.5">
              <motion.button
                type="submit"
                disabled={saving || !form.notes.trim()}
                whileTap={{ scale: 0.88 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all duration-150
                  ${savedFlash
                    ? 'bg-emerald-500 text-white'
                    : form.notes.trim()
                      ? 'bg-gray-700 hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }`}
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : savedFlash
                    ? <Check className="w-3.5 h-3.5" />
                    : <Send className="w-3 h-3" />
                }
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-1.5 text-xs text-rose-500 dark:text-rose-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Entries */}
      <div className="px-4 pt-3 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-5 gap-1.5">
            <PenLine className="w-7 h-7 text-gray-200 dark:text-gray-700" strokeWidth={1.2} />
            <p className="text-xs text-gray-400 dark:text-gray-500">Escribe tu primera entrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <EntryCard key={entry._id || entry.id || i} entry={entry} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default DiaryWidget
