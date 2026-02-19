import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { diaryService } from '@shared/services/diaryService'
import { useAuth } from '../../auth'
import { BookOpen, X, Send, AlertCircle, FileText, Smile, Activity, ClipboardList } from 'lucide-react'
import HomeworkPanel from './HomeworkPanel'

const MOOD_LABELS = {
    '😊': 'Bien', '😐': 'Regular', '😔': 'Triste',
    '😣': 'Dolor', '😴': 'Cansado', '😰': 'Ansioso',
}

const MOOD_COLORS = {
    '😊': 'bg-green-100 text-green-700',
    '😐': 'bg-yellow-100 text-yellow-700',
    '😔': 'bg-blue-100 text-blue-700',
    '😣': 'bg-red-100 text-red-700',
    '😴': 'bg-purple-100 text-purple-700',
    '😰': 'bg-orange-100 text-orange-700',
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

// Patient self-entry card (mood/symptoms/activities)
const PatientEntryCard = ({ entry, index }) => {
    const moodColor = MOOD_COLORS[entry.mood] || 'bg-gray-100 text-gray-700'
    const moodLabel = MOOD_LABELS[entry.mood] || ''
    const isProfNote = !entry.mood && (entry.text || entry.author)
    if (isProfNote) return null // rendered separately
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent " style={{ background: 'transparent' }}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${moodColor}`}>
                        {entry.mood} {moodLabel}
                    </span>
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatRelativeDate(entry.date || entry.createdAt)}</span>
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
            {entry.notes && <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-2">{entry.notes}</p>}
        </motion.div>
    )
}

// Professional clinical note card
const ClinicalNoteCard = ({ note, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm"
    >
        <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                <FileText className="w-3 h-3" /> Nota clínica
            </span>
            <span className="text-xs text-gray-400 ml-auto">{formatRelativeDate(note.createdAt)}</span>
        </div>
        <p className="text-xs text-indigo-600 font-medium mb-1">{note.author || 'Profesional'}</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.text || note.notes}</p>
    </motion.div>
)

const PatientDiary = ({ patientId, patientName, onClose }) => {
    const { user } = useAuth()
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
            const list = Array.isArray(raw)
                ? raw
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
                author: user?.name || user?.email || 'Profesional',
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

    // Filtered views
    const patientEntries = entries.filter(e => e.mood)
    const clinicalNotes = entries.filter(e => !e.mood && (e.text || e.notes))
    const visibleEntries =
        tab === 'patient' ? patientEntries :
        tab === 'clinical' ? clinicalNotes :
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
                <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center gap-4 text-white shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate">{patientName}</h2>
                        <p className="text-blue-100 text-xs mt-0.5">Historial clínico · {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition shrink-0" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Add clinical note — hidden when on homework tab */}
                <form onSubmit={handleSubmit} className={`px-5 pt-4 pb-3 bg-white border-b border-gray-100 shrink-0 ${tab === 'homework' ? 'hidden' : ''}`}>
                    <div className="flex gap-2 items-end">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder={`Añadir nota clínica sobre ${patientName?.split(' ')[0] || 'el paciente'}…`}
                            rows={2}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-gray-50"
                        />
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || !newNote.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="shrink-0 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
                    {[['all', 'Todo', entries.length], ['patient', 'Paciente', patientEntries.length], ['clinical', 'Clínicas', clinicalNotes.length], ['homework', 'Tareas', null]].map(([key, label, count]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                tab === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {key === 'homework' ? <><ClipboardList className="w-3 h-3" /> {label}</> : label}
                            {count !== null && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    tab === key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Homework tab content */}
                {tab === 'homework' && (
                    <div className="flex-1 overflow-y-auto p-5">
                        <HomeworkPanel patientId={patientId} patientName={patientName} />
                    </div>
                )}

                {/* Entries (diary + notes tabs) */}
                <div className={`flex-1 overflow-y-auto p-5 space-y-3 ${tab === 'homework' ? 'hidden' : ''}`}>
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
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-7 h-7 text-indigo-400" />
                            </div>
                            <p className="font-semibold text-gray-700 mb-1">Sin entradas</p>
                            <p className="text-sm text-gray-400">
                                {tab === 'patient' ? 'El paciente aún no ha añadido entradas'
                                : tab === 'clinical' ? 'No hay notas clínicas todavía'
                                : 'No hay entradas en el diario'}
                            </p>
                        </div>
                    ) : (
                        visibleEntries.map((entry, i) =>
                            entry.mood
                                ? <PatientEntryCard key={entry._id || entry.id || i} entry={entry} index={i} />
                                : <ClinicalNoteCard key={entry._id || entry.id || i} note={entry} index={i} />
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-white border-t border-gray-100 shrink-0">
                    <p className="text-xs text-gray-400 text-center">
                        {tab === 'homework'
                            ? '📋 Las tareas son visibles para el paciente'
                            : '💡 Las notas clínicas son visibles solo para profesionales'}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default PatientDiary
