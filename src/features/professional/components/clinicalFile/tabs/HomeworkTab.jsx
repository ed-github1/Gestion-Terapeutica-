import { motion } from 'motion/react'
import { ClipboardList } from 'lucide-react'
import HomeworkCard from '../cards/HomeworkCard'

const HomeworkTab = ({ hwTasks, completedHW, totalHW }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Tareas terapéuticas</h3>
      {hwTasks.length > 0 && (
        <span className="text-xs font-semibold text-emerald-600">
          {completedHW}/{hwTasks.length} completadas
        </span>
      )}
    </div>
    {hwTasks.length === 0 ? (
      <div className="text-center py-14">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ClipboardList className="w-7 h-7 text-emerald-300 dark:text-emerald-600" />
        </div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Sin tareas asignadas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Las tareas aparecerán aquí cuando las asignes</p>
      </div>
    ) : (
      <>
        {/* Progress bar */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Adherencia general</span>
            <span className="font-bold text-gray-900 dark:text-white">{Math.round((completedHW / totalHW) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-[#0f1623] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedHW / totalHW) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
        {hwTasks.map((task, i) => (
          <HomeworkCard key={task._id || task.id || i} task={task} index={i} />
        ))}
      </>
    )}
  </div>
)

export default HomeworkTab
