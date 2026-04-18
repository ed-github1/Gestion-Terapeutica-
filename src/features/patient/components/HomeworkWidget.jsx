/**
 * HomeworkWidget.jsx
 * Displays homework/therapeutic tasks assigned by the professional.
 * Patients can mark tasks as completed and view details.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth/AuthContext'
import { homeworkService } from '@shared/services/homeworkService'
import { patientsService } from '@shared/services/patientsService'
import { ClipboardList, CheckCircle2, Circle, Calendar, AlertCircle } from 'lucide-react'

const HomeworkWidget = () => {
  const { user } = useAuth()
  // Prefer the Patient document ID (matches what professional uses)
  const [patientId, setPatientId] = useState(
    user?.patientId || user?.patient_id || null
  )
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState(null)

  // Resolve the correct Patient document _id on mount
  useEffect(() => {
    if (patientId) return // already resolved
    patientsService.getMyProfile()
      .then(res => {
        const p = res?.data?.data || res?.data
        const id = p?._id || p?.id || user?.id || user?._id
        if (id) setPatientId(id)
      })
      .catch(() => {
        setPatientId(user?.id || user?._id || null)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHomework = useCallback(async () => {
    if (!patientId) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await homeworkService.getAll(patientId)
      const all = res.data?.data || res.data || []
      // Filter for homework tasks (exclude 'goal' type)
      const homework = all.filter((t) => t.type !== 'goal')
      setTasks(homework)
    } catch {
      // Silent fail - no homework assigned yet
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchHomework()
  }, [fetchHomework]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleComplete = async (task) => {
    const updated = { ...task, completed: !task.completed }
    setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)))
    try {
      if (patientId) {
        await homeworkService.update(patientId, task._id, { completed: updated.completed })
      }
    } catch {
      // Revert on error
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)))
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Hoy'
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana'
    if (isOverdue(dueDate)) return 'Vencida'
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed).length

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" strokeWidth={2} />
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Tareas pendientes
          </p>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs font-bold text-blue-500 dark:text-blue-400">
            {completed}/{tasks.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-2">
            <ClipboardList className="w-6 h-6 text-gray-300 dark:text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No tienes tareas asignadas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate)
              const isExpanded = expandedTask === task._id

              return (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`rounded-xl border transition-colors ${
                    task.completed
                      ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                      : overdue
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                      : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggleComplete(task)}
                        className="mt-0.5 shrink-0"
                        aria-label={task.completed ? 'Marcar incompleto' : 'Marcar completado'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                          className="w-full text-left"
                        >
                          <h4 className={`text-sm font-semibold leading-snug mb-1 ${
                            task.completed
                              ? 'line-through text-gray-400 dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h4>

                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {overdue && !task.completed ? (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              ) : (
                                <Calendar className="w-3 h-3 text-gray-400" />
                              )}
                              <span className={`text-[11px] font-medium ${
                                overdue && !task.completed
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatDueDate(task.dueDate)}
                              </span>
                            </div>
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && task.description && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                                {task.description}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {pending.length > 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 px-1">
              {pending.length} {pending.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default HomeworkWidget
