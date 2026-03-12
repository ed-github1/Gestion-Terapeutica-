/**
 * shared/ui/Toast.jsx
 * Global toast notification component + imperative showToast helper.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

let _toastHandler = null

const DURATION = 4000

export const showToast = (message, type = 'success') => {
  const handler = _toastHandler ?? window.__toastHandler
  handler?.(message, type)
}

const CONFIG = {
  success: {
    bg:        'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    glow:      'rgba(16,185,129,0.35)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg:        'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    glow:      'rgba(244,63,94,0.35)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    bg:        'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    glow:      'rgba(245,158,11,0.35)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    bg:        'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
    glow:      'rgba(14,165,233,0.35)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

const ToastItem = ({ id, message, type, onRemove }) => {
  const cfg = CONFIG[type] || CONFIG.info
  const [progress, setProgress] = useState(100)
  const startRef = useRef(Date.now())
  const rafRef   = useRef(null)

  useEffect(() => {
    const tick = () => {
      const elapsed   = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(remaining)
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 56, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 56, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      style={{
        background: cfg.bg,
        boxShadow: `0 12px 40px -8px ${cfg.glow}, 0 4px 16px -4px rgba(0,0,0,0.18)`,
      }}
      className="relative w-[340px] max-w-[92vw] rounded-2xl overflow-hidden pointer-events-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* icon */}
        <div className="shrink-0 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
          {cfg.icon}
        </div>

        {/* message */}
        <p className="flex-1 text-[13.5px] font-semibold text-white leading-snug drop-shadow-sm">{message}</p>

        {/* close */}
        <button
          onClick={() => onRemove(id)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-colors"
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* progress bar */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-white/30 transition-none" style={{ width: `${progress}%` }} />
    </motion.div>
  )
}

const Toast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _toastHandler = (message, type) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION + 400)
    }
    window.__toastHandler = _toastHandler
    return () => { _toastHandler = null; window.__toastHandler = null }
  }, [])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(({ id, message, type }) => (
          <ToastItem key={id} id={id} message={message} type={type} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
