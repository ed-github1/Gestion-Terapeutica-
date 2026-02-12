import { motion } from 'motion/react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * SidebarCollapseToggle Component
 * Button to toggle sidebar collapsed/expanded state
 * Only visible on desktop (md+) breakpoint
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {boolean} props.prefersReducedMotion - User motion preference
 * @param {Function} props.onToggle - Toggle handler
 */
const SidebarCollapseToggle = ({ isCollapsed, prefersReducedMotion, onToggle }) => {
    return (
        <motion.button
            onClick={onToggle}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05, x: isCollapsed ? 2 : -2 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            className="hidden md:flex absolute -right-4 top-24 z-10 w-8 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-r-xl items-center justify-center shadow-lg hover:shadow-xl transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            aria-expanded={!isCollapsed}
        >
            <div className="flex flex-col items-center gap-0.5">
                {isCollapsed ? (
                    <ChevronsRight className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                    <ChevronsLeft className="w-4 h-4" strokeWidth={2.5} />
                )}
                <div className="flex flex-col gap-0.5 mt-1">
                    <div className="w-1 h-1 rounded-full bg-white/50" />
                    <div className="w-1 h-1 rounded-full bg-white/50" />
                    <div className="w-1 h-1 rounded-full bg-white/50" />
                </div>
            </div>
        </motion.button>
    )
}

export default SidebarCollapseToggle
