/**
 * GoalsTracker.jsx
 * Shows therapeutic goals assigned by the professional.
 * Fetches via homeworkService (type==='goal') and lets the patient
 * mark them as completed. Falls back to localStorage demo data.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth/AuthContext'
import { homeworkService } from '@shared/services/homeworkService'

const GoalsTracker = () => {
  const { user } = useAuth()
  const [goals, setGoals]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const patientId = user?._id || user?.id
      if (!patientId) return
      const res = await homeworkService.getAll(patientId)
      const all = res.data?.data || res.data || []
      // Accept items of type 'goal' or fall back to showing the first 3 tasks
      const filtered = all.filter((t) => t.type === 'goal')
      setGoals(filtered.length > 0 ? filtered : all.slice(0, 3))
    } catch {
      // Demo goals while backend isn't returning data
      setGoals([
        { _id: 'g1', title: 'Practicar respiración diafragmática (10 min/día)',    completed: false },
        { _id: 'g2', title: 'Registro de pensamientos automáticos',                 completed: true  },
        { _id: 'g3', title: 'Salir a caminar al menos 3 veces esta semana',         completed: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggle = async (goal) => {
    const patientId = user?._id || user?.id
    const updated = { ...goal, completed: !goal.completed }
    setGoals((prev) => prev.map((g) => (g._id === goal._id ? updated : g)))
    try {
      if (patientId && !goal._id.startsWith('g')) {
        await homeworkService.update(patientId, goal._id, { completed: updated.completed })
      }
    } catch {
      // revert
      setGoals((prev) => prev.map((g) => (g._id === goal._id ? goal : g)))
    }
  }

  const completed = goals.filter((g) => g.completed).length
  const pct = goals.length ? Math.round((completed / goals.length) * 100) : 0

  return (
    <div className="bg-white dark:bg-gray-800/70 rounded-2xl border border-stone-200 dark:border-gray-700/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-400 dark:text-gray-500 uppercase tracking-wide">
          Tareas
        </p>
        <span className="text-xs font-bold text-violet-500 dark:text-violet-400">{completed}/{goals.length} completadas</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-stone-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-violet-500 rounded-full"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-stone-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <p className="text-xs text-stone-400 dark:text-gray-500 text-center py-3">
          Tu profesional aún no ha asignado objetivos.
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {goals.map((goal) => (
              <motion.li
                key={goal._id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2.5"
              >
                <button
                  onClick={() => toggle(goal)}
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    goal.completed
                      ? 'bg-violet-500 border-violet-500'
                      : 'border-stone-300 dark:border-gray-600 hover:border-violet-400'
                  }`}
                  aria-label={goal.completed ? 'Marcar incompleto' : 'Marcar completado'}
                >
                  {goal.completed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`text-xs leading-snug ${goal.completed ? 'line-through text-stone-400 dark:text-gray-500' : 'text-stone-700 dark:text-gray-300'}`}>
                  {goal.title}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <p className="text-[11px] text-stone-400 dark:text-gray-500 mt-3">
        {completed} de {goals.length} completadas
      </p>
    </div>
  )
}

export default GoalsTracker
