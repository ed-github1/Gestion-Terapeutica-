import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Circle, CheckCircle, Trash2, Plus, X, ChevronDown } from 'lucide-react'

// ─── storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'professional_todos'

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

// ─── main component ───────────────────────────────────────────────────────────

export default function TodoModal({ open, onClose }) {
    const [todos, setTodos]   = useState(loadTodos)
    const [input, setInput]   = useState('')
    const [showDone, setShowDone] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => { saveTodos(todos) }, [todos])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 80)
    }, [open])

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
            { id: genId(), text, done: false, createdAt: new Date().toISOString() },
            ...prev,
        ])
        setInput('')
    }, [input])

    const toggleDone = useCallback((id) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    }, [])

    const deleteTodo = useCallback((id) => {
        setTodos(prev => prev.filter(t => t.id !== id))
    }, [])

    const clearDone = useCallback(() => {
        setTodos(prev => prev.filter(t => !t.done))
    }, [])

    const pending = todos.filter(t => !t.done)
    const done    = todos.filter(t =>  t.done)

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="todo-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        key="todo-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed z-50 inset-x-4 top-[8vh] mx-auto max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ maxHeight: '82vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-3">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">Mis Tareas</h2>
                                {pending.length > 0 && (
                                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                        {pending.length}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Add input */}
                        <div className="px-5 pb-3">
                            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors">
                                <Plus className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
                                    placeholder="Añadir tarea..."
                                    className="flex-1 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 border-t border-gray-100 dark:border-gray-800" />

                        {/* Task list */}
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0.5 custom-scrollbar">
                            {pending.length === 0 && done.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Circle className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" strokeWidth={1.5} />
                                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin tareas</p>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {pending.map(todo => (
                                    <TodoItem key={todo.id} todo={todo} onToggle={toggleDone} onDelete={deleteTodo} />
                                ))}
                            </AnimatePresence>

                            {done.length > 0 && (
                                <div className="pt-3">
                                    <button
                                        onClick={() => setShowDone(s => !s)}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mb-1"
                                    >
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showDone ? '' : '-rotate-90'}`} />
                                        <span>Completadas ({done.length})</span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {showDone && done.map(todo => (
                                            <TodoItem key={todo.id} todo={todo} onToggle={toggleDone} onDelete={deleteTodo} />
                                        ))}
                                    </AnimatePresence>
                                    {showDone && done.length > 0 && (
                                        <button
                                            onClick={clearDone}
                                            className="mt-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-[11px] text-gray-300 dark:text-gray-600">
                                {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
                                {done.length > 0 ? ` · ${done.length} hecha${done.length !== 1 ? 's' : ''}` : ''}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ─── individual item ──────────────────────────────────────────────────────────

function TodoItem({ todo, onToggle, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 px-2 py-2 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
            <button
                onClick={() => onToggle(todo.id)}
                className={`shrink-0 transition-colors ${todo.done ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600 hover:text-blue-400'}`}
            >
                {todo.done
                    ? <CheckCircle className="w-[18px] h-[18px]" strokeWidth={2} />
                    : <Circle className="w-[18px] h-[18px]" strokeWidth={1.5} />
                }
            </button>

            <span className={`flex-1 text-sm leading-snug wrap-break-word ${todo.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {todo.text}
            </span>

            <button
                onClick={() => onDelete(todo.id)}
                className="shrink-0 p-1 rounded-md text-transparent group-hover:text-gray-300 dark:group-hover:text-gray-600 hover:!text-rose-500 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    )
}
