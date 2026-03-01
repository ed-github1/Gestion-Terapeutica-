import { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import NewPatientLinkModal from './NewPatientLinkModal'
import { useDashboardData } from '../dashboard/useDashboard'
import { getTodayAppointments } from '../dashboard/dashboardUtils'
import { videoCallService } from '@shared/services/videoCallService'
import { appointmentsService } from '@shared/services/appointmentsService'
import { ROUTES } from '@shared/constants/routes'
import {
    SessionsCalendarPanel,
    QuickActions,
    MiniCalendarWidget,
    KpiChip,
    KpiChipSkeleton,
    GeneralNotes,
} from './dashboard'

// ─────────────────────────────────────────────────────────────────────────────
// Static mock data (move to a service / API when real data is available)
// ─────────────────────────────────────────────────────────────────────────────


const MOCK_REVENUE = { thisMonth: 4800, lastMonth: 4200, outstanding: 650, pendingClaims: 3 }


// ─────────────────────────────────────────────────────────────────────────────

const ModernProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [currentTime, setCurrentTime] = useState(new Date())
    const { stats, patients, appointments, activities, loading, error } = useDashboardData()
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [availability, setAvailability] = useState({})
    const [calendarMonth, setCalendarMonthRaw] = useState(() => {
        const d = new Date()
        return { year: d.getFullYear(), month: d.getMonth() }
    })
    const [calendarMonthApts, setCalendarMonthApts]   = useState([])
    const [calendarMonthLoading, setCalendarMonthLoading] = useState(false)
    // Quick-create popover state: null | { date: Date }
    const [quickCreate, setQuickCreate] = useState(null)
    const [quickForm, setQuickForm]     = useState({ patientName: '', time: '09:00', duration: '60', isVideoCall: false })
    const [selectedDate, setSelectedDate] = useState(() => new Date())
    // 'sessions' | 'calendar' — controls the animated slide on below-xl screens
    // sessions is the primary/default view; calendar is opened via the icon button
    const [calendarView, setCalendarView] = useState('sessions')

    // Wrapped setter that also fetches calendar events for the new month
    const setCalendarMonth = useCallback((valueOrUpdater) => {
        setCalendarMonthRaw(prev => {
            const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater
            // Fetch month events asynchronously
            const firstOfMonth = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
            const lastDay      = new Date(next.year, next.month + 1, 0).getDate()
            const lastOfMonth  = `${next.year}-${String(next.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            setCalendarMonthLoading(true)
            appointmentsService.getCalendarEvents(firstOfMonth, lastOfMonth)
                .then(res => {
                    const raw =
                        Array.isArray(res?.data)               ? res.data :
                        Array.isArray(res?.data?.data)          ? res.data.data :
                        Array.isArray(res?.data?.appointments)  ? res.data.appointments :
                        []
                    setCalendarMonthApts(raw)
                })
                .catch(() => { /* keep existing data on error */ })
                .finally(() => setCalendarMonthLoading(false))
            return next
        })
    }, [])

    // Extract user name with fallback
    const userName = user?.name?.split(' ')[0] || user?.nombre || 'Doctor'
    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    // ── Mock today sessions (shown when no real data is available) ────────────
    const mockTodaySessions = useMemo(() => {
        const t = (offsetMins) => {
            const d = new Date()
            d.setSeconds(0, 0)
            d.setMinutes(d.getMinutes() + offsetMins)
            return d.toISOString()
        }
        return [
            {
                id: 'mock-s1',
                nombrePaciente: 'Jemma Linda',
                fechaHora: t(-150),
                estado: 'completed',
                riskLevel: 'low',
                homeworkCompleted: true,
                totalSessions: 7,
                ultimaVisita: t(-150 - 60 * 24 * 7),
                treatmentGoal: 'Terapia cognitiva — ansiedad',
            },
            {
                id: 'mock-s2',
                nombrePaciente: 'Pedro Martínez',
                fechaHora: t(-90),
                estado: 'completed',
                riskLevel: 'high',
                homeworkCompleted: false,
                totalSessions: 3,
                ultimaVisita: t(-90 - 60 * 24 * 14),
                treatmentGoal: 'Manejo crisis — depresión severa',
            },
            {
                id: 'mock-s3',
                nombrePaciente: 'Sara Alcázar',
                fechaHora: t(-30),
                estado: 'completed',
                riskLevel: 'medium',
                homeworkCompleted: true,
                totalSessions: 12,
                ultimaVisita: t(-30 - 60 * 24 * 7),
                treatmentGoal: 'EMDR — trauma',
            },
            {
                id: 'mock-next',
                nombrePaciente: 'María González',
                fechaHora: t(18),
                estado: 'reserved',
                riskLevel: 'medium',
                homeworkCompleted: true,
                totalSessions: 5,
                ultimaVisita: t(18 - 60 * 24 * 7),
                treatmentGoal: 'Manejo de ansiedad generalizada',
                lastSessionNote: 'Progresando con técnicas de respiración y registro cognitivo.',
            },
            {
                id: 'mock-s5',
                nombrePaciente: 'Carlos Rivera',
                fechaHora: t(90),
                estado: 'reserved',
                riskLevel: 'low',
                homeworkCompleted: false,
                totalSessions: 9,
                ultimaVisita: t(90 - 60 * 24 * 7),
                treatmentGoal: 'Gestión del estrés laboral',
            },
            {
                id: 'mock-s6',
                nombrePaciente: 'Ana Torres',
                fechaHora: t(180),
                estado: 'reserved',
                riskLevel: 'low',
                homeworkCompleted: true,
                totalSessions: 2,
                ultimaVisita: null,
                treatmentGoal: 'Evaluación inicial — duelo',
            },
        ]
    }, [])

    // Memoize expensive calculations to prevent re-running on every render
    const { todayAppointments, allDaySlots, upcomingPatient } = useMemo(() => {
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
                        nombrePaciente: apt.patientName || 'Paciente',
                        fechaHora: apt.start || apt.fechaHora,
                        estado: apt.status || 'reserved',
                        type: apt.type || 'Consulta',
                        riskLevel: apt.riskLevel || 'low',
                        lastSessionNote: apt.notes || '',
                        treatmentGoal: '',
                        homeworkCompleted: false,
                        ultimaVisita: null,
                    }))
            }
        } catch (e) {
            console.warn('Could not read localStorage appointments', e)
        }

        // Merge: real backend + localStorage + mock fallback (mock only when no real data)
        const seenIds = new Set(realTodayAppointments.map(a => String(a.id)))
        const merged = [...realTodayAppointments]
        localStorageAppointments.forEach(apt => {
            if (!seenIds.has(String(apt.id))) merged.push(apt)
        })
        // Always inject mock sessions so the timeline is populated during development.
        // Real data takes precedence — mocks with duplicate IDs are skipped.
        mockTodaySessions.forEach(apt => {
            if (!seenIds.has(String(apt.id))) merged.push(apt)
        })

        let todayAppointments = merged
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

        // Add availability info to appointments
        todayAppointments = todayAppointments.map(appointment => {
            const appointmentDate = new Date(appointment.fechaHora)
            const dayOfWeek = appointmentDate.getDay()
            const timeStr = `${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`

            const dayAvailability = availability[dayOfWeek] || []
            const isInAvailableSlot = dayAvailability.includes(timeStr)

            return {
                ...appointment,
                isInAvailableSlot
            }
        })

        // Generate pills for time slots WITHOUT appointments (either unavailable or break time)
        // Skip entirely when no availability is configured — avoids flooding the timeline with
        // 27 "No Disponible" pills that bury the real session cards.
        const unavailableSlotsToday = []
        const today = new Date()
        const todayDayOfWeek = today.getDay()
        const todayAvailability = availability[todayDayOfWeek] || []
        const hasAvailabilityData = Object.values(availability).some(slots => Array.isArray(slots) && slots.length > 0)

        if (hasAvailabilityData) {
            // Get times of existing appointments
            const appointmentTimes = new Set(
                todayAppointments.map(apt => {
                    const date = new Date(apt.fechaHora)
                    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                })
            )

            // Generate all possible time slots for the day (7:00 AM - 8:00 PM)
            const allPossibleSlots = []
            for (let hour = 7; hour <= 20; hour++) {
                allPossibleSlots.push(`${hour.toString().padStart(2, '0')}:00`)
                if (hour < 20) {
                    allPossibleSlots.push(`${hour.toString().padStart(2, '0')}:30`)
                }
            }

            // Create "unavailable" or "break" entries for slots without appointments
            allPossibleSlots.forEach(timeSlot => {
                if (!appointmentTimes.has(timeSlot)) {
                    // Check if this slot is in availability
                    const isInAvailability = todayAvailability.includes(timeSlot)
                    const [hours, minutes] = timeSlot.split(':')

                    // Create date for TODAY with the specific time
                    const slotDate = new Date()
                    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

                    // Only show pill for slots NOT in availability
                    if (!isInAvailability) {
                        unavailableSlotsToday.push({
                            id: `unavailable-${timeSlot}`,
                            fechaHora: slotDate,
                            isUnavailable: true,
                            timeSlot: timeSlot
                        })
                    }
                }
            })
        } // end hasAvailabilityData

        // Merge appointments and unavailable slots, sort chronologically (earliest first)
        const allDaySlots = [...todayAppointments, ...unavailableSlotsToday]
            .sort((a, b) => {
                const timeA = new Date(a.fechaHora).getTime()
                const timeB = new Date(b.fechaHora).getTime()
                return timeA - timeB
            })

        // Get upcoming patient info from first appointment
        const upcomingPatient = todayAppointments[0]

        return { todayAppointments, allDaySlots, upcomingPatient }
    }, [appointments, availability, mockTodaySessions]) // Only recalculate when appointments or availability change

    // Calendar: build a set of appointment days for current viewed month
    // Uses month-specific API data when available, falls back to full appointments list
    const calendarData = useMemo(() => {
        const { year, month } = calendarMonth
        const firstDay = new Date(year, month, 1).getDay() // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        // Prefer freshly-fetched month data; fall back to full list + mocks
        const sourceApts = calendarMonthApts.length > 0
            ? calendarMonthApts
            : [...(Array.isArray(appointments) ? appointments : []), ...mockTodaySessions]

        // Build map: day -> { count, hasCompleted, hasCancelled }
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
    }, [calendarMonth, calendarMonthApts, appointments, mockTodaySessions])

    // Build a Set of day-numbers that have open availability slots (for mini-calendar rings)
    const availabilityDays = useMemo(() => {
        const { year, month } = calendarMonth
        const days = new Set()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(year, month, d).getDay()  // 0=Sun
            const slots = availability[dow]
            if (Array.isArray(slots) && slots.length > 0) days.add(d)
        }
        return days
    }, [calendarMonth, availability])

    // Sessions for the selected calendar date
    const isViewingToday = selectedDate.toDateString() === currentTime.toDateString()
    const selectedDateSessions = useMemo(() => {
        // Compute the "is today" check INSIDE the memo using a fresh Date so it is
        // never stale relative to the currentTime ticker that fires every second.
        const selYear  = selectedDate.getFullYear()
        const selMonth = selectedDate.getMonth()   // 0-based
        const selDay   = selectedDate.getDate()
        const now      = new Date()
        const isToday  =
            selYear  === now.getFullYear() &&
            selMonth === now.getMonth() &&
            selDay   === now.getDate()

        if (isToday) return allDaySlots

        const allApts = Array.isArray(appointments) ? appointments : []
        return allApts
            .filter(apt => {
                const dateField = apt.fechaHora || apt.date
                if (!dateField) return false
                // Use safe ISO-slice comparison to avoid UTC ↔ local day-shift
                // (mirrors the logic in getTodayAppointments)
                const dateOnly = String(dateField).slice(0, 10) // "YYYY-MM-DD"
                const [yr, mo, dy] = dateOnly.split('-').map(Number)
                return yr === selYear && mo === selMonth + 1 && dy === selDay
            })
            .map(apt => ({
                id: apt._id || apt.id,
                nombrePaciente: apt.patientName || apt.nombrePaciente || 'Paciente',
                fechaHora: apt.fechaHora || apt.date,
                estado: apt.estado || apt.status,
                riskLevel: apt.riskLevel || 'low',
                treatmentGoal: apt.treatmentGoal || '',
                lastSessionNote: apt.lastSessionNote || '',
                homeworkCompleted: apt.homeworkCompleted || false,
            }))
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    }, [selectedDate, allDaySlots, appointments])

    const shortMonthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const selectedDateLabel = isViewingToday
        ? 'Sesiones de hoy'
        : `Sesiones — ${selectedDate.getDate()} ${shortMonthNames[selectedDate.getMonth()]}`

    const monthGrowth  = Math.round((stats.totalPatients / Math.max(stats.totalPatients - 10, 1)) * 100) - 100
    const revenueGrowth = Math.round(((MOCK_REVENUE.thisMonth - MOCK_REVENUE.lastMonth) / MOCK_REVENUE.lastMonth) * 100)

    // ── Next upcoming session ─────────────────────────────────────────────────
    const nextUpcomingSession = (() => {
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
                    nombrePaciente: apt.patientName || apt.nombrePaciente || 'Paciente',
                    fechaHora: apt.fechaHora || apt.date,
                    riskLevel: apt.riskLevel || 'low',
                    treatmentGoal: apt.treatmentGoal || '',
                    lastSessionNote: apt.lastSessionNote || '',
                    homeworkCompleted: apt.homeworkCompleted || false,
                }
            }
        }
        return mockTodaySessions.find(s => s.id === 'mock-next') ?? null
    })()

    // Handler for joining video call - memoized to prevent excessive re-renders
    const handleJoinVideo = useCallback(async (appointment) => {
        try {
            const professionalName = user?.name || user?.nombre || 'Professional'
            const patientName = appointment.patientName || appointment.patient?.name || 'Paciente'
            await videoCallService.sendVideoInvitation(
                appointment.id,
                appointment.patientId,
                patientName,
                professionalName
            )
        } catch {
            // Still navigate even if notification fails
        }
        navigate(`/professional/video/${appointment.id}`)
    }, [navigate, user])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Load availability settings
    useEffect(() => {
        const loadAvailability = async () => {
            try {
                const response = await appointmentsService.getAll({})
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

    const greeting = currentTime.getHours() < 12 ? 'Buenos días' : currentTime.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'

    return (
        <>
          <div className="bg-transparent xl:h-full">
                <div className="xl:h-full xl:flex xl:flex-col">
                    {/* Main Content */}
                    <div className="p-3 md:p-6 lg:p-8 xl:overflow-hidden xl:flex xl:flex-col xl:flex-1 xl:min-h-0 xl:h-screen">

                        {/* ── Layout: [Calendar card] | [Atajos + Sessions col] ── */}
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 xl:flex-1 xl:min-h-0">

                            {/* LEFT — Calendar card (pure calendar, no embedded sessions on xl) */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                                className="bg-stone-50 rounded-2xl border border-stone-100 xl:border-stone-200 shadow-none xl:shadow-sm w-full min-w-0 xl:w-105 xl:shrink-0 xl:flex-1 xl:min-h-0 overflow-hidden flex flex-col"
                            >
                                <MiniCalendarWidget
                                    calendarData={calendarData}
                                    calendarMonth={calendarMonth}
                                    setCalendarMonth={setCalendarMonth}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    currentTime={currentTime}
                                    loading={loading}
                                    profile={{
                                        initials,
                                        name: userName,
                                        greeting,
                                        onNavigate: () => navigate(ROUTES.PROFESSIONAL_PROFILE),
                                    }}
                                    kpis={[
                                        { value: stats?.totalPatients ?? 0,                              label: 'Pacientes', trend: monthGrowth,   trendPos: (monthGrowth ?? 0) >= 0 },
                                        { value: stats?.completedThisWeek ?? 0,                          label: 'Semana',    trend: null },
                                        { value: `$${(MOCK_REVENUE.thisMonth ?? 0).toLocaleString()}`,   label: 'Ingresos',  trend: revenueGrowth, trendPos: revenueGrowth >= 0 },
                                        { value: `$${(MOCK_REVENUE.outstanding ?? 0).toLocaleString()}`, label: 'Pendiente', trend: null },
                                    ]}
                                    quickActionsSlot={
                                        <QuickActions
                                            variant="calendar"
                                            setShowPatientForm={setShowPatientForm}
                                            setShowCalendar={setShowCalendar}
                                        />
                                    }
                                    availabilityDays={availabilityDays}
                                    onEmptyDayClick={(date) => {
                                        setQuickForm({ patientName: '', time: '09:00', duration: '60', isVideoCall: false })
                                        setQuickCreate({ date })
                                    }}
                                    mobileSessionsLabel={selectedDateLabel}
                                    sessionsSlot={
                                        <SessionsCalendarPanel
                                            sessionsOnly
                                            bare
                                            selectedDateLabel={selectedDateLabel}
                                            selectedDateSessions={selectedDateSessions}
                                            isViewingToday={isViewingToday}
                                            nextUpcomingSession={nextUpcomingSession}
                                            calendarData={calendarData}
                                            calendarMonth={calendarMonth}
                                            setCalendarMonth={setCalendarMonth}
                                            selectedDate={selectedDate}
                                            setSelectedDate={setSelectedDate}
                                            currentTime={currentTime}
                                            calendarView={calendarView}
                                            setCalendarView={setCalendarView}
                                            loading={loading}
                                            handleJoinVideo={handleJoinVideo}
                                            setDiaryPatient={setDiaryPatient}
                                            setShowCalendar={setShowCalendar}
                                            totalPatients={stats?.totalPatients}
                                        />
                                    }
                                />
                            </motion.div>

                            {/* RIGHT col — Stats (top) + Sessions (fills rest) — desktop only */}
                            <div className="hidden xl:flex flex-col gap-4 flex-1 min-w-0 xl:min-h-0">

                                {/* Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 }}
                                    className="bg-stone-50 rounded-2xl border border-stone-200 px-5 py-3 shadow-sm shrink-0 flex items-center gap-0"
                                >
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className={`flex-1 animate-pulse flex flex-col gap-1.5 px-4 ${i > 0 ? 'border-l border-stone-200' : ''}`}>
                                                <div className="h-4 w-10 bg-stone-200 rounded" />
                                                <div className="h-2.5 w-14 bg-stone-100 rounded" />
                                            </div>
                                        ))
                                    ) : (
                                        [
                                            { value: stats?.totalPatients ?? 0,                              label: 'Pacientes',  trend: monthGrowth,   trendPos: (monthGrowth ?? 0) >= 0 },
                                            { value: stats?.completedThisWeek ?? 0,                          label: 'Esta semana', trend: null },
                                            { value: `$${(MOCK_REVENUE.thisMonth ?? 0).toLocaleString()}`,   label: 'Ingresos',   trend: revenueGrowth, trendPos: revenueGrowth >= 0 },
                                            { value: `$${(MOCK_REVENUE.outstanding ?? 0).toLocaleString()}`, label: 'Pendiente',  trend: null },
                                        ].map(({ value, label, trend, trendPos }, i) => (
                                            <div key={label} className={`flex-1 flex flex-col gap-0.5 px-4 ${i > 0 ? 'border-l border-stone-200' : ''}`}>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[15px] font-bold text-gray-900 leading-none">{value}</span>
                                                    {trend != null && (
                                                        trendPos
                                                            ? <TrendingUp size={12} className="text-emerald-500 mb-0.5" />
                                                            : <TrendingDown size={12} className="text-rose-400 mb-0.5" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-400 leading-none">{label}</span>
                                            </div>
                                        ))
                                    )}
                                </motion.div>

                                {/* General Notes — inline panel */}
                                <GeneralNotes variant="panel" />

                                {/* Today's sessions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.16 }}
                                    className="flex flex-col flex-1 min-h-0"
                                >
                                    <SessionsCalendarPanel
                                        sessionsOnly
                                        selectedDateLabel={selectedDateLabel}
                                        selectedDateSessions={selectedDateSessions}
                                        isViewingToday={isViewingToday}
                                        nextUpcomingSession={nextUpcomingSession}
                                        calendarData={calendarData}
                                        calendarMonth={calendarMonth}
                                        setCalendarMonth={setCalendarMonth}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        currentTime={currentTime}
                                        calendarView={calendarView}
                                        setCalendarView={setCalendarView}
                                        loading={loading}
                                        handleJoinVideo={handleJoinVideo}
                                        setDiaryPatient={setDiaryPatient}
                                        setShowCalendar={setShowCalendar}
                                        totalPatients={stats?.totalPatients}
                                    />
                                </motion.div>

                            </div>

                        </div>{/* end flex row */}

                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showPatientForm && (
                    <NewPatientLinkModal
                        onClose={() => setShowPatientForm(false)}
                        professionalName={user?.nombre || user?.firstName || user?.name || ''}
                    />
                )}
            </AnimatePresence>

            {/* Quick-create appointment popover */}
            <AnimatePresence>
                {quickCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setQuickCreate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 8 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-sm p-5"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-400 leading-none">
                                        {quickCreate.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">Nueva cita</p>
                                </div>
                                <button
                                    onClick={() => setQuickCreate(null)}
                                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Paciente</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del paciente"
                                        value={quickForm.patientName}
                                        onChange={e => setQuickForm(f => ({ ...f, patientName: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hora</label>
                                        <input
                                            type="time"
                                            value={quickForm.time}
                                            onChange={e => setQuickForm(f => ({ ...f, time: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Duración</label>
                                        <select
                                            value={quickForm.duration}
                                            onChange={e => setQuickForm(f => ({ ...f, duration: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                        >
                                            <option value="30">30 min</option>
                                            <option value="45">45 min</option>
                                            <option value="60">1 hora</option>
                                            <option value="90">1.5 h</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer py-1">
                                    <input
                                        type="checkbox"
                                        checked={quickForm.isVideoCall}
                                        onChange={e => setQuickForm(f => ({ ...f, isVideoCall: e.target.checked }))}
                                        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-400"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Videollamada</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setQuickCreate(null)}
                                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!quickForm.patientName.trim()}
                                    onClick={async () => {
                                        try {
                                            const [h, m]  = quickForm.time.split(':').map(Number)
                                            const start   = new Date(quickCreate.date)
                                            start.setHours(h, m, 0, 0)
                                            await appointmentsService.create({
                                                patientName: quickForm.patientName.trim(),
                                                date:        start.toISOString().slice(0, 10),
                                                time:        quickForm.time,
                                                duration:    Number(quickForm.duration),
                                                isVideoCall: quickForm.isVideoCall,
                                                type:        'therapy',
                                                status:      'reserved',
                                            })
                                            // Refresh calendar data for this month
                                            setCalendarMonth(prev => ({ ...prev }))
                                        } catch { /* ignore */ }
                                        setQuickCreate(null)
                                    }}
                                    className="flex-1 px-3 py-2 text-sm bg-sky-600 hover:bg-sky-600 disabled:opacity-40 text-white rounded-lg transition-colors font-semibold"
                                >
                                    Crear cita
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* General Notes FAB — visible on mobile / below xl */}
            <div className="xl:hidden">
                <GeneralNotes variant="fab" />
            </div>

            <style>{`
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-20deg); }
                }
                .animate-wave {
                    display: inline-block;
                    animation: wave 2s ease-in-out infinite;
                }
            `}</style>
        </>
    )
}

export default ModernProfessionalDashboard
