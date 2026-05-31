import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'

const TopLoadingBar = () => {
  const location = useLocation()
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setKey(k => k + 1)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 500)
    return () => clearTimeout(timerRef.current)
  }, [location.pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          className="fixed top-0 left-0 z-[9999] h-1 w-full bg-linear-to-r from-[#0075C9] via-[#54C0E8] to-[#AEE058]"
          style={{ originX: 0 }}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        />
      )}
    </AnimatePresence>
  )
}

export default TopLoadingBar
