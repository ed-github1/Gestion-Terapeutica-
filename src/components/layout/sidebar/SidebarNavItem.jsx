import { motion } from 'motion/react'
import { Lock } from 'lucide-react'

/**
 * SidebarNavItem Component
 * Individual navigation item with icon, label, badge, and security indicator
 * Handles hover states, active states, and accessibility
 * 
 * @param {Object} props
 * @param {Object} props.item - Menu item configuration
 * @param {boolean} props.isActive - Whether this item is currently active
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {boolean} props.prefersReducedMotion - User motion preference
 * @param {Function} props.onClick - Click handler
 * @param {number} props.index - Item index for staggered animations
 */
const SidebarNavItem = ({ 
    item, 
    isActive, 
    isCollapsed, 
    prefersReducedMotion,
    onClick,
    index 
}) => {
    const IconComponent = item.icon

    return (
        <motion.button
            onClick={onClick}
            whileHover={prefersReducedMotion ? {} : { x: isCollapsed ? 0 : 3 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            aria-label={item.ariaLabel || item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                isActive 
                    ? 'bg-sky-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
            {/* Icon with security indicator */}
            <div className="relative">
                <IconComponent 
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 group-hover:text-sky-500'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {item.secure && !isCollapsed && (
                    <Lock 
                        className="w-2.5 h-2.5 text-emerald-500 absolute -top-1 -right-1" 
                        strokeWidth={3} 
                    />
                )}
            </div>
            
            {/* Label and description (expanded state) */}
            {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${
                            isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`px-2 py-0.5 text-xs font-bold rounded-full shadow-sm ${
                                    isActive 
                                        ? 'bg-blue-700 text-white' 
                                        : 'bg-sky-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                }`}
                                aria-label={`${item.badge} notificaciones`}
                            >
                                {item.badge > 9 ? '9+' : item.badge}
                            </motion.span>
                        )}
                    </div>
                    <p className={`text-xs truncate font-medium ${
                        isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                        {item.description}
                    </p>
                </div>
            )}
            
            {/* Active indicator (expanded state) */}
            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1.5 h-10 bg-gradient-to-b from-blue-700 to-sky-400 rounded-r-full shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
            
        </motion.button>
    )
}

export default SidebarNavItem
