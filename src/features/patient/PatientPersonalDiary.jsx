import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../auth'
import { diaryService } from '@shared/services/diaryService'

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Bien' },
  { emoji: '😐', label: 'Regular' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😣', label: 'Dolor' },
  { emoji: '😴', label: 'Cansado' },
  { emoji: '😰', label: 'Ansioso' },
]

const EMPTY_FORM = { mood: '😊', symptoms: '', activities: '', notes: '' }

function formatRelativeDate(dateString) {
  const date = new Date(dateString)
  const diffDays = Math.floor((Date.now() - date) / 86_400_000)
  const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `Hoy · ${time}`
  if (diffDays === 1) return `Ayer · ${time}`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function moodColor(emoji) {
  const map = {
    '😊': 'bg-green-100 text-green-700',
    '😐': 'bg-yellow-100 text-yellow-700',
    '😔': 'bg-blue-100 text-blue-700',
    '😣': 'bg-red-100 text-red-700',
    '😴': 'bg-purple-100 text-purple-700',
    '😰': 'bg-orange-100 text-orange-700',
  }
  return map[emoji] || 'bg-gray-100 text-gray-700'
}

const DiaryEntry = ({ entry, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3 mb-3 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${moodColor(entry.mood)}`}>
        {entry.mood} {MOOD_OPTIONS.find(m => m.emoji === entry.mood)?.label ?? ''}
      </span>
      <p className="text-xs text-gray-400">{formatRelativeDate(entry.date || entry.createdAt)}</p>
    </div>

    {(entry.symptoms || entry.activities) && (
      <div className="flex flex-wrap gap-2 mb-3">
        {entry.symptoms && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {entry.symptoms}
          </span>
        )}
        {entry.activities && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {entry.activities}
          </span>
        )}
      </div>
    )}

    {entry.notes && (
      <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-3">{entry.notes}</p>
    )}
  </motion.div>
)

const PatientPersonalDiary = ({ onClose }) => {
  const { user } = useAuth()
  const patientId = user?.patientId || user?.id || user?._id

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isAdding, setIsAdding] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!patientId) { setLoading(false); return }
    try {
      setLoading(true)
      const res = await diaryService.getNotes(patientId)
      const raw = res?.data?.data ?? res?.data ?? []
      setEntries(Array.isArray(raw) ? raw : [])
    } catch (err) {
      console.error('Error loading diary entries:', err)
      setError('No se pudieron cargar las entradas.')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.notes.trim()) return
    if (!patientId) { setError('No se puede identificar al paciente.'); return }

    setSaving(true)
    setError(null)
    try {
      const res = await diaryService.addNote(patientId, {
        mood: form.mood,
        symptoms: form.symptoms.trim(),
        activities: form.activities.trim(),
        notes: form.notes.trim(),
      })
      const saved = res?.data?.data ?? res?.data
      const newEntry = saved || { id: Date.now(), date: new Date().toISOString(), ...form }
      setEntries(prev => [newEntry, ...prev])
      setForm(EMPTY_FORM)
      setIsAdding(false)
    } catch (err) {
      console.error('Error saving diary entry:', err)
      setError('Error al guardar la entrada. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const cancelAdd = () => { setIsAdding(false); setForm(EMPTY_FORM); setError(null) }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Mi Diario de Salud</h2>
            <p className="text-blue-100 text-xs mt-0.5">Registra cómo te sientes cada día</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="hover:text-red-900">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add button / form */}
          <AnimatePresence mode="wait">
            {!isAdding ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 font-medium text-sm hover:border-blue-400 hover:bg-blue-50/50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva entrada
              </motion.button>
            ) : (
              <motion.form
                key="add-form"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleSubmit}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4"
              >
                <h3 className="font-semibold text-gray-900 text-sm">Nueva entrada</h3>

                {/* Mood */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">¿Cómo te sientes hoy?</p>
                  <div className="flex gap-2 flex-wrap">
                    {MOOD_OPTIONS.map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, mood: emoji }))}
                        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition border
                          ${form.mood === emoji
                            ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-300'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        <span className="text-xl">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms & Activities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Síntomas <span className="text-gray-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.symptoms}
                      onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                      placeholder="Ej: dolor de cabeza…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Actividades <span className="text-gray-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.activities}
                      onChange={e => setForm(f => ({ ...f, activities: e.target.value }))}
                      placeholder="Ej: ejercicio, medicación…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Notas <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Escribe cómo te has sentido hoy…"
                    rows={3}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-gray-50 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <motion.button
                    type="submit"
                    disabled={saving || !form.notes.trim()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {saving ? 'Guardando…' : 'Guardar entrada'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={cancelAdd}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Entries list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-20 h-6 bg-gray-200 rounded-full" />
                    <div className="w-32 h-5 bg-gray-100 rounded-full" />
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full mb-2" />
                  <div className="w-3/4 h-4 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800 mb-1">Sin entradas todavía</p>
              <p className="text-sm text-gray-500">Crea tu primera entrada para comenzar el seguimiento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <DiaryEntry key={entry._id || entry.id || i} entry={entry} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            💡 Llevar un diario ayuda a ti y a tu profesional a entender mejor tu progreso
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientPersonalDiary
