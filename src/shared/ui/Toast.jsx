/**
 * shared/ui/Toast.jsx
 * Global toast notification component + imperative showToast helper.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

let _toastHandler = null

/** Call this anywhere (outside React tree) to fire a toast. */
export const showToast = (message, type = 'success') => {
  // Try module-level handler first, fall back to window global
  const handler = _toastHandler ?? window.__toastHandler
  handler?.(message, type)
}

const ICON = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const COLORS = {
  success: { wrapper: 'bg-green-50 border-green-200 text-green-800', icon: 'text-green-600' },
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',       icon: 'text-red-600' },
  warning: { wrapper: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: 'text-yellow-600' },
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',    icon: 'text-blue-600' },
}

const Toast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _toastHandler = (message, type) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
    }
    window.__toastHandler = _toastHandler
    return () => { _toastHandler = null; window.__toastHandler = null }
  }, [])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, message, type }) => {
          const c = COLORS[type] || COLORS.info
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`${c.wrapper} border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-md pointer-events-auto`}
            >
              <div className={c.icon}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON[type]} />
                </svg>
              </div>
              <p className="flex-1 text-sm font-medium">{message}</p>
              <button onClick={() => remove(id)} className="p-1 hover:bg-black/5 rounded transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default Toast
