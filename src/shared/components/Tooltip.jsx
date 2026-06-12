import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function Tooltip({ children, text, side = 'top' }) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  const arrowClasses = {
    top: 'top-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent',
    bottom: 'bottom-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent',
    left: 'left-full border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent',
    right: 'right-full border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent',
  }

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute ${positionClasses[side]} left-1/2 -translate-x-1/2 z-50 whitespace-nowrap`}
          >
            <div className="px-2.5 py-1.5 bg-gray-900 dark:bg-gray-950 text-white text-xs font-medium rounded-md shadow-lg">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
