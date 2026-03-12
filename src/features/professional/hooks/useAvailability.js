import { useState, useEffect } from 'react'
import { appointmentsService } from '@shared/services/appointmentsService'

/**
 * Loads professional availability from the API (with localStorage fallback)
 * and keeps it in sync via storage / custom events.
 */
export const useAvailability = () => {
    const [availability, setAvailability] = useState({})

    useEffect(() => {
        const loadAvailability = async () => {
            try {
                const response = await appointmentsService.getAvailability()
                setAvailability(response?.data || {})
            } catch {
                const local = localStorage.getItem('professionalAvailability')
                if (local) {
                    try { setAvailability(JSON.parse(local)) } catch { /* ignore */ }
                }
            }
        }
        loadAvailability()
        window.addEventListener('storage', loadAvailability)
        window.addEventListener('availabilityUpdated', loadAvailability)
        return () => {
            window.removeEventListener('storage', loadAvailability)
            window.removeEventListener('availabilityUpdated', loadAvailability)
        }
    }, [])

    return availability
}
