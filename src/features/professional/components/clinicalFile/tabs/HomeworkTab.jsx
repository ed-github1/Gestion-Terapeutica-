import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ClipboardList, Plus, Loader2, CheckCircle2, Circle,
  Trash2, Calendar, ChevronDown, ChevronUp, AlertCircle,
  Dumbbell, BookOpen, Pencil, Star, Wind, X,
} from 'lucide-react'
import { HOMEWORK_TYPES, rel } from '../constants'

const TYPES = [
  { value: 'exercise',    label: 'Ejercicio',   icon: Dumbbell,      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { value: 'reading',     label: 'Lectura',     icon: BookOpen,      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { value: 'journaling',  label: 'Diario',      icon: Pencil,        color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { value: 'reflection',  label: 'Reflexión',   icon: Star,          color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { value: 'breathing',   label: 'Respiración', icon: Wind,          color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  { value: 'other',       label: 'Otro',        icon: ClipboardList, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
]

const typeOf = (value) => TYPES.find(t => t.value === value) ?? TYPES[5]

const EMPTY_FORM = { title: '', description: '', dueDate: '', type: 'exercise' }

/* ── Type badge ── */
const TypeBadge = ({ type }) => {
  const t = HOMEWORK_TYPES[type] || HOMEWORK_TYPES.other
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.bg}`}>
      <Icon className="w-2.5 h-2.5" /> {t.label}
    </span>
  )
}

/* ── Task card with actions ── */
const TaskCard = ({ task, index, onToggle, onDelete, togglingId, deletingId }) => {
  const [expanded, setExpanded] = useState(false)
  const id = task._id || task.id
  const toggling = togglingId === id
  const deleting = deletingId === id
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
      className={`bg-white dark:bg-[#1a2234] rounded-2xl border p-3 sm:p-4 ${
        task.completed ? 'border-emerald-100 dark:border-emerald-900/40 opacity-75'
        : isOverdue    ? 'border-rose-200 dark:border-rose-900/40'
        :                'border-gray-100 dark:border-[#2d3748]'
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Toggle */}
        <button
          onClick={() => onToggle(task)}
          disabled={toggling || deleting}
          className="mt-0.5 shrink-0 transition disabled:opacity-40"
          aria-label={task.completed ? 'Marcar incompleta' : 'Marcar completada'}
        >
          {toggling
            ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            : task.completed
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <Circle className={`w-5 h-5 ${isOverdue ? 'text-rose-400' : 'text-gray-300 dark:text-gray-600'}`} />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.title}
            </p>
            <TypeBadge type={task.type} />
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-800">
                Vencida
              </span>
            )}
          </div>

          {task.description && (
            <div>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-0.5 text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Ocultar' : 'Ver descripción'}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed overflow-hidden"
                  >
                    {task.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            {due && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Vence: {due}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Completada {rel(task.completedAt)}
              </span>
            )}
            {task.assignedAt && (
              <span className="flex items-center gap-1">
                Asignada {rel(task.assignedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task)}
          disabled={toggling || deleting}
          className="shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-40"
          aria-label="Eliminar tarea"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  )
}

/* ── Main tab ── */
const HomeworkTab = ({ hwTasks, completedHW, totalHW, patientId, onAssign, onToggle, onDelete }) => {
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId]   = useState(null)
  const [deletingId, setDeletingId]   = useState(null)
  const [error, setError]             = useState(null)
  const [filter, setFilter]           = useState('all')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onAssign(form)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch {
      setError('Error al asignar la tarea.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (task) => {
    const id = task._id || task.id
    setTogglingId(id)
    setError(null)
    try {
      await onToggle(task)
    } catch {
      setError('No se pudo actualizar la tarea.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (task) => {
    const id = task._id || task.id
    setDeletingId(id)
    setError(null)
    try {
      await onDelete(task)
    } catch {
      setError('No se pudo eliminar la tarea.')
    } finally {
      setDeletingId(null)
    }
  }

  const pending = hwTasks.filter(t => !t.completed)
  const done    = hwTasks.filter(t => t.completed)
  const visible = filter === 'pending' ? pending : filter === 'done' ? done : hwTasks

  const completionRate = hwTasks.length > 0
    ? Math.round((done.length / hwTasks.length) * 100)
    : 0

  const FILTERS = [
    { key: 'all',     label: `Todas (${hwTasks.length})` },
    { key: 'pending', label: `Pendientes (${pending.length})` },
    { key: 'done',    label: `Completadas (${done.length})` },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">Tareas terapéuticas</h3>
        <button
          onClick={() => setShowForm(f => !f)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-[#54C0E8] to-[#0075C9] rounded-lg hover:shadow-md transition"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Asignar tarea'}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4 space-y-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Título de la tarea *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#2d3748] bg-gray-50 dark:bg-[#0f1623] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              required
              autoFocus
            />
            <textarea
              placeholder="Descripción (opcional)"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#2d3748] bg-gray-50 dark:bg-[#0f1623] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                      form.type === t.value ? t.color : 'border-gray-200 dark:border-[#2d3748] text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {t.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-1 block">
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-[#2d3748] bg-gray-50 dark:bg-[#0f1623] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </div>
              <button
                type="submit"
                disabled={!form.title.trim() || isSubmitting}
                className="self-end inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-[#54C0E8] to-[#0075C9] rounded-xl hover:shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Asignar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {hwTasks.length === 0 && !showForm ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-7 h-7 text-emerald-300 dark:text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-400">Sin tareas asignadas</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Pulsa &quot;Asignar tarea&quot; para empezar</p>
        </div>
      ) : hwTasks.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Adherencia general</span>
              <span className="font-bold text-gray-900 dark:text-white">{completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-[#0f1623] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  filter === f.key
                    ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          <AnimatePresence mode="popLayout">
            {visible.map((task, i) => (
              <TaskCard
                key={task._id || task.id || i}
                task={task}
                index={i}
                onToggle={handleToggle}
                onDelete={handleDelete}
                togglingId={togglingId}
                deletingId={deletingId}
              />
            ))}
          </AnimatePresence>

          {visible.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
              No hay tareas {filter === 'pending' ? 'pendientes' : 'completadas'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default HomeworkTab
