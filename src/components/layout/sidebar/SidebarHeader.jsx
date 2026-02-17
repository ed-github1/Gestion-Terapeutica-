import { motion, AnimatePresence } from 'motion/react'
import { Brain } from 'lucide-react'

/**
 * SidebarHeader Component
 * Displays the branding and role-specific subtitle
 * Adapts to collapsed/expanded states with smooth animations
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {string} props.userRole - Current user role ('professional' or 'patient')
 */
const SidebarHeader = ({ isCollapsed, userRole }) => {
    const subtitle = userRole === 'professional' ? 'Espacio Profesional' : 'Tu Espacio Seguro'

    return (
        <div className="h-20 px-5 flex items-center justify-between border-b border-gray-200 bg-white">
            <AnimatePresence mode="wait">
                {!isCollapsed ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <Brain className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-blue-600 tracking-tight">
                                TotalMente
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">
                                {subtitle}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md mx-auto"
                    >
                        <Brain className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default SidebarHeader
