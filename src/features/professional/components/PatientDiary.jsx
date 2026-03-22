import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { diaryService } from '@shared/services/diaryService'
import { useAuth } from '../../auth'
import {
    BookOpen, X, Send, AlertCircle, FileText, ClipboardList,
    Activity, Star, Loader2, MessageSquarePlus, CheckCircle2,
    Smile, Meh, Frown, HeartCrack, Moon, Zap,
} from 'lucide-react'
import HomeworkPanel from './HomeworkPanel'

// ─── Mood system — supports both legacy emojis and new string keys ────────────
const MOOD_MAP = {
    // New string keys (DiaryWidget)
    bien:    { label: 'Bien',    Icon: Smile,      bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    regular: { label: 'Regular', Icon: Meh,        bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    triste:  { label: 'Triste',  Icon: Frown,      bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    dolor:   { label: 'Dolor',   Icon: HeartCrack, bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
    cansado: { label: 'Cansado', Icon: Moon,       bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-200'    },
    ansioso: { label: 'Ansioso', Icon: Zap,        bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    // Legacy emoji keys
    '😊': { label: 'Bien',    Icon: Smile,      bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    '😐': { label: 'Regular', Icon: Meh,        bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    '😔': { label: 'Triste',  Icon: Frown,      bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    '😣': { label: 'Dolor',   Icon: HeartCrack, bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
    '😴': { label: 'Cansado', Icon: Moon,       bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-200'    },
    '😰': { label: 'Ansioso', Icon: Zap,        bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

function getMood(key) {
    return MOOD_MAP[key] || { label: key || '—', Icon: Smile, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
}

function formatRelativeDate(dateString) {
    const date = new Date(dateString)
    const diffDays = Math.floor((Date.now() - date) / 86_400_000)
    const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 0) return `Hoy · ${time}`
    if (diffDays === 1) return `Ayer · ${time}`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Star rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && onChange(n)}
                className={`transition ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
                aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            >
                <Star
                    className={`w-4 h-4 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`}
                    strokeWidth={1.5}
                />
            </button>
        ))}
    </div>
)

// ─── Per-entry evaluation panel ───────────────────────────────────────────────
const EvaluationPanel = ({ entry, patientId, authorName, onSaved }) => {
    const existing = entry.evaluation
    const [open, setOpen]       = useState(false)
    const [rating, setRating]   = useState(existing?.rating || 0)
    const [comment, setComment] = useState(existing?.comment || '')
    const [saving, setSaving]   = useState(false)
    const [error, setError]     = useState(null)

    const handleSave = async () => {
        if (!rating) return
        setSaving(true)
        setError(null)
        try {
            const res = await diaryService.evaluateNote(patientId, entry._id || entry.id, {
                rating,
                comment: comment.trim(),
                evaluatedBy: authorName,
            })
            const updated = res?.data?.data ?? res?.data ?? entry
            onSaved(updated)
            setOpen(false)
        } catch {
            setError('No se pudo guardar. Intenta de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="border-t border-stone-100 mt-3 pt-3">
            {existing && !open ? (
                // Show saved evaluation
                <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                            <StarRating value={existing.rating} readOnly />
                            <span className="text-[10px] text-stone-400">{existing.evaluatedBy || 'Profesional'}</span>
                        </div>
                        {existing.comment && (
                            <p className="text-xs text-stone-600 italic leading-snug">"{existing.comment}"</p>
                        )}
                    </div>
                    <button
                        onClick={() => { setOpen(true); setRating(existing.rating); setComment(existing.comment || '') }}
                        className="text-[11px] text-blue-600 hover:underline shrink-0"
                    >
                        Editar
                    </button>
                </div>
            ) : !open ? (
                // Prompt to evaluate
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-blue-600 transition-colors font-medium"
                >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Evaluar esta entrada
                </button>
            ) : (
                // Evaluation form
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-stone-600">Evaluación profesional</p>
                            <button onClick={() => setOpen(false)} className="text-stone-300 hover:text-stone-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <StarRating value={rating} onChange={setRating} />
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Observación clínica (opcional)…"
                            rows={2}
                            className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-stone-50 resize-none"
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={!rating || saving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {saving ? 'Guardando…' : 'Guardar evaluación'}
                            </button>
                            <button
                                onClick={() => { setOpen(false); setError(null) }}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-medium transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}

// ─── Entry cards ──────────────────────────────────────────────────────────────
const PatientEntryCard = ({ entry, index, patientId, authorName, onEntryUpdate }) => {
    const m = getMood(entry.mood)
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}>
                    <m.Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {m.label}
                </span>
                <span className="text-xs text-stone-400 ml-auto">{formatRelativeDate(entry.date || entry.createdAt)}</span>
            </div>
            {(entry.symptoms || entry.activities) && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {entry.symptoms && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                            <AlertCircle className="w-3 h-3" /> {entry.symptoms}
                        </span>
                    )}
                    {entry.activities && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                            <Activity className="w-3 h-3" /> {entry.activities}
                        </span>
                    )}
                </div>
            )}
            {entry.notes && <p className="text-sm text-stone-700 leading-relaxed">{entry.notes}</p>}
            <EvaluationPanel
                entry={entry}
                patientId={patientId}
                authorName={authorName}
                onSaved={onEntryUpdate}
            />
        </motion.div>
    )
}

const ClinicalNoteCard = ({ note, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-sky-50 border border-sky-100 rounded-2xl p-4 shadow-sm"
    >
        <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-blue-800 rounded-full text-xs font-semibold">
                <FileText className="w-3 h-3" /> Nota clínica
            </span>
            <span className="text-xs text-stone-400 ml-auto">{formatRelativeDate(note.createdAt)}</span>
        </div>
        <p className="text-xs text-blue-700 font-medium mb-1">{note.author || 'Profesional'}</p>
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.text || note.notes}</p>
    </motion.div>
)

// ─── Main component ───────────────────────────────────────────────────────────
const PatientDiary = ({ patientId, patientName, onClose }) => {
    const { user } = useAuth()
    const authorName = user?.name || user?.email || 'Profesional'
    const [entries, setEntries] = useState([])
    const [newNote, setNewNote] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [tab, setTab] = useState('all') // 'all' | 'patient' | 'clinical' | 'homework'

    const fetchNotes = useCallback(async () => {
        if (!patientId) { setIsLoading(false); return }
        setIsLoading(true)
        setError(null)
        try {
            const response = await diaryService.getNotes(patientId)
            const raw = response.data
            const list = Array.isArray(raw) ? raw
                : Array.isArray(raw?.data) ? raw.data
                : Array.isArray(raw?.notes) ? raw.notes
                : []
            setEntries(list)
        } catch (err) {
            console.error('Error fetching diary entries:', err)
            setError('No se pudieron cargar las entradas del diario.')
        } finally {
            setIsLoading(false)
        }
    }, [patientId])

    useEffect(() => { fetchNotes() }, [fetchNotes])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newNote.trim() || !patientId) return
        setIsSubmitting(true)
        try {
            const noteData = {
                text: newNote.trim(),
                notes: newNote.trim(),
                author: authorName,
            }
            const response = await diaryService.addNote(patientId, noteData)
            const saved = response.data?.data ?? response.data
            if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                setEntries(prev => [saved, ...prev])
            } else {
                await fetchNotes()
            }
            setNewNote('')
        } catch (err) {
            console.error('Error adding clinical note:', err)
            setError('Error al guardar la nota. Intenta de nuevo.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // When a professional saves an evaluation, update that entry in state
    const handleEntryUpdate = (updated) => {
        setEntries(prev => prev.map(e =>
            (e._id || e.id) === (updated._id || updated.id) ? { ...e, ...updated } : e
        ))
    }

    const patientEntries  = entries.filter(e => e.mood)
    const clinicalNotes   = entries.filter(e => !e.mood && (e.text || e.notes))
    const visibleEntries  =
        tab === 'patient'  ? patientEntries :
        tab === 'clinical' ? clinicalNotes  :
        entries

    const initials = (patientName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-blue-700 to-blue-600 px-6 py-5 flex items-center gap-4 text-white shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate">{patientName}</h2>
                        <p className="text-blue-100 text-xs mt-0.5">
                            Historial clínico · {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition shrink-0" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Add clinical note */}
                <form onSubmit={handleSubmit} className={`px-5 pt-4 pb-3 bg-white border-b border-gray-100 shrink-0 ${tab === 'homework' ? 'hidden' : ''}`}>
                    <div className="flex gap-2 items-end">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder={`Añadir nota clínica sobre ${patientName?.split(' ')[0] || 'el paciente'}…`}
                            rows={2}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                        />
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || !newNote.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="shrink-0 p-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />}
                        </motion.button>
                    </div>
                    {error && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {error}
                            <button type="button" onClick={() => setError(null)} className="ml-auto underline">Cerrar</button>
                        </p>
                    )}
                </form>

                {/* Tab bar */}
                <div className="flex gap-1 px-5 py-3 bg-white border-b border-gray-100 shrink-0">
                    {[
                        ['all',      'Todo',      entries.length],
                        ['patient',  'Paciente',  patientEntries.length],
                        ['clinical', 'Clínicas',  clinicalNotes.length],
                        ['homework', 'Tareas',    null],
                    ].map(([key, label, count]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                tab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {key === 'homework' && <ClipboardList className="w-3 h-3" />}
                            {label}
                            {count !== null && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    tab === key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Homework tab */}
                {tab === 'homework' && (
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <HomeworkPanel patientId={patientId} patientName={patientName} />
                    </div>
                )}

                {/* Entries */}
                <div className={`flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar ${tab === 'homework' ? 'hidden' : ''}`}>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                                    <div className="flex gap-2 mb-2">
                                        <div className="w-16 h-5 bg-gray-200 rounded-full" />
                                        <div className="w-24 h-4 bg-gray-100 rounded-full ml-auto" />
                                    </div>
                                    <div className="w-full h-4 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : visibleEntries.length === 0 ? (
                        <div className="text-center py-14">
                            <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-7 h-7 text-blue-500" />
                            </div>
                            <p className="font-semibold text-gray-700 mb-1">Sin entradas</p>
                            <p className="text-sm text-gray-400">
                                {tab === 'patient'  ? 'El paciente aún no ha añadido entradas'
                               : tab === 'clinical' ? 'No hay notas clínicas todavía'
                               : 'No hay entradas en el diario'}
                            </p>
                        </div>
                    ) : (
                        visibleEntries.map((entry, i) =>
                            entry.mood
                                ? <PatientEntryCard
                                    key={entry._id || entry.id || i}
                                    entry={entry}
                                    index={i}
                                    patientId={patientId}
                                    authorName={authorName}
                                    onEntryUpdate={handleEntryUpdate}
                                  />
                                : <ClinicalNoteCard key={entry._id || entry.id || i} note={entry} index={i} />
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-white border-t border-gray-100 shrink-0">
                    <p className="text-xs text-gray-400 text-center">
                        {tab === 'homework'
                            ? '📋 Las tareas son visibles para el paciente'
                            : '💡 Las evaluaciones y notas clínicas son privadas para el profesional'}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default PatientDiary
