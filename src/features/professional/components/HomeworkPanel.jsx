/**
 * HomeworkPanel.jsx
 * Professional-side panel for assigning, editing and tracking
 * therapeutic homework tasks assigned to a patient.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2, Circle, Trash2, Plus, Loader2,
  AlertCircle, BookOpen, Dumbbell, Pencil, Star,
  ClipboardList, Calendar, ChevronDown, ChevronUp
} from 'lucide-react'
import { homeworkService } from '@shared/services/homeworkService'

/* ─── Constants ─────────────────────────────────────────── */
const TYPES = [
  { value: 'exercise',    label: 'Ejercicio',     icon: Dumbbell,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reading',     label: 'Lectura',        icon: BookOpen,      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'journaling',  label: 'Diario',         icon: Pencil,        color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'reflection',  label: 'Reflexión',      icon: Star,          color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'other',       label: 'Otro',           icon: ClipboardList, color: 'bg-gray-100 text-gray-700 border-gray-200' },
]

const typeOf = (value) => TYPES.find(t => t.value === value) ?? TYPES[4]

const EMPTY_FORM = {
  title: '',
  description: '',
  dueDate: '',
  type: 'exercise',
}

/* ─── Sub-components ─────────────────────────────────────── */
const Badge = ({ type }) => {
  const t = typeOf(type)
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${t.color}`}>
      <Icon className="w-3 h-3" /> {t.label}
    </span>
  )
}

const TaskCard = ({ task, index, onToggle, onDelete, toggling, deleting }) => {
  const [expanded, setExpanded] = useState(false)
  const isLoading = toggling || deleting

  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border p-4 transition-colors ${
        task.completed
          ? 'bg-gray-50 border-gray-100'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle button */}
        <button
          onClick={() => onToggle(task)}
          disabled={isLoading}
          className="mt-0.5 shrink-0 text-gray-400 hover:text-indigo-600 transition disabled:opacity-40"
          aria-label={task.completed ? 'Marcar incompleta' : 'Marcar completada'}
        >
          {toggling
            ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            : task.completed
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <Circle className="w-5 h-5" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold leading-snug ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </p>
            <Badge type={task.type} />
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {due && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" /> {due}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="text-xs text-emerald-600 font-medium">
                ✓ Completada {new Date(task.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          {task.description && (
            <div>
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1.5 flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700 transition"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Ocultar descripción' : 'Ver descripción'}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-xs text-gray-600 mt-1.5 leading-relaxed overflow-hidden"
                  >
                    {task.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task)}
          disabled={isLoading}
          className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
          aria-label="Eliminar tarea"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────── */
const HomeworkPanel = ({ patientId, patientName }) => {
  const [tasks, setTasks]             = useState([])
  const [form, setForm]               = useState(EMPTY_FORM)
  const [showForm, setShowForm]       = useState(false)
  const [isLoading, setIsLoading]     = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId]   = useState(null)
  const [deletingId, setDeletingId]   = useState(null)
  const [error, setError]             = useState(null)
  const [filter, setFilter]           = useState('all') // 'all' | 'pending' | 'done'

  /* Load tasks */
  const loadTasks = useCallback(async () => {
    if (!patientId) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const res = await homeworkService.getAll(patientId)
      const raw = res.data
      const list =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.data) ? raw.data :
        Array.isArray(raw?.tasks) ? raw.tasks :
        []
      setTasks(list)
    } catch (err) {
      console.error('HomeworkPanel load error:', err)
      setError('No se pudieron cargar las tareas.')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => { loadTasks() }, [loadTasks])

  /* Assign new task */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await homeworkService.assign(patientId, {
        ...form,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined,
      })
      const saved = res.data?.data ?? res.data
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        setTasks(prev => [saved, ...prev])
      } else {
        await loadTasks()
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      console.error('Homework assign error:', err)
      setError('Error al asignar la tarea. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* Toggle completion (professional can override) */
  const handleToggle = async (task) => {
    const id = task._id || task.id
    setTogglingId(id)
    try {
      const updated = { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
      await homeworkService.update(patientId, id, updated)
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, ...updated } : t))
    } catch (err) {
      console.error('Homework toggle error:', err)
      setError('No se pudo actualizar la tarea.')
    } finally {
      setTogglingId(null)
    }
  }

  /* Delete task */
  const handleDelete = async (task) => {
    const id = task._id || task.id
    setDeletingId(id)
    try {
      await homeworkService.remove(patientId, id)
      setTasks(prev => prev.filter(t => (t._id || t.id) !== id))
    } catch (err) {
      console.error('Homework delete error:', err)
      setError('No se pudo eliminar la tarea.')
    } finally {
      setDeletingId(null)
    }
  }

  /* Derived lists */
  const pending = tasks.filter(t => !t.completed)
  const done    = tasks.filter(t => t.completed)
  const visible =
    filter === 'pending' ? pending :
    filter === 'done'    ? done    :
    tasks

  const completionRate = tasks.length > 0
    ? Math.round((done.length / tasks.length) * 100)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <span className="text-xs font-semibold text-emerald-600 shrink-0">{completionRate}% completado</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[['all', 'Todas', tasks.length], ['pending', 'Pendientes', pending.length], ['done', 'Completadas', done.length]].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{count}</span>
          </button>
        ))}

        {/* Assign button */}
        <motion.button
          onClick={() => setShowForm(f => !f)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Asignar tarea
        </motion.button>
      </div>

      {/* Assignment form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Nueva tarea para {patientName?.split(' ')[0] || 'el paciente'}
            </p>

            {/* Title */}
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título de la tarea *"
              required
              className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-white"
            />

            {/* Description */}
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción o instrucciones (opcional)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-white"
            />

            {/* Type + Date row */}
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-white"
              >
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <motion.button
                type="submit"
                disabled={isSubmitting || !form.title.trim()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</span>
                  : 'Asignar tarea'}
              </motion.button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 px-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto underline">Cerrar</button>
        </p>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-1/3 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="font-semibold text-gray-700 text-sm mb-1">
            {filter === 'pending' ? 'Sin tareas pendientes' :
             filter === 'done'    ? 'Ninguna completada aún' :
             'Sin tareas asignadas'}
          </p>
          <p className="text-xs text-gray-400">
            {filter === 'all' && `Asigna la primera tarea a ${patientName?.split(' ')[0] || 'el paciente'}`}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {visible.map((task, i) => (
              <TaskCard
                key={task._id || task.id || i}
                task={task}
                index={i}
                onToggle={handleToggle}
                onDelete={handleDelete}
                toggling={togglingId === (task._id || task.id)}
                deleting={deletingId === (task._id || task.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default HomeworkPanel
