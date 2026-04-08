import { motion } from 'motion/react'
import { CheckCircle2, Circle, Calendar, Clock } from 'lucide-react'
import { HOMEWORK_TYPES, rel } from '../constants'

const TypeBadge = ({ type }) => {
  const t = HOMEWORK_TYPES[type] || HOMEWORK_TYPES.other
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.bg}`}>
      <Icon className="w-2.5 h-2.5" /> {t.label}
    </span>
  )
}

const HomeworkCard = ({ task, index }) => {
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
      className={`bg-white dark:bg-[#1a2234] rounded-2xl border p-3 sm:p-4 ${
        task.completed ? 'border-emerald-100 dark:border-emerald-900/40 opacity-75' :
        isOverdue      ? 'border-rose-200 dark:border-rose-900/40'                :
                         'border-gray-100 dark:border-[#2d3748]'
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="mt-0.5 shrink-0">
          {task.completed
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Circle className={`w-5 h-5 ${isOverdue ? 'text-rose-400' : 'text-gray-300'}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.title}
            </p>
            <TypeBadge type={task.type} />
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Vencida
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{task.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
            {due && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Vence: {due}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Completada {rel(task.completedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Asignada {rel(task.assignedAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default HomeworkCard
