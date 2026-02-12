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
        <div className="p-3 border-t border-slate-200/60 bg-slate-50/50 space-y-1.5">
            {/* Settings Button */}
            <motion.button
                onClick={onSettings}
                whileHover={prefersReducedMotion ? {} : { x: isCollapsed ? 0 : 3 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                aria-label="Configuración"
                className={`${buttonBaseClass} text-slate-700 hover:bg-slate-100 hover:shadow-sm focus-visible:ring-indigo-500`}
            >
                <Settings 
                    className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" 
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
                className={`${buttonBaseClass} text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:shadow-sm focus-visible:ring-rose-500`}
            >
                <LogOut 
                    className="w-5 h-5 text-slate-500 group-hover:text-rose-600 transition-colors" 
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
