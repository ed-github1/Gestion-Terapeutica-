import { motion, AnimatePresence } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'

/**
 * SidebarHeader Component
 * Displays the branding and a minimal manual collapse/expand toggle button.
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {string} props.userRole - Current user role ('professional' or 'patient')
 * @param {Function} props.onToggle - Toggle collapse handler
 * @param {boolean} props.prefersReducedMotion - User motion preference
 */
const SidebarHeader = ({ isCollapsed, userRole, onToggle, prefersReducedMotion }) => {
    return (
        <div className={`h-20 px-4 border-b border-gray-100 dark:border-gray-700 bg-transparent flex ${
            isCollapsed ? 'flex-col items-center justify-center gap-2 px-2' : 'items-center justify-between'
        }`}>
            <AnimatePresence mode="wait">
                {!isCollapsed ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2.5 min-w-0"
                    >
                        <img src={logoSymbol} alt="" className="h-9 w-9 object-contain shrink-0" />
                        <div className="flex flex-col leading-tight">
                            <span className="text-[17px] text-[#4A5568] dark:text-gray-300 tracking-tight">
                                <span className="font-normal">Total</span><span className="font-bold">Mente</span>
                            </span>
                            <span className="text-[8px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                                Acompaña·Transforma·Gestiona
                            </span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                    >
                        <img src={logoSymbol} alt="TotalMente" className="h-9 w-9 object-contain" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual collapse toggle — desktop only */}
            <motion.button
                onClick={onToggle}
                whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center shrink-0
                           bg-gray-100 dark:bg-gray-700 hover:bg-sky-50 dark:hover:bg-gray-600
                           text-gray-400 hover:text-[#0075C9]
                           transition-colors duration-150
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54C0E8] focus-visible:ring-offset-1"
                aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
                title={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
                {isCollapsed
                    ? <PanelLeftOpen className="w-[15px] h-[15px]" strokeWidth={2} />
                    : <PanelLeftClose className="w-[15px] h-[15px]" strokeWidth={2} />
                }
            </motion.button>
        </div>
    )
}

export default SidebarHeader
