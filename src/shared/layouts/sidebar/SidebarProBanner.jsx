import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Crown, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDarkModeContext } from '@shared/DarkModeContext'

/**
 * SidebarProBanner Component
 * Icon trigger in the narrow sidebar — hover reveals a floating popover to the right.
 */
const SidebarProBanner = ({ show, onClose, prefersReducedMotion }) => {
    const navigate = useNavigate()
    const { dark } = useDarkModeContext()
    const [isHovered, setIsHovered] = useState(false)

    if (!show) return null

    const metalGradientId = 'pro-metal-gradient'

    // Logo brand colors
    const stops = ['#0075C9', '#54C0E8', '#AEE058', '#54C0E8', '#0075C9', '#AEE058']

    const textGradient = 'linear-gradient(135deg, #0075C9 0%, #54C0E8 40%, #AEE058 100%)'

    const dropShadow = 'drop-shadow(0 0 6px rgba(84,192,232,0.5))'

    return (
        <div
            className="relative mx-2 mb-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
        >
            {/* Shared SVG gradient definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id={metalGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor={stops[0]} />
                        <stop offset="20%"  stopColor={stops[1]} />
                        <stop offset="40%"  stopColor={stops[2]} />
                        <stop offset="60%"  stopColor={stops[3]} />
                        <stop offset="80%"  stopColor={stops[4]} />
                        <stop offset="100%" stopColor={stops[5]} />
                    </linearGradient>
                </defs>
            </svg>
            {/* Icon trigger */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                onClick={() => navigate('/pricing')}
                role="button"
                tabIndex={0}
                aria-label="Actualizar al Plan Pro"
                className="pt-5 pb-3.5 px-3.5 bg-sky-500/10 dark:bg-blue-500/10 backdrop-blur-xl border border-sky-300/25 dark:border-blue-400/20 rounded-xl shadow-xl shadow-sky-100/60 dark:shadow-blue-900/30 cursor-pointer flex items-center justify-center relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: 'linear-gradient(to right, #0075C9, #54C0E8, #AEE058)' }} />
                <div className="absolute top-3 right-2 w-8 h-8 bg-blue-500/25 dark:bg-blue-400/15 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-8 h-8 bg-sky-400/20 dark:bg-blue-500/15 rounded-full blur-xl pointer-events-none" />
                <Crown className="w-5 h-5 relative z-10" strokeWidth={2.5} style={{ stroke: `url(#${metalGradientId})`, filter: dropShadow }} />
                <button
                    onClick={(e) => { e.stopPropagation(); onClose() }}
                    className="absolute top-[7px] right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-blue-500/20 hover:bg-blue-500/40 dark:bg-blue-400/20 dark:hover:bg-blue-400/40 text-blue-700 dark:text-blue-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 z-20"
                    aria-label="Cerrar banner"
                >
                    <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
            </motion.div>

            {/* Hover popover — floats to the right */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -6, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -6, scale: 0.96 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' }}
                        className="absolute left-full top-0 ml-3 w-56 z-50"
                    >
                        {/* Arrow pointing left */}
                        <div className="absolute left-0 top-5 -translate-x-1.5 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-l border-b border-sky-300/25 dark:border-blue-400/20" />

                        <div className="relative p-4 bg-white dark:bg-gray-900 backdrop-blur-xl border border-sky-300/25 dark:border-blue-400/20 rounded-2xl shadow-2xl shadow-sky-100/60 dark:shadow-blue-900/40 overflow-hidden">
                            {/* Top gradient border */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(to right, #0075C9, #54C0E8, #AEE058)' }} />

                            {/* Orb accents */}
                            <div className="absolute -top-5 -right-5 w-24 h-24 bg-blue-500/15 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-sky-400/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                            {/* Close */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose() }}
                                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/20 hover:bg-blue-500/35 dark:bg-blue-400/20 dark:hover:bg-blue-400/35 text-blue-700 dark:text-blue-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 z-20"
                                aria-label="Cerrar banner"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>

                            <div className="relative flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 dark:bg-blue-400/20 rounded-xl shrink-0 flex items-center justify-center border border-sky-300/30 dark:border-blue-400/25">
                                    <Crown className="w-5 h-5" strokeWidth={2.5} style={{ stroke: `url(#${metalGradientId})`, filter: dropShadow }} />
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                    <h3
                                            className="text-sm font-black tracking-tight"
                                            style={{
                                                background: textGradient,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                filter: dropShadow,
                                            }}
                                        >Plan Pro</h3>
                                    </div>
                                    <p className="text-[11px] text-blue-700/70 dark:text-blue-300/70 mb-3 leading-relaxed">
                                        Desbloquea funciones avanzadas y potencia tu experiencia
                                    </p>
                                    <motion.button
                                        whileHover={prefersReducedMotion ? {} : { x: 2 }}
                                        onClick={() => navigate('/pricing')}
                                        className="text-xs font-bold tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                        style={{ background: textGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                                        aria-label="Actualizar al Plan Pro"
                                    >
                                        Actualizar ahora →
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default SidebarProBanner
