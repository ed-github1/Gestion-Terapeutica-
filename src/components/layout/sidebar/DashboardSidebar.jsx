import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@features/auth'

// Hooks and config
import { useSidebar } from './useSidebar'
import { getMenuItems, sidebarAnimationConfig } from './sidebarConfig'

// Components
import SidebarHeader from './SidebarHeader'
import SidebarNav from './SidebarNav'
import SidebarProBanner from './SidebarProBanner'
import SidebarFooter from './SidebarFooter'
import SidebarCollapseToggle from './SidebarCollapseToggle'

/**
 * DashboardSidebar Component
 * Main sidebar navigation for the dashboard
 * Adapts content and language based on user role (professional/patient)
 * Supports collapsed/expanded states and accessibility features
 * 
 * @param {Object} props
 * @param {string} props.userRole - 'professional' or 'patient'
 * @param {Function} props.onClose - Close handler for mobile view
 */
const DashboardSidebar = ({ userRole = 'professional', onClose }) => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [showProBanner, setShowProBanner] = useState(true)
    
    // Custom hook for sidebar state management
    const {
        isCollapsed,
        toggleCollapse,
        prefersReducedMotion,
        isActive
    } = useSidebar()

    // Get menu items based on user role
    const menuItems = getMenuItems(userRole)

    /**
     * Handle navigation and close mobile sidebar
     */
    const handleNavigation = (path) => {
        navigate(path)
        onClose?.()
    }

    /**
     * Handle settings navigation
     */
    const handleSettings = () => {
        handleNavigation(`/dashboard/${userRole}/settings`)
    }

    /**
     * Handle logout
     */
    const handleLogout = () => {
        logout()
        onClose?.()
    }

    /**
     * Check if path is active
     */
    const checkIsActive = (path) => isActive(path, userRole)

    return (
        <motion.aside
            initial={sidebarAnimationConfig.initial}
            animate={sidebarAnimationConfig.animate(isCollapsed)}
            exit={sidebarAnimationConfig.exit}
            transition={sidebarAnimationConfig.transition(prefersReducedMotion)}
            className="h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 flex flex-col relative shadow-sm"
            role="navigation"
            aria-label="Navegación principal"
        >
            {/* Collapse Toggle */}
            <SidebarCollapseToggle
                isCollapsed={isCollapsed}
                prefersReducedMotion={prefersReducedMotion}
                onToggle={toggleCollapse}
            />

            {/* Header */}
            <SidebarHeader
                isCollapsed={isCollapsed}
                userRole={userRole}
            />

            {/* Navigation */}
            <SidebarNav
                menuItems={menuItems}
                isActive={checkIsActive}
                isCollapsed={isCollapsed}
                prefersReducedMotion={prefersReducedMotion}
                onNavigate={handleNavigation}
            />

            {/* Pro Plan Banner */}
            <SidebarProBanner
                isCollapsed={isCollapsed}
                show={showProBanner}
                onClose={() => setShowProBanner(false)}
                prefersReducedMotion={prefersReducedMotion}
            />

            {/* Footer */}
            <SidebarFooter
                isCollapsed={isCollapsed}
                prefersReducedMotion={prefersReducedMotion}
                onSettings={handleSettings}
                onLogout={handleLogout}
            />
        </motion.aside>
    )
}

export default DashboardSidebar
