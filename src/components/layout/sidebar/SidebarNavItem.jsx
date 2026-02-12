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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 ${
                isActive 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-100/80 hover:shadow-sm'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
            {/* Icon with security indicator */}
            <div className="relative">
                <IconComponent 
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {item.secure && !isCollapsed && (
                    <Lock 
                        className="w-2.5 h-2.5 text-emerald-600 absolute -top-1 -right-1" 
                        strokeWidth={3} 
                    />
                )}
            </div>
            
            {/* Label and description (expanded state) */}
            {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${
                            isActive ? 'text-indigo-700' : 'text-slate-800'
                        }`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-sm"
                                aria-label={`${item.badge} notificaciones`}
                            >
                                {item.badge > 9 ? '9+' : item.badge}
                            </motion.span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">
                        {item.description}
                    </p>
                </div>
            )}
            
            {/* Active indicator (expanded state) */}
            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1.5 h-10 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
            
            {/* Badge (collapsed state) */}
            {isCollapsed && item.badge && (
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                    aria-label={`${item.badge} notificaciones`}
                >
                    {item.badge > 9 ? '9+' : item.badge}
                </motion.span>
            )}
        </motion.button>
    )
}

export default SidebarNavItem
