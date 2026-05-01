import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * Shared notification bell trigger for the layout top bar.
 * Owns the button, icon, badge, and open/close logic so every role's
 * notification panel looks identical in the top bar.
 *
 * Props:
 *   count  – numeric badge (red, shows count). 0 = hidden.
 *   dot    – boolean dot badge (emerald). Ignored when count > 0.
 *   children – panel content. May be a render-prop: children({ close })
 *              to let the panel close the dropdown from inside.
 */
const TopBarBell = ({ count = 0, dot = false, children }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 shadow-sm hover:border-stone-300 dark:hover:border-gray-600 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-[18px] h-[18px] text-stone-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <AnimatePresence>
          {count > 0 ? (
            <motion.span
              key="count"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          ) : dot ? (
            <motion.span
              key="dot"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"
            />
          ) : null}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="absolute right-0 mt-2 z-50"
          >
            {typeof children === 'function' ? children({ close }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TopBarBell
