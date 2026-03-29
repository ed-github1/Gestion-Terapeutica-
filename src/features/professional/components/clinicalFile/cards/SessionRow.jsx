import { motion } from 'motion/react'

const SessionRow = ({ session, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.03 }}
    className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] px-5 py-3.5 flex items-center gap-4"
  >
    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-xs font-black text-blue-700 dark:text-sky-400 shrink-0">
      #{session.number}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <span className="text-[10px] bg-gray-100 dark:bg-[#0f1623] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
          {session.type}
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{session.duration} min</p>
    </div>
    <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-[#0f1623] flex items-center justify-center shrink-0">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{session.mood}</p>
    </div>
  </motion.div>
)

export default SessionRow
