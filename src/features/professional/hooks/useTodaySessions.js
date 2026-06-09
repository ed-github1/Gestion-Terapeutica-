import { useMemo } from 'react'
import { getTodayAppointments, getPendingPaymentAppointments } from '../utils/dashboardUtils'

/**
 * Derives today's appointments (merged from API + localStorage),
 * all-day slots including unavailable gaps, and the first upcoming patient.
 *
 * @param {Array} appointments - All appointments from the API
 * @param {Object} availability - Day-of-week availability map
 * @param {boolean} loading - Whether appointments are still loading
 */
export const useTodaySessions = (appointments, availability, loading) => {
    return useMemo(() => {
        localStorage.removeItem('professionalAppointments')

        let todayAppointments = getTodayAppointments(appointments)
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

        // Add availability info to each appointment
        todayAppointments = todayAppointments.map(appointment => {
            const appointmentDate = new Date(appointment.fechaHora)
            const dayOfWeek = appointmentDate.getDay()
            const timeStr = `${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`
            const dayAvailability = availability[dayOfWeek] || []
            return { ...appointment, isInAvailableSlot: dayAvailability.includes(timeStr) }
        })

        // Generate "No Disponible" pills when there are NO real appointments today
        const unavailableSlotsToday = []
        const hasAvailabilityData = Object.values(availability).some(slots => Array.isArray(slots) && slots.length > 0)

        if (!loading && hasAvailabilityData && todayAppointments.length === 0) {
            const today = new Date()
            const todayAvailability = availability[today.getDay()] || []
            if (todayAvailability.length === 0) return { todayAppointments, allDaySlots: [], upcomingPatient: null }

            for (let hour = 0; hour <= 23; hour++) {
                const slots = [`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`]
                slots.forEach(timeSlot => {
                    if (!todayAvailability.includes(timeSlot)) {
                        const [h, m] = timeSlot.split(':')
                        const slotDate = new Date()
                        slotDate.setHours(parseInt(h), parseInt(m), 0, 0)
                        unavailableSlotsToday.push({
                            id: `unavailable-${timeSlot}`,
                            fechaHora: slotDate,
                            isUnavailable: true,
                            timeSlot,
                        })
                    }
                })
            }
        }

        const allDaySlots = [...todayAppointments, ...unavailableSlotsToday]
            .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())

        const upcomingPatient = todayAppointments[0]
        const pendingPaymentToday = getPendingPaymentAppointments(appointments)

        return { todayAppointments, allDaySlots, upcomingPatient, pendingPaymentToday }
    }, [appointments, availability, loading])
}
