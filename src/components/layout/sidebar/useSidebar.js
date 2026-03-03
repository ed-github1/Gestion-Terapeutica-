import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Custom hook for sidebar state management
 * Handles collapse state, reduced motion preference, active path detection,
 * and hover-to-expand behaviour (Instagram-style).
 * 
 * isCollapsed  – manually pinned collapsed (user toggled)
 * isHovered    – transiently expanded because the pointer is over the sidebar
 * effectiveIsCollapsed – the real collapsed state used for rendering:
 *                        collapsed only when pinned collapsed AND not hovered
 * 
 * @returns {Object} Sidebar state and handlers
 */
export const useSidebar = () => {
    const location = useLocation()
    // Start collapsed so the sidebar is icon-only until hovered / pinned open
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isHovered, setIsHovered] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const hoverLeaveTimerRef = useRef(null)

    // Monitor reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)
        
        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
        mediaQuery.addEventListener('change', handleChange)
        
        return () => {
            mediaQuery.removeEventListener('change', handleChange)
            if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current)
        }
    }, [])

    /** Expand immediately when pointer enters */
    const handleMouseEnter = useCallback(() => {
        if (hoverLeaveTimerRef.current) {
            clearTimeout(hoverLeaveTimerRef.current)
            hoverLeaveTimerRef.current = null
        }
        setIsHovered(true)
    }, [])

    /** Collapse with a short delay when pointer leaves */
    const handleMouseLeave = useCallback(() => {
        hoverLeaveTimerRef.current = setTimeout(() => {
            setIsHovered(false)
        }, 300)
    }, [])

    /**
     * The visual state: collapsed only when manually pinned collapsed AND not hovered.
     * When isCollapsed === false the sidebar is pinned open — hover has no effect.
     */
    const effectiveIsCollapsed = isCollapsed && !isHovered

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
     * Toggle sidebar pinned-open state.
     * When unpinning (going back to collapsed), also clear the hover flag
     * so the sidebar doesn't stay open just because the pointer is there.
     */
    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            if (!prev) setIsHovered(false) // unpinning → reset hover
            return !prev
        })
    }

    return {
        isCollapsed,
        effectiveIsCollapsed,
        setIsCollapsed,
        toggleCollapse,
        prefersReducedMotion,
        isActive,
        location,
        handleMouseEnter,
        handleMouseLeave,
    }
}
