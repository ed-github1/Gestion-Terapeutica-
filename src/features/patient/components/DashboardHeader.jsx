import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Moon, Sun } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { useTopBarSlot } from '@shared/context/TopBarSlotContext'

const DashboardHeader = ({
  fullName,
  initials,
  dateLabel,
  dark,
  toggleDark,
  notifications,
  onDismiss,
  onDismissAll,
  onAccept,
  onRefresh,
}) => {
  const { setSlot } = useTopBarSlot()

  // Stable ref so callbacks never cause the slot to re-register unnecessarily
  const cbRef = useRef({ onDismiss, onDismissAll, onAccept })
  useEffect(() => { cbRef.current = { onDismiss, onDismissAll, onAccept } })

  // Register the notification bell in the mobile top bar slot.
  // Re-runs only when the notifications list changes (badge count update).
  useEffect(() => {
    setSlot(
      <NotificationCenter
        notifications={notifications}
        onDismiss={(...a) => cbRef.current.onDismiss(...a)}
        onDismissAll={(...a) => cbRef.current.onDismissAll(...a)}
        onAction={(action, data) => { if (action === 'accept') cbRef.current.onAccept(data) }}
      />
    )
    return () => setSlot(null)
  }, [notifications, setSlot])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-4 py-3.5 flex items-center gap-3.5 border border-gray-200/60 dark:border-gray-700/50 shadow-sm"
    >
      <div className="w-11 h-11 rounded-xl bg-[#0075C9] flex items-center justify-center text-white font-bold text-sm shadow-md select-none shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight truncate">{fullName}</h1>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize leading-none mt-0.5">{dateLabel}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Bell inline on desktop — mobile version lives in the layout top bar via slot */}
        <span className="hidden md:flex">
          <NotificationCenter
            notifications={notifications}
            onDismiss={onDismiss}
            onDismissAll={onDismissAll}
            onAction={(action, data) => { if (action === 'accept') onAccept(data) }}
          />
        </span>
        <button
          onClick={toggleDark}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
          aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {dark
            ? <Sun size={15} className="text-gray-500 dark:text-gray-300" />
            : <Moon size={15} className="text-gray-500 dark:text-gray-400" />}
        </button>
        <button
          onClick={onRefresh}
          title="Actualizar"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-gray-500 dark:text-gray-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export default DashboardHeader
