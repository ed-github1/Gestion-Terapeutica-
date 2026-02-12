import { motion, AnimatePresence } from 'motion/react'
import { Crown, Sparkles, X } from 'lucide-react'

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
    if (!show) return null

    // Expanded banner with full content
    const ExpandedBanner = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="mx-3 mb-4 p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg relative overflow-hidden"
        >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
                <div className="absolute bottom-0 -left-4 w-20 h-20 bg-white rounded-full blur-2xl" />
            </div>
            
            <button
                onClick={onClose}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Cerrar banner"
            >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            
            <div className="relative flex items-start gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Crown className="w-6 h-6 text-white drop-shadow-md" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-white">Plan Pro</h3>
                        <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-md" />
                    </div>
                    <p className="text-xs text-white/95 mb-3 leading-relaxed font-medium">
                        Accede a funciones avanzadas y potencia tu experiencia
                    </p>
                    <motion.button
                        whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                        className="w-full px-4 py-2.5 bg-white text-indigo-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                        aria-label="Actualizar al Plan Pro"
                    >
                        Actualizar ahora →
                    </motion.button>
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
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            aria-label="Actualizar al Plan Pro"
            className="mx-2 mb-4 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg cursor-pointer flex items-center justify-center relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            role="button"
            tabIndex={0}
        >
            <Crown className="w-6 h-6 text-white" strokeWidth={2.5} />
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white text-indigo-600 shadow-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
