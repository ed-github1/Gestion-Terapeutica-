import { motion } from 'motion/react'

/**
 * SidebarNavItem Component
 * Threads-style: centered icon-only button, 48×48, dark fill when active.
 */
const SidebarNavItem = ({ 
    item, 
    isActive, 
    prefersReducedMotion,
    onClick,
    index 
}) => {
    const IconComponent = item.icon

    return (
        <motion.button
            onClick={onClick}
            whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            aria-label={item.ariaLabel || item.label}
            aria-current={isActive ? 'page' : undefined}
            title={item.label}
            className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 ${
                isActive
                    ? ''
                    : 'hover:bg-gray-100 dark:hover:bg-white/6'
            }`}
        >
            {item.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-gray-900" aria-hidden="true" />
            )}
            <IconComponent
                className={`transition-all ${
                    isActive
                        ? 'w-7 h-7 text-[#0075C9] dark:text-white'
                        : 'w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-[#0075C9] dark:group-hover:text-[#54C0E8]'
                }`}
                strokeWidth={isActive ? 2.25 : 1.75}
            />
        </motion.button>
    )
}

export default SidebarNavItem
