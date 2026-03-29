import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'

// Hooks and config
import { useSidebar } from './useSidebar'
import { getMenuItems, sidebarAnimationConfig } from './sidebarConfig'

// Components
import SidebarHeader from './SidebarHeader'
import SidebarNav from './SidebarNav'
import SidebarFooter from './SidebarFooter'
import SidebarProBanner from './SidebarProBanner'

/**
 * DashboardSidebar Component
 * Threads-style: narrow 72px icon-only sidebar.
 */
const SNOOZE_DAYS = 7
const STORAGE_KEY = 'sidebar_pro_banner_snoozed_at'

const isPaidPlan = (plan) => plan === 'PRO' || plan === 'EMPRESA'

const isBannerSnoozed = () => {
    const snoozedAt = localStorage.getItem(STORAGE_KEY)
    if (!snoozedAt) return false
    return Date.now() - Number(snoozedAt) < SNOOZE_DAYS * 24 * 60 * 60 * 1000
}

const DashboardSidebar = ({ userRole = 'professional', onClose }) => {
    const navigate = useNavigate()
    const { logout, user } = useAuth()

    const { prefersReducedMotion, isActive } = useSidebar()

    // Never show banner for patients or for users already on a paid plan
    const userPlan = user?.plan || user?.subscriptionPlan || user?.planType
    const [showProBanner, setShowProBanner] = useState(
        () => userRole !== 'patient' && !isPaidPlan(userPlan) && !isBannerSnoozed()
    )

    // Hide immediately if user upgrades mid-session
    useEffect(() => {
        if (userRole === 'patient' || isPaidPlan(user?.plan || user?.subscriptionPlan || user?.planType)) {
            setShowProBanner(false)
        }
    }, [userRole, user?.plan, user?.subscriptionPlan, user?.planType])

    const handleCloseBanner = () => {
        setShowProBanner(false)
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }

    const menuItems = getMenuItems(userRole)

    const handleNavigation = (path) => {
        navigate(path)
        onClose?.()
    }

    const handleSettings = () => handleNavigation(`/dashboard/${userRole}/settings`)

    const handleLogout = () => {
        logout()
        onClose?.()
    }

    const checkIsActive = (path) => isActive(path, userRole)

    return (
        <motion.aside
            initial={sidebarAnimationConfig.initial}
            animate={sidebarAnimationConfig.animate}
            exit={sidebarAnimationConfig.exit}
            transition={sidebarAnimationConfig.transition(prefersReducedMotion)}
            className="h-full glass-sidebar flex flex-col justify-center w-[4.5rem]"
            role="navigation"
            aria-label="Navegación principal"
        >
            <SidebarHeader />

            <SidebarNav
                menuItems={menuItems}
                isActive={checkIsActive}
                prefersReducedMotion={prefersReducedMotion}
                onNavigate={handleNavigation}
            />

            <SidebarProBanner
                show={showProBanner}
                onClose={handleCloseBanner}
                prefersReducedMotion={prefersReducedMotion}
            />

            <SidebarFooter
                prefersReducedMotion={prefersReducedMotion}
                onSettings={handleSettings}
                onLogout={handleLogout}
            />
        </motion.aside>
    )
}

export default DashboardSidebar
