import React from 'react'
import { motion, AnimatePresence } from 'motion/react'

const DOT_COLOR = { blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500', amber: 'bg-amber-500' }

const RecentActivity = ({ notifications, onDismiss }) => (
  <AnimatePresence>
    {notifications.length > 0 && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Actividad reciente
          </p>
          <div className="flex flex-col gap-2">
            {notifications.slice(0, 3).map((n) => {
              const dot = DOT_COLOR[n.color] || 'bg-blue-500'
              const date = n.data?.date
                ? new Date(n.data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : null
              return (
                <div key={n.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-1">
                    {n.emoji}&nbsp;{n.title}
                    {date && <span className="text-gray-400 dark:text-gray-500 ml-2">{date}</span>}
                  </span>
                  <button
                    onClick={() => onDismiss(n.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors shrink-0"
                    aria-label="Descartar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
            {notifications.length > 3 && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-5">
                +{notifications.length - 3} más en notificaciones
              </p>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default RecentActivity
