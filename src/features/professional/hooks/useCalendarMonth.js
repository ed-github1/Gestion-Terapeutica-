import { useState, useCallback } from 'react'
import { appointmentsService } from '@shared/services/appointmentsService'

/**
 * Manages the currently-viewed calendar month and fetches
 * appointments for that month from the API.
 */
export const useCalendarMonth = () => {
    const [calendarMonth, setCalendarMonthRaw] = useState(() => {
        const d = new Date()
        return { year: d.getFullYear(), month: d.getMonth() }
    })
    const [calendarMonthApts, setCalendarMonthApts] = useState([])
    const [calendarMonthLoading, setCalendarMonthLoading] = useState(false)

    const setCalendarMonth = useCallback((valueOrUpdater) => {
        setCalendarMonthRaw(prev => {
            const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater
            const firstOfMonth = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
            const lastDay = new Date(next.year, next.month + 1, 0).getDate()
            const lastOfMonth = `${next.year}-${String(next.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            setCalendarMonthLoading(true)
            appointmentsService.getCalendarEvents(firstOfMonth, lastOfMonth)
                .then(res => {
                    const raw =
                        Array.isArray(res?.data) ? res.data :
                            Array.isArray(res?.data?.data) ? res.data.data :
                                Array.isArray(res?.data?.appointments) ? res.data.appointments :
                                    []
                    setCalendarMonthApts(raw)
                })
                .catch(() => { /* keep existing data on error */ })
                .finally(() => setCalendarMonthLoading(false))
            return next
        })
    }, [])

    return { calendarMonth, setCalendarMonth, calendarMonthApts, calendarMonthLoading }
}
