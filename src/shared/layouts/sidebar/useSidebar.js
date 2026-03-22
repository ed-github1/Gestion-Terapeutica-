import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Minimal sidebar hook — provides active-path detection and reduced-motion preference.
 */
export const useSidebar = () => {
    const location = useLocation()
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)
        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const isActive = (path, userRole) => {
        if (path === `/dashboard/${userRole}`) {
            return location.pathname === path
        }
        return location.pathname.startsWith(path)
    }

    return { prefersReducedMotion, isActive, location }
}
