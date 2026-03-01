import { motion, AnimatePresence } from 'motion/react'
import { Crown, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * SidebarProBanner Component
 * Displays promotional banner for Pro plan upgrade
 * Adapts to collapsed/expanded states with different layouts
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {boolean} props.show - Whether to show the banner
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.prefersReducedMotion - User motion preference
 */
const SidebarProBanner = ({ isCollapsed, show, onClose, prefersReducedMotion }) => {
    const navigate = useNavigate()
    
    if (!show) return null

    // Expanded banner with full content
    const ExpandedBanner = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="mx-3 mb-4 rounded-2xl relative overflow-hidden"
        >
            {/* Glass card */}
            <div className="relative p-4 bg-sky-500/10 backdrop-blur-xl border border-sky-300/25 rounded-2xl shadow-xl shadow-sky-100/60">

                {/* Orb accents for depth */}
                <div className="absolute -top-5 -right-5 w-24 h-24 bg-blue-500/25 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-3 right-10 w-8 h-8 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/20 hover:bg-blue-500/35 text-blue-700 transition-colors backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Cerrar banner"
                >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>

                <div className="relative flex items-start gap-3">
                    {/* Crown icon — glass bubble */}
                    <div className="w-11 h-11 bg-blue-500/20 backdrop-blur-sm rounded-xl shrink-0 flex items-center justify-center border border-sky-300/30 shadow-inner">
                        <Crown className="w-5 h-5 text-blue-700" strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="text-sm font-bold text-blue-900">Plan Pro</h3>
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <p className="text-[11px] text-blue-700/70 mb-3 leading-relaxed">
                            Desbloquea funciones avanzadas y potencia tu experiencia
                        </p>
                        <motion.button
                            whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                            onClick={() => {
                                console.log('🔥 Pro Banner Button Clicked - Navigating to /pricing')
                                navigate('/pricing')
                            }}
                            className="w-full py-2 bg-blue-700 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-md shadow-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                            aria-label="Actualizar al Plan Pro"
                        >
                            Actualizar ahora →
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    )

    // Collapsed banner - compact icon version
    const CollapsedBanner = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            onClick={() => {
                console.log('🔥 Pro Banner Icon Clicked - Navigating to /pricing')
                navigate('/pricing')
            }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            aria-label="Actualizar al Plan Pro"
            className="mx-2 mb-4 p-3.5 bg-sky-500/10 backdrop-blur-xl border border-sky-300/25 rounded-xl shadow-xl shadow-sky-100/60 cursor-pointer flex items-center justify-center relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            role="button"
            tabIndex={0}
        >
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-500/25 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />
            <Crown className="w-5 h-5 text-blue-700 relative z-10" strokeWidth={2.5} />
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-sky-100 text-sky-500 shadow-md hover:bg-sky-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Cerrar banner"
            >
                <X className="w-3 h-3" strokeWidth={3} />
            </button>
        </motion.div>
    )

    return (
        <AnimatePresence>
            {isCollapsed ? <CollapsedBanner /> : <ExpandedBanner />}
        </AnimatePresence>
    )
}

export default SidebarProBanner
