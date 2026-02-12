import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Custom hook for sidebar state management
 * Handles collapse state, reduced motion preference, and active path detection
 * 
 * @returns {Object} Sidebar state and handlers
 */
export const useSidebar = () => {
    const location = useLocation()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    // Monitor reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)
        
        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
        mediaQuery.addEventListener('change', handleChange)
        
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    /**
     * Check if a path is currently active
     * @param {string} path - Path to check
     * @param {string} userRole - Current user role
     * @returns {boolean} Whether the path is active
     */
    const isActive = (path, userRole) => {
        if (path === `/dashboard/${userRole}`) {
            return location.pathname === path
        }
        return location.pathname.startsWith(path)
    }

    /**
     * Toggle sidebar collapsed state
     */
    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev)
    }

    return {
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
        prefersReducedMotion,
        isActive,
        location
    }
}
