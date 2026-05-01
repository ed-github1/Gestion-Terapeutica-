import { motion } from 'motion/react'
import { Settings, LogOut } from 'lucide-react'

/**
 * SidebarFooter Component
 * Threads-style: centered icon-only Settings and Logout buttons.
 */
const SidebarFooter = ({ prefersReducedMotion, onSettings, onLogout }) => {
    const iconBtn = (label, Icon, onClick, hoverClass) => (
        <motion.button
            onClick={onClick}
            whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            aria-label={label}
            title={label}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 text-gray-400 dark:text-gray-500 ${hoverClass}`}
        >
            <Icon className="w-5.5 h-5.5" strokeWidth={1.75} />
        </motion.button>
    )

    return (
        <div className="pb-4 pt-2 flex flex-col items-center gap-1 border-t border-gray-100 dark:border-gray-700/60">
            {onSettings && iconBtn('Configuración', Settings, onSettings, 'hover:bg-gray-100 dark:hover:bg-gray-700/70 hover:text-gray-900 dark:hover:text-white')}
            {iconBtn('Cerrar sesión', LogOut, onLogout, 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400')}
        </div>
    )
}

export default SidebarFooter
