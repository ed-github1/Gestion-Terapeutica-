import SidebarNavItem from './SidebarNavItem'

/**
 * SidebarNav Component
 * Threads-style: centered icon buttons stacked vertically.
 */
const SidebarNav = ({ 
    menuItems, 
    isActive, 
    prefersReducedMotion,
    onNavigate 
}) => {
    return (
        <nav 
            className="flex-1 flex flex-col items-center justify-center gap-2"
            aria-label="Navegación principal"
        >
            {menuItems.map((item, index) => (
                <SidebarNavItem
                    key={item.path}
                    item={item}
                    isActive={isActive(item.path)}
                    prefersReducedMotion={prefersReducedMotion}
                    onClick={() => onNavigate(item.path)}
                    index={index}
                />
            ))}
        </nav>
    )
}

export default SidebarNav
