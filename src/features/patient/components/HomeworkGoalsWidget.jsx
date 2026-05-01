import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth/AuthContext'
import { homeworkService } from '@shared/services/homeworkService'
import { patientsService } from '@shared/services/patientsService'
import { CheckCircle2, Circle, Calendar, AlertCircle, ClipboardList } from 'lucide-react'

const HomeworkGoalsWidget = () => {
  const { user } = useAuth()
  const [patientId, setPatientId] = useState(user?.patientId || user?.patient_id || null)
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (patientId) return
    patientsService.getMyProfile()
      .then(res => {
        const p = res?.data?.data || res?.data
        const id = p?._id || p?.id || user?.id || user?._id
        if (id) setPatientId(id)
      })
      .catch(() => setPatientId(user?.id || user?._id || null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    if (!patientId) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await homeworkService.getAll(patientId)
      setItems(res.data?.data || res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { fetchItems() }, [fetchItems])

  const toggle = async (item) => {
    const updated = { ...item, completed: !item.completed }
    setItems(prev => prev.map(i => i._id === item._id ? updated : i))
    try {
      if (patientId) await homeworkService.update(patientId, item._id, { completed: updated.completed })
    } catch {
      setItems(prev => prev.map(i => i._id === item._id ? item : i))
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const now = new Date()
    return due < now && due.toDateString() !== now.toDateString()
  }

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null
    const date     = new Date(dueDate)
    const today    = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === today.toDateString())    return 'Hoy'
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana'
    if (isOverdue(dueDate))                              return 'Vencida'
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const tasks        = items.filter(t => t.type !== 'goal')
  const pendingTasks = tasks.filter(t => !t.completed).length

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tareas</p>
        </div>
        {pendingTasks > 0 && !loading && (
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
            {pendingTasks}
          </span>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-6 flex flex-col items-center text-center">
            <ClipboardList className="w-8 h-8 text-gray-200 dark:text-gray-600 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">No tienes tareas asignadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {tasks.map(task => {
                const overdue = isOverdue(task.dueDate)
                return (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`rounded-xl border p-3 transition-colors ${
                      task.completed
                        ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                        : overdue
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                        : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggle(task)}
                        className="mt-0.5 shrink-0"
                        aria-label={task.completed ? 'Marcar incompleto' : 'Marcar completado'}
                      >
                        {task.completed
                          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                          : <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${
                          task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {overdue && !task.completed
                              ? <AlertCircle className="w-3 h-3 text-red-500" />
                              : <Calendar className="w-3 h-3 text-gray-400" />
                            }
                            <span className={`text-[11px] font-medium ${
                              overdue && !task.completed ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatDueDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {pendingTasks > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                {pendingTasks} {pendingTasks === 1 ? 'tarea pendiente' : 'tareas pendientes'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeworkGoalsWidget
