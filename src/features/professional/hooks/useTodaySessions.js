import { useMemo } from 'react'
import { getTodayAppointments, resolvePatientName } from '../utils/dashboardUtils'

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
        // Real appointments from backend
        const realTodayAppointments = getTodayAppointments(appointments)

        // Appointments saved via patient booking flow (localStorage)
        let localStorageAppointments = []
        try {
            const saved = localStorage.getItem('professionalAppointments')
            if (saved) {
                const parsed = JSON.parse(saved)
                const today = new Date()
                localStorageAppointments = parsed
                    .filter(apt => {
                        const d = new Date(apt.start || apt.fechaHora)
                        return (
                            d.getFullYear() === today.getFullYear() &&
                            d.getMonth() === today.getMonth() &&
                            d.getDate() === today.getDate()
                        )
                    })
                    .map(apt => ({
                        id: apt.id,
                        patientId: apt.patientId || null,
                        nombrePaciente: resolvePatientName(apt),
                        fechaHora: apt.start || apt.fechaHora,
                        estado: apt.status || 'reserved',
                        type: apt.type || 'Primera consulta',
                        riskLevel: apt.riskLevel || 'low',
                        lastSessionNote: apt.notes || '',
                        treatmentGoal: '',
                        homeworkCompleted: false,
                        ultimaVisita: null,
                        isVideoCall: apt.isVideoCall || apt.mode === 'videollamada' || false,
                        mode: apt.mode ?? (apt.isVideoCall ? 'videollamada' : 'consultorio'),
                    }))
            }
        } catch (e) {
            console.warn('Could not read localStorage appointments', e)
        }

        // Merge: real backend + localStorage (deduplicate by id)
        const seenIds = new Set(realTodayAppointments.map(a => String(a.id)))
        const merged = [...realTodayAppointments]
        localStorageAppointments.forEach(apt => {
            if (!seenIds.has(String(apt.id))) merged.push(apt)
        })

        let todayAppointments = merged
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

        return { todayAppointments, allDaySlots, upcomingPatient }
    }, [appointments, availability, loading])
}
