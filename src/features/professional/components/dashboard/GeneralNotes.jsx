import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    StickyNote,
    Plus,
    X,
    Check,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Persistence helpers (localStorage for now — swap to API later)
───────────────────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'professional_general_notes'

const loadNotes = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

const saveNotes = (notes) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch { /* quota exceeded – silent */ }
}

/* ─────────────────────────────────────────────────────────────────────────────
   NoteItem — single task row
───────────────────────────────────────────────────────────────────────────── */
const NoteItem = ({ note, onToggle, onDelete }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18 }}
        className={`group flex items-start gap-2 px-2.5 py-2 rounded-lg transition-colors ${
            note.done ? 'bg-gray-100' : 'hover:bg-stone-100'
        }`}
    >
        {/* Drag handle (visual only for now) */}
        <GripVertical className="w-3 h-3 text-gray-200 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

        {/* Checkbox */}
        <button
            type="button"
            onClick={() => onToggle(note.id)}
            className={`w-4 h-4 mt-0.5 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                note.done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-gray-300 hover:border-blue-400'
            }`}
        >
            {note.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
        </button>

        {/* Text */}
        <span
            className={`flex-1 text-[12px] leading-relaxed wrap-break-word ${
                note.done ? 'line-through text-gray-400' : 'text-gray-700'
            }`}
        >
            {note.text}
        </span>

        {/* Delete */}
        <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-rose-500 mt-0.5 shrink-0"
            title="Eliminar"
        >
            <Trash2 className="w-3 h-3" />
        </button>
    </motion.div>
)

/* ─────────────────────────────────────────────────────────────────────────────
   GeneralNotes — main widget
───────────────────────────────────────────────────────────────────────────── */
/**
 * Compact floating-style task list widget for general consultation notes.
 *
 * @param {object} props
 * @param {'panel' | 'fab'} [props.variant='panel'] — `panel` renders inline
 *   (for the right column); `fab` renders a floating action button + popover.
 */
const GeneralNotes = ({ variant = 'panel' }) => {
    const [notes, setNotes] = useState(loadNotes)
    const [input, setInput] = useState('')
    const [collapsed, setCollapsed] = useState(false)
    const [fabOpen, setFabOpen] = useState(false)
    const inputRef = useRef(null)

    // Persist on every change
    useEffect(() => { saveNotes(notes) }, [notes])

    const addNote = useCallback(() => {
        const text = input.trim()
        if (!text) return
        setNotes(prev => [
            { id: Date.now(), text, done: false, createdAt: new Date().toISOString() },
            ...prev,
        ])
        setInput('')
        inputRef.current?.focus()
    }, [input])

    const toggleNote = useCallback((id) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, done: !n.done } : n))
    }, [])

    const deleteNote = useCallback((id) => {
        setNotes(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearDone = useCallback(() => {
        setNotes(prev => prev.filter(n => !n.done))
    }, [])

    const pending = notes.filter(n => !n.done)
    const done    = notes.filter(n => n.done)

    /* ── Inner list (shared between panel & fab popover) ── */
    const NotesList = (
        <>
            {/* Input row */}
            <div className="flex items-center gap-1.5 px-1 mb-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder="Ej: Mandarle certificado a X…"
                    className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 outline-none transition placeholder:text-gray-300"
                />
                <button
                    type="button"
                    onClick={addNote}
                    disabled={!input.trim()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-all active:scale-90 shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
            </div>

            {/* List */}
            {notes.length === 0 ? (
                <p className="text-center text-[11px] text-gray-300 py-4">Sin notas por ahora</p>
            ) : (
                <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                    <AnimatePresence mode="popLayout">
                        {pending.map(n => (
                            <NoteItem key={n.id} note={n} onToggle={toggleNote} onDelete={deleteNote} />
                        ))}
                        {done.map(n => (
                            <NoteItem key={n.id} note={n} onToggle={toggleNote} onDelete={deleteNote} />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Clear completed */}
            {done.length > 0 && (
                <button
                    type="button"
                    onClick={clearDone}
                    className="mt-1.5 text-[10px] text-gray-400 hover:text-rose-500 transition-colors mx-auto block"
                >
                    Limpiar completadas ({done.length})
                </button>
            )}
        </>
    )

    /* ─────────────── FAB variant ─────────────── */
    if (variant === 'fab') {
        return (
            <>
                {/* Floating button — bottom-right */}
                <motion.button
                    type="button"
                    onClick={() => setFabOpen(v => !v)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center"
                >
                    {fabOpen
                        ? <X className="w-5 h-5" />
                        : (
                            <div className="relative">
                                <StickyNote className="w-5 h-5" />
                                {pending.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center leading-none">
                                        {pending.length > 9 ? '9+' : pending.length}
                                    </span>
                                )}
                            </div>
                        )
                    }
                </motion.button>

                {/* Popover */}
                <AnimatePresence>
                    {fabOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                            className="fixed bottom-36 md:bottom-20 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <StickyNote className="w-4 h-4 text-blue-600" />
                                    Notas Generales
                                </h3>
                                {pending.length > 0 && (
                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {NotesList}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    /* ─────────────── Panel variant (inline in right column) ─────────────── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-100/60 transition-colors"
            >
                <h3 className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-blue-600" />
                    Notas Generales
                    {pending.length > 0 && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {pending.length}
                        </span>
                    )}
                </h3>
                {collapsed
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronUp className="w-4 h-4 text-gray-400" />
                }
            </button>

            {/* Body */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="notes-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0.5">
                            {NotesList}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default GeneralNotes
