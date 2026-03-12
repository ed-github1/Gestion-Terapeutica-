import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
    CheckSquare, Square, Trash2, Plus, X, Flag,
    ChevronDown, StickyNote, Users, Settings, Inbox
} from 'lucide-react'

// ─── constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'professional_todos'

const PRIORITIES = [
    { value: 'high',   label: 'Alta',  color: 'text-rose-500',   bg: 'bg-rose-50',   dot: 'bg-rose-500'   },
    { value: 'medium', label: 'Media', color: 'text-amber-500',  bg: 'bg-amber-50',  dot: 'bg-amber-500'  },
    { value: 'low',    label: 'Baja',  color: 'text-sky-500',    bg: 'bg-sky-50',    dot: 'bg-sky-500'    },
]

const CATEGORIES = [
    { value: 'all',       label: 'Todas',       icon: Inbox    },
    { value: 'patients',  label: 'Pacientes',   icon: Users    },
    { value: 'admin',     label: 'Admin',       icon: Settings },
    { value: 'personal',  label: 'Personal',    icon: StickyNote },
]

const CATEGORY_COLORS = {
    patients: 'bg-blue-100 text-blue-700',
    admin:    'bg-purple-100 text-purple-700',
    personal: 'bg-teal-100 text-teal-700',
}

function genId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function loadTodos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveTodos(todos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch { /* quota exceeded — silent */ }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function PriorityPicker({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const current = PRIORITIES.find(p => p.value === value) ?? PRIORITIES[1]

    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${current.bg} ${current.color}`}
            >
                <Flag className="w-3 h-3" />
                {current.label}
                <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-32"
                    >
                        {PRIORITIES.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => { onChange(p.value); setOpen(false) }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${p.color} ${value === p.value ? 'bg-gray-50' : ''}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                {p.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CategoryPicker({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const options = CATEGORIES.filter(c => c.value !== 'all')
    const current = options.find(c => c.value === value) ?? options[0]

    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${CATEGORY_COLORS[current.value] ?? 'bg-gray-100 text-gray-600'}`}
            >
                <current.icon className="w-3 h-3" />
                {current.label}
                <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-36"
                    >
                        {options.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => { onChange(c.value); setOpen(false) }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${value === c.value ? 'bg-gray-50' : 'text-gray-600'}`}
                            >
                                <c.icon className="w-3.5 h-3.5" />
                                {c.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── main component ───────────────────────────────────────────────────────────

/**
 * TodoModal — professional to-do list modal.
 *
 * Usage:
 *   <TodoModal open={open} onClose={() => setOpen(false)} />
 */
export default function TodoModal({ open, onClose }) {
    const [todos, setTodos]             = useState(loadTodos)
    const [input, setInput]             = useState('')
    const [newPriority, setNewPriority] = useState('medium')
    const [newCategory, setNewCategory] = useState('admin')
    const [filter, setFilter]           = useState('all')
    const [showDone, setShowDone]       = useState(false)
    const inputRef = useRef(null)

    // Persist on change
    useEffect(() => { saveTodos(todos) }, [todos])

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 80)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        function handler(e) { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    const addTodo = useCallback(() => {
        const text = input.trim()
        if (!text) return
        setTodos(prev => [
            {
                id: genId(),
                text,
                done: false,
                priority: newPriority,
                category: newCategory,
                createdAt: new Date().toISOString(),
            },
            ...prev,
        ])
        setInput('')
    }, [input, newPriority, newCategory])

    const toggleDone = useCallback((id) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    }, [])

    const deleteTodo = useCallback((id) => {
        setTodos(prev => prev.filter(t => t.id !== id))
    }, [])

    const clearDone = useCallback(() => {
        setTodos(prev => prev.filter(t => !t.done))
    }, [])

    // ── filtered lists ──
    const pending = todos.filter(t => !t.done && (filter === 'all' || t.category === filter))
    const done    = todos.filter(t =>  t.done && (filter === 'all' || t.category === filter))

    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const sorted = [...pending].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="todo-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="todo-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed z-50 inset-x-4 top-[5vh] mx-auto max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ maxHeight: '88vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-blue-600" strokeWidth={2} />
                                <h2 className="text-base font-semibold text-gray-900">Mis Tareas</h2>
                                {pending.length > 0 && (
                                    <span className="text-xs font-bold bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                        {pending.length}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* ── Category filter tabs ── */}
                        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-gray-100 overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(c => {
                                const active = filter === c.value
                                return (
                                    <button
                                        key={c.value}
                                        onClick={() => setFilter(c.value)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                            active
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <c.icon className="w-3 h-3" />
                                        {c.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* ── Add input ── */}
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
                                <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
                                    placeholder="Nueva tarea... (Enter para añadir)"
                                    className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
                                />
                                {input.trim() && (
                                    <button
                                        type="button"
                                        onClick={addTodo}
                                        className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Añadir
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <PriorityPicker value={newPriority} onChange={setNewPriority} />
                                <CategoryPicker value={newCategory} onChange={setNewCategory} />
                            </div>
                        </div>

                        {/* ── Todo list ── */}
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
                            {sorted.length === 0 && done.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CheckSquare className="w-10 h-10 text-gray-200 mb-3" />
                                    <p className="text-sm font-medium text-gray-400">Sin tareas pendientes</p>
                                    <p className="text-xs text-gray-300 mt-1">Añade tu primera tarea arriba</p>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {sorted.map(todo => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={toggleDone}
                                        onDelete={deleteTodo}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Done section */}
                            {done.length > 0 && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => setShowDone(s => !s)}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2 group"
                                    >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDone ? '' : '-rotate-90'}`} />
                                        <span>Completadas ({done.length})</span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {showDone && done.map(todo => (
                                            <TodoItem
                                                key={todo.id}
                                                todo={todo}
                                                onToggle={toggleDone}
                                                onDelete={deleteTodo}
                                            />
                                        ))}
                                    </AnimatePresence>
                                    {showDone && done.length > 0 && (
                                        <button
                                            onClick={clearDone}
                                            className="mt-2 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                                        >
                                            Limpiar completadas
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
                                {done.length > 0 ? ` · ${done.length} hecha${done.length !== 1 ? 's' : ''}` : ''}
                            </p>
                            <p className="text-xs text-gray-300">Guardado automáticamente</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ─── individual item ──────────────────────────────────────────────────────────

function TodoItem({ todo, onToggle, onDelete }) {
    const prioMeta = PRIORITIES.find(p => p.value === todo.priority)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors group ${
                todo.done
                    ? 'border-gray-100 bg-gray-50/80'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
        >
            {/* Checkbox */}
            <button
                onClick={() => onToggle(todo.id)}
                className={`mt-0.5 shrink-0 transition-colors ${todo.done ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
            >
                {todo.done
                    ? <CheckSquare className="w-4 h-4" />
                    : <Square className="w-4 h-4" />
                }
            </button>

            {/* Text + meta */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug wrap-break-word ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {todo.text}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {/* Priority dot */}
                    {!todo.done && prioMeta && (
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${prioMeta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prioMeta.dot}`} />
                            {prioMeta.label}
                        </span>
                    )}
                    {/* Category badge */}
                    {todo.category && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[todo.category] ?? 'bg-gray-100 text-gray-500'}`}>
                            {CATEGORIES.find(c => c.value === todo.category)?.label ?? todo.category}
                        </span>
                    )}
                </div>
            </div>

            {/* Delete */}
            <button
                onClick={() => onDelete(todo.id)}
                className="shrink-0 p-1 rounded-lg text-gray-200 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    )
}
