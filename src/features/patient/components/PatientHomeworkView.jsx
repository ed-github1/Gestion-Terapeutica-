/**
 * PatientHomeworkView.jsx
 * Patient-side view of their assigned therapeutic homework tasks.
 * Patients can read tasks, expand descriptions, and mark them as done.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2, Circle, ClipboardList, BookOpen,
  Dumbbell, Pencil, Star, Calendar, ChevronDown,
  ChevronUp, Loader2, AlertCircle
} from 'lucide-react'
import { homeworkService } from '@shared/services/homeworkService'
import { useAuth } from '@features/auth/AuthContext'

/* ─── Constants ─────────────────────────────────────────── */
const TYPES = {
  exercise:   { label: 'Ejercicio',  icon: Dumbbell,     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  reading:    { label: 'Lectura',    icon: BookOpen,     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  journaling: { label: 'Diario',     icon: Pencil,       color: 'bg-purple-100 text-purple-700 border-purple-200' },
  reflection: { label: 'Reflexión',  icon: Star,         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  other:      { label: 'Otro',       icon: ClipboardList,color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const typeOf = (v) => TYPES[v] ?? TYPES.other

const Badge = ({ type }) => {
  const t = typeOf(type)
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${t.color}`}>
      <Icon className="w-3 h-3" /> {t.label}
    </span>
  )
}

/* ─── Single task card ───────────────────────────────────── */
const TaskCard = ({ task, index, onToggle, toggling }) => {
  const [expanded, setExpanded] = useState(false)

  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border p-4 transition-all ${
        task.completed
          ? 'bg-emerald-50 border-emerald-100'
          : isOverdue
            ? 'bg-red-50 border-red-100 shadow-sm'
            : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <button
          onClick={() => !task.completed && onToggle(task)}
          disabled={toggling || task.completed}
          className={`mt-0.5 shrink-0 transition ${
            task.completed
              ? 'text-emerald-500 cursor-default'
              : 'text-gray-300 hover:text-indigo-500'
          } disabled:opacity-60`}
          aria-label={task.completed ? 'Tarea completada' : 'Marcar como completada'}
        >
          {toggling
            ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            : task.completed
              ? <CheckCircle2 className="w-5 h-5" />
              : <Circle className="w-5 h-5" />
          }
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold leading-snug ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </p>
            <Badge type={task.type} />
            {isOverdue && !task.completed && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-semibold">
                Vencida
              </span>
            )}
          </div>

          {/* Due date / completion date */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {due && !task.completed && (
              <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                <Calendar className="w-3 h-3" />
                Vence: {due}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="text-xs text-emerald-600 font-medium">
                ✓ Completaste esta tarea el {new Date(task.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </span>
            )}
          </div>

          {/* Expandable description */}
          {task.description && (
            <div>
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-2 flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700 transition"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Ocultar instrucciones' : 'Ver instrucciones'}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-white/70 rounded-xl p-3 border border-gray-100">
                      {task.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* CTA for pending tasks */}
      {!task.completed && (
        <div className="mt-3 flex justify-end">
          <motion.button
            onClick={() => onToggle(task)}
            disabled={toggling}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {toggling
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
              : <><CheckCircle2 className="w-3.5 h-3.5" /> Marcar como hecha</>
            }
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────── */
const PatientHomeworkView = ({ patientId: propPatientId }) => {
  const { user } = useAuth()
  const patientId = propPatientId || user?._id || user?.id

  const [tasks, setTasks]         = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [error, setError]         = useState(null)
  const [filter, setFilter]       = useState('pending') // 'all' | 'pending' | 'done'

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
      console.error('PatientHomeworkView load error:', err)
      setError('No se pudieron cargar tus tareas.')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleToggle = async (task) => {
    const id = task._id || task.id
    setTogglingId(id)
    try {
      await homeworkService.update(patientId, id, {
        completed: true,
        completedAt: new Date().toISOString(),
      })
      setTasks(prev => prev.map(t =>
        (t._id || t.id) === id
          ? { ...t, completed: true, completedAt: new Date().toISOString() }
          : t
      ))
    } catch (err) {
      console.error('Toggle error:', err)
      setError('No se pudo actualizar la tarea.')
    } finally {
      setTogglingId(null)
    }
  }

  const pending  = tasks.filter(t => !t.completed)
  const done     = tasks.filter(t => t.completed)
  const visible  =
    filter === 'pending' ? pending :
    filter === 'done'    ? done    :
    tasks

  const completionRate = tasks.length > 0
    ? Math.round((done.length / tasks.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-800">Tus tareas terapéuticas</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Asignadas por tu profesional · {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-emerald-600">{completionRate}%</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[['pending', 'Pendientes', pending.length], ['done', 'Completadas', done.length], ['all', 'Todas', tasks.length]].map(([key, label, count]) => (
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
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto underline">Cerrar</button>
        </p>
      )}

      {/* Tasks */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-4 bg-gray-200 rounded" />
                  <div className="w-1/4 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            {filter === 'done'
              ? <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              : <ClipboardList className="w-7 h-7 text-indigo-400" />
            }
          </div>
          <p className="font-semibold text-gray-700 mb-1">
            {filter === 'pending' ? '¡Sin tareas pendientes!' :
             filter === 'done'    ? 'Aún no completaste ninguna tarea' :
             'Tu profesional aún no asignó tareas'}
          </p>
          <p className="text-xs text-gray-400">
            {filter === 'pending' && '¡Excelente trabajo! Estás al día.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visible.map((task, i) => (
              <TaskCard
                key={task._id || task.id || i}
                task={task}
                index={i}
                onToggle={handleToggle}
                toggling={togglingId === (task._id || task.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default PatientHomeworkView
