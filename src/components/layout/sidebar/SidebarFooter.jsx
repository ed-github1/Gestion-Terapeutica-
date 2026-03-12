import { motion } from 'motion/react'
import { Settings, LogOut } from 'lucide-react'

/**
 * SidebarFooter Component
 * Contains Settings and Logout buttons
 * Adapts layout based on collapsed state
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {boolean} props.prefersReducedMotion - User motion preference
 * @param {Function} props.onSettings - Settings click handler
 * @param {Function} props.onLogout - Logout click handler
 */
const SidebarFooter = ({ 
    isCollapsed, 
    prefersReducedMotion, 
    onSettings, 
    onLogout 
}) => {
    const buttonBaseClass = `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isCollapsed ? 'justify-center px-0' : ''
    }`

    return (
        <div className="p-3 border-t border-sky-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 space-y-1.5">
            {/* Settings Button */}
            <motion.button
                onClick={onSettings}
                whileHover={prefersReducedMotion ? {} : { x: isCollapsed ? 0 : 3 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                aria-label="Configuración"
                className={`${buttonBaseClass} text-gray-600 dark:text-gray-400 hover:bg-sky-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm focus-visible:ring-sky-500`}
            >
                <Settings 
                    className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-sky-500 transition-colors" 
                    strokeWidth={2} 
                />
                {!isCollapsed && (
                    <span className="text-sm font-semibold">Configuración</span>
                )}
            </motion.button>

            {/* Logout Button */}
            <motion.button
                onClick={onLogout}
                whileHover={prefersReducedMotion ? {} : { x: isCollapsed ? 0 : 3 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                aria-label="Cerrar sesión"
                className={`${buttonBaseClass} text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/25 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm focus-visible:ring-rose-500`}
            >
                <LogOut 
                    className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" 
                    strokeWidth={2} 
                />
                {!isCollapsed && (
                    <span className="text-sm font-semibold">Cerrar sesión</span>
                )}
            </motion.button>
        </div>
    )
}

export default SidebarFooter
