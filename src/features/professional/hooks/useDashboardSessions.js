import { useMemo } from 'react'
import { resolvePatientName } from '../utils/dashboardUtils'

const SHORT_MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * Derives calendar-related computed data: calendarData, availabilityDays,
 * upcomingSessions, selectedDateSessions, labels, and nextUpcomingSession.
 */
export const useDashboardSessions = ({
    appointments,
    calendarMonth,
    calendarMonthApts,
    availability,
    selectedDate,
    currentTime,
    allDaySlots,
    todayAppointments,
}) => {
    // Calendar grid data for the currently-viewed month
    const calendarData = useMemo(() => {
        const { year, month } = calendarMonth
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        const realApts = Array.isArray(appointments) ? appointments : []
        const sourceApts = calendarMonthApts.length > 0 ? calendarMonthApts : realApts

        const dayMap = {}
        sourceApts.forEach(apt => {
            const d = new Date(apt.fechaHora || apt.date)
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate()
                if (!dayMap[day]) dayMap[day] = { count: 0, completed: 0, cancelled: 0 }
                dayMap[day].count++
                if (apt.estado === 'completed' || apt.status === 'completed') dayMap[day].completed++
                if (apt.estado === 'cancelled' || apt.status === 'cancelled') dayMap[day].cancelled++
            }
        })

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const totalSessions = Object.values(dayMap).reduce((s, d) => s + d.count, 0)
        const completedSessions = Object.values(dayMap).reduce((s, d) => s + d.completed, 0)
        const cancelledSessions = Object.values(dayMap).reduce((s, d) => s + d.cancelled, 0)

        return { firstDay, daysInMonth, dayMap, monthName: monthNames[month], year, totalSessions, completedSessions, cancelledSessions }
    }, [calendarMonth, calendarMonthApts, appointments])

    // Days with open availability (for mini-calendar rings)
    const availabilityDays = useMemo(() => {
        const { year, month } = calendarMonth
        const days = new Set()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(year, month, d).getDay()
            const slots = availability[dow]
            if (Array.isArray(slots) && slots.length > 0) days.add(d)
        }
        return days
    }, [calendarMonth, availability])

    // Upcoming sessions (any future date)
    const upcomingSessions = useMemo(() => {
        const allApts = Array.isArray(appointments) ? appointments : []
        const now = new Date()
        return allApts
            .filter(apt => {
                const d = new Date(apt.fechaHora || apt.date)
                return !isNaN(d) && d >= now
            })
            .map(apt => {
                const rawPid = apt.patientId || apt.patient
                const patientDocId = (typeof rawPid === 'object' && rawPid !== null)
                    ? (rawPid._id || rawPid.id || null)
                    : (rawPid || null)
                const patientUserId = apt.patientUserId
                    || (typeof rawPid === 'object' && rawPid !== null ? (rawPid.userId || rawPid.user) : null)
                    || null
                return {
                id: apt._id || apt.id,
                patientId: patientDocId,
                patientUserId,
                nombrePaciente: resolvePatientName(apt),
                fechaHora: apt.fechaHora || apt.date,
                estado: apt.estado || apt.status,
                riskLevel: apt.riskLevel || 'low',
                treatmentGoal: apt.treatmentGoal || '',
                lastSessionNote: apt.lastSessionNote || '',
                homeworkCompleted: apt.homeworkCompleted || false,
                duration: apt.duration,
                isVideoCall: apt.isVideoCall || apt.mode === 'videollamada' || false,
                mode: apt.mode ?? (apt.isVideoCall ? 'videollamada' : 'consultorio'),
            }})
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
            .slice(0, 10)
    }, [appointments])

    const isViewingToday = selectedDate.toDateString() === currentTime.toDateString()

    // Sessions for the selected calendar date
    const selectedDateSessions = useMemo(() => {
        const selYear = selectedDate.getFullYear()
        const selMonth = selectedDate.getMonth()
        const selDay = selectedDate.getDate()
        const now = new Date()
        const isToday =
            selYear === now.getFullYear() &&
            selMonth === now.getMonth() &&
            selDay === now.getDate()

        if (isToday && allDaySlots.length > 0) return allDaySlots

        // When viewing today but allDaySlots is empty (e.g. still loading
        // availability), fall back to todayAppointments so past-time sessions
        // are not lost. upcomingSessions only contains d >= now.
        if (isToday) {
            return todayAppointments.length > 0 ? todayAppointments : upcomingSessions
        }

        const allApts = Array.isArray(appointments) ? appointments : []
        return allApts
            .filter(apt => {
                const dateField = apt.date || apt.fechaHora
                if (!dateField) return false
                const dateOnly = String(dateField).slice(0, 10)
                const [yr, mo, dy] = dateOnly.split('-').map(Number)
                return yr === selYear && mo === selMonth + 1 && dy === selDay
            })
            .map(apt => {
                const rawPid = apt.patientId || apt.patient
                const patientDocId = (typeof rawPid === 'object' && rawPid !== null)
                    ? (rawPid._id || rawPid.id || null)
                    : (rawPid || null)
                const patientUserId = apt.patientUserId
                    || (typeof rawPid === 'object' && rawPid !== null ? (rawPid.userId || rawPid.user) : null)
                    || null
                return {
                id: apt._id || apt.id,
                patientId: patientDocId,
                patientUserId,
                nombrePaciente: resolvePatientName(apt),
                fechaHora: apt.fechaHora || apt.date,
                estado: apt.estado || apt.status,
                riskLevel: apt.riskLevel || 'low',
                treatmentGoal: apt.treatmentGoal || '',
                lastSessionNote: apt.lastSessionNote || '',
                homeworkCompleted: apt.homeworkCompleted || false,
                duration: apt.duration,
                isVideoCall: apt.isVideoCall || apt.mode === 'videollamada' || false,
                mode: apt.mode ?? (apt.isVideoCall ? 'videollamada' : 'consultorio'),
            }})
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    }, [selectedDate, allDaySlots, todayAppointments, appointments, upcomingSessions])

    const isShowingUpcoming = isViewingToday && allDaySlots.length === 0 && todayAppointments.length === 0 && upcomingSessions.length > 0

    const selectedDateLabel = isShowingUpcoming
        ? 'Próximas sesiones'
        : isViewingToday
            ? 'Sesiones de hoy'
            : `Sesiones — ${selectedDate.getDate()} ${SHORT_MONTH_NAMES[selectedDate.getMonth()]}`

    // Next upcoming session (today or future)
    const nextUpcomingSession = useMemo(() => {
        const now = new Date()
        const fromToday = todayAppointments.find(a => {
            const t = new Date(a.fechaHora)
            const minsAgo = (now - t) / 60000
            return t > now || (minsAgo >= 0 && minsAgo < 60)
        })
        if (fromToday) return fromToday
        if (Array.isArray(appointments) && appointments.length > 0) {
            const future = [...appointments]
                .filter(a => new Date(a.fechaHora || a.date) > now)
                .sort((a, b) => new Date(a.fechaHora || a.date) - new Date(b.fechaHora || b.date))
            if (future.length > 0) {
                const apt = future[0]
                return {
                    id: apt._id || apt.id,
                    nombrePaciente: resolvePatientName(apt),
                    fechaHora: apt.fechaHora || apt.date,
                    riskLevel: apt.riskLevel || 'low',
                    treatmentGoal: apt.treatmentGoal || '',
                    lastSessionNote: apt.lastSessionNote || '',
                    homeworkCompleted: apt.homeworkCompleted || false,
                }
            }
        }
        return null
    }, [todayAppointments, appointments])

    return {
        calendarData,
        availabilityDays,
        upcomingSessions,
        selectedDateSessions,
        isViewingToday,
        isShowingUpcoming,
        selectedDateLabel,
        nextUpcomingSession,
    }
}
