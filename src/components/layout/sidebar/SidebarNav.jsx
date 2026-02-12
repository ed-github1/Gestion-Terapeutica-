import SidebarNavItem from './SidebarNavItem'

/**
 * SidebarNav Component
 * Container for navigation items with scrollable area
 * 
 * @param {Object} props
 * @param {Array} props.menuItems - Array of menu item configurations
 * @param {Function} props.isActive - Function to check if path is active
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {boolean} props.prefersReducedMotion - User motion preference
 * @param {Function} props.onNavigate - Navigation click handler
 */
const SidebarNav = ({ 
    menuItems, 
    isActive, 
    isCollapsed, 
    prefersReducedMotion,
    onNavigate 
}) => {
    return (
        <nav 
            className="flex-1 py-6 px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
            aria-label="Navegación principal"
        >
            <div className="space-y-1.5">
                {menuItems.map((item, index) => (
                    <SidebarNavItem
                        key={item.path}
                        item={item}
                        isActive={isActive(item.path)}
                        isCollapsed={isCollapsed}
                        prefersReducedMotion={prefersReducedMotion}
                        onClick={() => onNavigate(item.path)}
                        index={index}
                    />
                ))}
            </div>
        </nav>
    )
}

export default SidebarNav
