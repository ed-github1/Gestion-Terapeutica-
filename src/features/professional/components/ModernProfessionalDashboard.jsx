import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import PatientForm from './PatientForm'
import TodaysSessions from './TodaysSessions'
import ActivityFeed from './ActivityFeed'
import { useDashboardData } from '../dashboard/useDashboard'
import {
    Clock, FileText, UserPlus, CalendarPlus, Video,
    AlertTriangle, CheckCircle, XCircle, MessageSquare,
    Users, CalendarCheck, TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
    DollarSign, BookOpen, Target, BarChart2, UserCheck,
    AlertCircle, Hash
} from 'lucide-react'
import { formatDate, formatTime, getTodayAppointments } from '../dashboard/dashboardUtils'
import { ROUTES } from '@shared/constants/routes'
import { videoCallService } from '@shared/services/videoCallService'
import { appointmentsService } from '@shared/services/appointmentsService'

/**
 * Mini sparkline SVG for outcome tracking
 */
const Sparkline = ({ scores, color = '#10b981' }) => {
    if (!scores || scores.length < 2) return null
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const range = max - min || 1
    const w = 80, h = 32, pad = 4
    const pts = scores.map((v, i) => {
        const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')
    return (
        <svg width={w} height={h} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {scores.map((v, i) => {
                const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
                const y = pad + (1 - (v - min) / range) * (h - pad * 2)
                return i === scores.length - 1 ? (
                    <circle key={i} cx={x} cy={y} r="3" fill={color} />
                ) : null
            })}
        </svg>
    )
}

const ModernProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [currentTime, setCurrentTime] = useState(new Date())
    const { stats, patients, appointments, activities, loading, error } = useDashboardData()
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [availability, setAvailability] = useState({})

    // Extract user name with fallback
    const userName = user?.name?.split(' ')[0] || user?.nombre || 'Doctor'
    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    // Mock activities data (fallback when no real data is available)
    const mockActivities = [
        {
            id: 1,
            type: 'mood_log',
            patientName: 'Sarah Mitchell',
            title: 'Registro de ánimo',
            description: 'Registro de ánimo enviado — nivel de ansiedad disminuyó',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            priority: 'normal'
        },
        {
            id: 2,
            type: 'homework_complete',
            patientName: 'Mike Johnson',
            title: 'Tarea completada',
            description: 'Mike Johnson completó los ejercicios de respiración asignados',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            priority: 'normal'
        },
        {
            id: 3,
            type: 'appointment_cancelled',
            patientName: 'Emma Davis',
            title: 'Cita cancelada',
            description: 'Emma Davis canceló la cita de mañana',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            priority: 'high'
        },
        {
            id: 4,
            type: 'outcome_improvement',
            patientName: 'Carlos Rivera',
            title: 'Nuevo paciente registrado',
            description: 'Carlos Rivera se registró como nuevo paciente',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            priority: 'normal'
        }
    ]

    // Mock messages for sidebar
    const mockMessages = [
        { id: 1, name: 'Jemma Linda', initials: 'JL', preview: '¿Podemos cambiar la cita del jueves?', time: '9:14', unread: true },
        { id: 2, name: 'Pedro Martínez', initials: 'PM', preview: 'Tuve una semana muy difícil...', time: '8:02', unread: true },
        { id: 3, name: 'Maria González', initials: 'MG', preview: 'Gracias por la sesión de hoy 🙏', time: 'Ayer', unread: false },
        { id: 4, name: 'Carlos Rivera', initials: 'CR', preview: 'Completé los ejercicios de respiración', time: 'Ayer', unread: false },
    ]

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

    const dashboardActivities = activities && activities.length > 0 ? activities : mockActivities
    const monthGrowth = Math.round((stats.totalPatients / Math.max(stats.totalPatients - 10, 1)) * 100) - 100

    // Build pending actions list from real + mock data
    const pendingActions = useMemo(() => {
        const actions = []

        // High-risk patients from today's schedule
        todayAppointments.filter(a => a.riskLevel === 'high').forEach(apt => {
            actions.push({
                id: `crisis-${apt.id}`,
                type: 'crisis',
                title: `Paciente de alto riesgo: ${apt.nombrePaciente || apt.patient?.name}`,
                subtitle: 'Requiere seguimiento — revisar plan de seguridad',
                cta: 'Ver'
            })
        })

        // Pending notes (sessions completed without notes)
        if (stats.pendingNotes > 0) {
            actions.push({
                id: 'pending-notes',
                type: 'pending_note',
                title: `${stats.pendingNotes} sesión${stats.pendingNotes > 1 ? 'es' : ''} sin nota clínica`,
                subtitle: 'Documentar antes del final del día',
                cta: 'Completar'
            })
        }

        // Pending appointment requests
        if (stats.pendingTasks > 0) {
            actions.push({
                id: 'appointment-requests',
                type: 'appointment_request',
                title: `${stats.pendingTasks} solicitud${stats.pendingTasks > 1 ? 'es' : ''} de cita pendiente`,
                subtitle: 'Pacientes esperando confirmación',
                cta: 'Revisar'
            })
        }

        // No-shows
        if (stats.noShowCount > 0) {
            actions.push({
                id: 'no-shows',
                type: 'no_show',
                title: `${stats.noShowCount} paciente${stats.noShowCount > 1 ? 's' : ''} no se presentó`,
                subtitle: 'Considera contactar para reagendar',
                cta: 'Gestionar'
            })
        }

        return actions
    }, [todayAppointments, stats.pendingNotes, stats.pendingTasks, stats.noShowCount])

    // --- Feature data ---
    // 1. Revenue snapshot (mock — replace with real billing service)
    const mockRevenue = { thisMonth: 4800, lastMonth: 4200, outstanding: 650, pendingClaims: 3 }
    const revenueGrowth = Math.round(((mockRevenue.thisMonth - mockRevenue.lastMonth) / mockRevenue.lastMonth) * 100)

    // 2. Outcome tracking — PHQ-9 scores per patient (mock)
    const mockOutcomes = [
        { initials: 'JL', name: 'Jemma Linda', scores: [14, 12, 10, 8, 7], trend: 'improving' },
        { initials: 'PM', name: 'Pedro Martínez', scores: [18, 19, 17, 20, 22], trend: 'concerning' },
        { initials: 'AJ', name: 'Andy John', scores: [12, 11, 10, 9, 8], trend: 'improving' },
        { initials: 'MG', name: 'Maria González', scores: [10, 9, 8, 6, 5], trend: 'improving' },
        { initials: 'CR', name: 'Carlos Rivera', scores: [15, 14, 14, 13, 12], trend: 'stable' },
    ]

    // 3. Waitlist count (mock)
    const waitlistCount = 4

    // 4. Homework completion rate from today's schedule
    const homeworkRate = todayAppointments.length > 0
        ? Math.round((todayAppointments.filter(a => a.homeworkCompleted).length / todayAppointments.length) * 100)
        : 68

    // 6. Cancellation / no-show rate this month
    const noShowRateVal = stats.weekAppointments > 0
        ? Math.round((stats.noShowCount / stats.weekAppointments) * 100)
        : 12
    const prevNoShowRate = 18

    // 5. Next upcoming session (for prep card)
    // Priority: (1) an ongoing or future slot from today, (2) the nearest future appointment overall,
    // (3) a mock fallback so the card is always visible during development.
    const nextUpcomingSession = (() => {
        const now = new Date()
        // From today's schedule — include sessions that have started within the last 60 min
        // (still in progress) so the join button stays visible for the full session duration.
        const fromToday = todayAppointments.find(a => {
            const t = new Date(a.fechaHora)
            const minsAgo = (now - t) / 60000
            return t > now || (minsAgo >= 0 && minsAgo < 60)
        })
        if (fromToday) return fromToday
        // From the full appointments list (could be tomorrow or later)
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
        // Mock fallback — use mock-next from today's mock sessions so it matches the timeline
        const mockNext = mockTodaySessions.find(s => s.id === 'mock-next')
        if (mockNext) return mockNext
        return null
    })()

    // 7. CPD / Supervision hours (mock — replace with real CPD service)
    const mockCPD = { completed: 18, required: 30, deadline: 'Jun 2026', supervised: 6, supervisedRequired: 10 }

    // Handler for joining video call - memoized to prevent excessive re-renders
    const handleJoinVideo = useCallback(async (appointment) => {
        try {
            const professionalName = user?.name || user?.nombre || 'Professional'
            const patientName = appointment.patientName || appointment.patient?.name || 'Paciente'
            // Notify patient about video call
            await videoCallService.sendVideoInvitation(
                appointment.id,
                appointment.patientId,
                patientName,
                professionalName
            )
            // Navigate to video call page
            navigate(`/professional/video/${appointment.id}`)
        } catch (error) {
            // Still navigate even if notification fails
            navigate(`/professional/video/${appointment.id}`)
        }
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
            } catch (error) {
                // Try localStorage fallback
                const local = localStorage.getItem('professionalAvailability')
                if (local) {
                    try {
                        const parsed = JSON.parse(local)
                        setAvailability(parsed)
                    } catch (e) {
                        // Silently fail
                    }
                }
            }
        }
        loadAvailability()

        // Listen for availability changes (when modal closes)
        const handleStorageChange = () => {
            loadAvailability()
        }
        window.addEventListener('storage', handleStorageChange)

        // Also listen for custom event when availability is saved
        window.addEventListener('availabilityUpdated', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('availabilityUpdated', handleStorageChange)
        }
    }, [])

    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour < 12) return 'Buenos días'
        if (hour < 18) return 'Buenas tardes'
        return 'Buenas noches'
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] min-h-screen">
                    {/* Main Content */}
                    <div className="p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 md:mb-8"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">{getGreeting()}</p>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                        Dr. {userName}
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(currentTime)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Search */}
                                    <div className="relative hidden md:block">
                                        <input
                                            type="text"
                                            placeholder="Buscar paciente..."
                                            className="w-48 lg:w-60 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 text-sm"
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-700 tabular-nums">
                                            {formatTime(currentTime)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(ROUTES.PROFESSIONAL_PROFILE)}
                                        className="hidden lg:flex w-8 h-8 rounded-full bg-gray-900 items-center justify-center text-white font-bold text-xs"
                                        title="Ver Perfil"
                                    >
                                        {initials}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex flex-wrap items-center gap-2 mb-6 md:mb-8"
                        >
                            <button
                                onClick={() => setShowPatientForm(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Nuevo paciente
                            </button>
                            <button
                                onClick={() => setShowCalendar(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                Agendar cita
                            </button>

                            {stats.pendingNotes > 0 && (
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {stats.pendingNotes} nota{stats.pendingNotes > 1 ? 's' : ''} pendiente{stats.pendingNotes > 1 ? 's' : ''}
                                </span>
                            )}
                            {waitlistCount > 0 && (
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-purple-100 transition-colors">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {waitlistCount} en lista de espera
                                </span>
                            )}
                        </motion.div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
                            {[
                                {
                                    label: 'Pacientes activos',
                                    labelShort: 'Pacientes',
                                    value: stats.totalPatients || 0,
                                    sub: 'total en carga',
                                    icon: Users,
                                    iconColor: 'text-blue-600',
                                    iconBg: 'bg-blue-50',
                                    trend: monthGrowth,
                                    delay: 0.1
                                },
                                {
                                    label: 'Sesiones hoy',
                                    labelShort: 'Hoy',
                                    value: todayAppointments.length,
                                    sub: `${todayAppointments.filter(a => new Date(a.fechaHora) > new Date()).length} restantes`,
                                    icon: CalendarCheck,
                                    iconColor: 'text-violet-600',
                                    iconBg: 'bg-violet-50',
                                    trend: null,
                                    delay: 0.15
                                },
                                {
                                    label: 'Completadas semana',
                                    labelShort: 'Semana',
                                    value: stats.completedThisWeek || 0,
                                    sub: `de ${stats.weekAppointments || 0} programadas`,
                                    icon: TrendingUp,
                                    iconColor: 'text-emerald-600',
                                    iconBg: 'bg-emerald-50',
                                    trend: stats.weekAppointments > 0
                                        ? Math.round((stats.completedThisWeek / stats.weekAppointments) * 100) - 80
                                        : null,
                                    delay: 0.2
                                },
                                {
                                    label: 'Notas pendientes',
                                    labelShort: 'Notas',
                                    value: stats.pendingNotes || 0,
                                    sub: stats.pendingNotes > 0 ? 'requiere atención' : 'al día',
                                    icon: FileText,
                                    iconColor: stats.pendingNotes > 0 ? 'text-amber-600' : 'text-gray-500',
                                    iconBg: stats.pendingNotes > 0 ? 'bg-amber-50' : 'bg-gray-50',
                                    trend: null,
                                    alert: stats.pendingNotes > 0,
                                    delay: 0.25
                                },
                                {
                                    label: 'Tareas completadas',
                                    labelShort: 'Tareas',
                                    value: `${homeworkRate}%`,
                                    sub: 'cumplimiento semana',
                                    icon: Target,
                                    iconColor: homeworkRate >= 70 ? 'text-emerald-600' : 'text-orange-500',
                                    iconBg: homeworkRate >= 70 ? 'bg-emerald-50' : 'bg-orange-50',
                                    trend: homeworkRate - 60,
                                    delay: 0.3
                                },
                                {
                                    label: 'Tasa no-show',
                                    labelShort: 'No-show',
                                    value: `${noShowRateVal}%`,
                                    sub: `era ${prevNoShowRate}% anterior`,
                                    icon: BarChart2,
                                    iconColor: noShowRateVal < prevNoShowRate ? 'text-emerald-600' : 'text-rose-500',
                                    iconBg: noShowRateVal < prevNoShowRate ? 'bg-emerald-50' : 'bg-rose-50',
                                    trend: prevNoShowRate - noShowRateVal,
                                    delay: 0.35
                                }
                            ].map((card) => (
                                <motion.div
                                    key={card.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: card.delay, duration: 0.3 }}
                                    className={`bg-white rounded-2xl p-3 sm:p-4 md:p-5 border flex flex-col gap-2 md:gap-3 hover:shadow-md transition-shadow cursor-default ${card.alert ? 'border-amber-200' : 'border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                                            <card.icon className={`w-4 h-4 ${card.iconColor}`} strokeWidth={2} />
                                        </div>
                                        {card.trend !== null && card.trend !== undefined && (
                                            <span className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold ${card.trend > 0 ? 'text-emerald-600' : card.trend < 0 ? 'text-rose-500' : 'text-gray-400'
                                                }`}>
                                                {card.trend > 0
                                                    ? <ArrowUpRight className="w-3 h-3" />
                                                    : card.trend < 0
                                                        ? <ArrowDownRight className="w-3 h-3" />
                                                        : <Minus className="w-3 h-3" />
                                                }
                                                {Math.abs(card.trend)}%
                                            </span>
                                        )}
                                        {card.alert && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1">
                                            {card.value}
                                        </p>
                                        <p className="text-[11px] sm:text-[12px] md:text-[13px] font-medium text-gray-900 leading-tight">
                                            <span className="sm:hidden">{card.labelShort}</span>
                                            <span className="hidden sm:inline">{card.label}</span>
                                        </p>
                                        <p className="hidden sm:block text-xs text-gray-400 mt-0.5 leading-tight">{card.sub}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {/* Today's Sessions & Recent Activity */}
                        {(() => {
                            const _nextTime      = nextUpcomingSession ? new Date(nextUpcomingSession.fechaHora) : null
                            const _minsUntil     = _nextTime ? Math.round((_nextTime - Date.now()) / 60000) : null
                            const _nextIsNow      = _minsUntil !== null && _minsUntil <= 0
                            const _nextIsImminent = _minsUntil !== null && _minsUntil >= 0 && _minsUntil <= 15
                            const _nextCountdown  = _nextIsNow      ? 'Ahora'
                                                  : _minsUntil !== null && _minsUntil < 60   ? `${_minsUntil} min`
                                                  : _minsUntil !== null && _minsUntil < 1440 ? `${Math.floor(_minsUntil / 60)}h ${_minsUntil % 60}m`
                                                  : _nextTime ? formatTime(_nextTime) : null
                            // Use timestamp (ms) for matching — avoids _id vs id type mismatches
                            const _nextTimestamp  = _nextTime ? _nextTime.getTime() : null
                            return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                            {/* Today's Sessions */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.28 }}
                                className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-[15px] font-semibold text-gray-900">Sesiones de hoy</h2>
                                    <div className="flex items-center gap-2">
                                        {_nextCountdown && (
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                                _nextIsNow || _nextIsImminent
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    _nextIsNow || _nextIsImminent ? 'bg-emerald-500' : 'bg-indigo-400'
                                                }`} />
                                                Próxima: {_nextCountdown}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">{todayAppointments.length} citas</span>
                                    </div>
                                </div>
                                <TodaysSessions
                                    sessions={allDaySlots}
                                    loading={loading}
                                    onJoinVideo={handleJoinVideo}
                                    onViewDiary={setDiaryPatient}
                                    nextSessionTime={_nextTimestamp}
                                    nextSessionCountdown={_nextCountdown}
                                    nextIsImminent={_nextIsImminent || _nextIsNow}
                                />
                            </motion.div>

                            {/* Recent Activity */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.33 }}
                                className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-[15px] font-semibold text-gray-900">Actividad reciente</h2>
                                        {!loading && dashboardActivities.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                                                {dashboardActivities.length}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">Últimos 30 días</span>
                                </div>
                                <ActivityFeed
                                    activities={dashboardActivities}
                                    loading={loading}
                                />
                            </motion.div>
                        </div>
                            )
                        })()}

                        {/* Feature 2: Outcome Tracking (PHQ-9 trends) */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38 }}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6"
                        >
                            <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                                    <h2 className="text-[15px] font-semibold text-gray-900">Seguimiento PHQ-9</h2>
                                </div>
                                <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">Ver todos</button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {mockOutcomes.map((p) => (
                                    <div key={p.initials} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                            {p.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-400">Último: <span className="font-semibold text-gray-600">{p.scores[p.scores.length - 1]}</span> / 27</p>
                                        </div>
                                        <div className="hidden sm:block shrink-0">
                                            <Sparkline
                                                scores={p.scores}
                                                color={p.trend === 'improving' ? '#10b981' : p.trend === 'concerning' ? '#f43f5e' : '#94a3b8'}
                                            />
                                        </div>
                                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${p.trend === 'improving' ? 'bg-emerald-50 text-emerald-600' :
                                                p.trend === 'concerning' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-gray-100 text-gray-500'
                                            }`}>
                                            {p.trend === 'improving' ? 'Mejorando' : p.trend === 'concerning' ? 'Alerta' : 'Estable'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Pending Actions Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[15px] font-semibold text-gray-900">Acciones pendientes</h2>
                                    {pendingActions.length > 0 && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                                            {pendingActions.length}
                                        </span>
                                    )}
                                </div>
                                <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">Ver todo</button>
                            </div>

                            {pendingActions.length === 0 ? (
                                <div className="flex items-center gap-2.5 px-5 py-6 text-gray-400">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-sm text-gray-500">Todo al día — sin acciones pendientes</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {pendingActions.map((action, idx) => (
                                        <div
                                            key={action.id || idx}
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.type === 'crisis' ? 'bg-rose-50' :
                                                    action.type === 'pending_note' ? 'bg-amber-50' :
                                                        action.type === 'appointment_request' ? 'bg-blue-50' :
                                                            'bg-gray-100'
                                                }`}>
                                                {action.type === 'crisis' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                                                {action.type === 'pending_note' && <FileText className="w-3.5 h-3.5 text-amber-600" />}
                                                {action.type === 'appointment_request' && <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />}
                                                {action.type === 'no_show' && <XCircle className="w-3.5 h-3.5 text-gray-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{action.title}</p>
                                                <p className="text-xs text-gray-400 truncate">{action.subtitle}</p>
                                            </div>
                                            <button className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${action.type === 'crisis'
                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}>
                                                {action.cta}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* ── Sidebar widgets – visible only below xl ── */}
                        <div className="xl:hidden mt-6 space-y-4">

                            {/* Revenue */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        Ingresos del Mes
                                    </h4>
                                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${revenueGrowth > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(revenueGrowth)}%
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">${mockRevenue.thisMonth.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mt-0.5 mb-3">vs ${mockRevenue.lastMonth.toLocaleString()} el mes pasado</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-amber-50 rounded-xl p-3">
                                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Pendiente cobro</p>
                                        <p className="text-lg font-bold text-amber-700 mt-0.5">${mockRevenue.outstanding}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-3">
                                        <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Reclamos activos</p>
                                        <p className="text-lg font-bold text-blue-700 mt-0.5">{mockRevenue.pendingClaims}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Progreso semanal + CPD – side by side on sm+ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Weekly progress */}
                                <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-4">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Progreso Semanal
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-medium text-gray-700">Sesiones Completadas</span>
                                                <span className="font-bold text-emerald-600">{stats.completedThisWeek || 0}/12</span>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${((stats.completedThisWeek || 0) / 12) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-medium text-gray-700">Metas de Tratamiento</span>
                                                <span className="font-bold text-blue-600">8/10</span>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '80%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CPD */}
                                <div className="bg-linear-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-4">
                                        <BookOpen className="w-4 h-4 text-violet-600" />
                                        Horas CPD
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-medium text-gray-700">Formación</span>
                                                <span className="font-bold text-violet-600">{mockCPD.completed}/{mockCPD.required} h</span>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full bg-linear-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${Math.min((mockCPD.completed / mockCPD.required) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-medium text-gray-700">Supervisión</span>
                                                <span className="font-bold text-indigo-600">{mockCPD.supervised}/{mockCPD.supervisedRequired} h</span>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${Math.min((mockCPD.supervised / mockCPD.supervisedRequired) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400">Renovación: <span className="font-semibold text-gray-600">{mockCPD.deadline}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        Mensajes
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {stats.unreadMessages > 0 && (
                                            <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {stats.unreadMessages}
                                            </span>
                                        )}
                                        <button className="text-xs text-blue-600 font-semibold">Ver Todo</button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {mockMessages.map((msg) => (
                                        <div key={msg.id} className="flex items-start gap-3 px-5 py-3.5">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.unread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {msg.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className={`text-sm truncate ${msg.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{msg.name}</p>
                                                    {msg.unread && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{msg.preview}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 shrink-0">{msg.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Notes + Crisis – side by side on sm+ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Quick Notes */}
                                <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-3">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Notas Rápidas
                                    </h4>
                                    <textarea
                                        placeholder="Anota observaciones de la sesión..."
                                        className="w-full h-28 p-3 bg-white rounded-xl border border-indigo-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button className="w-full mt-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                                        Guardar Nota
                                    </button>
                                </div>

                                {/* Crisis Resources */}
                                <div className="bg-linear-to-br from-rose-50 to-red-50 rounded-2xl p-5 border border-rose-200">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-3">
                                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Recursos de Crisis
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                            <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">Línea de Crisis</p>
                                                <p className="text-sm font-bold text-rose-600">988</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">Apoyo por Texto</p>
                                                <p className="text-xs text-gray-600">Envía CASA al 741741</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Self-Care */}
                            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">Toma un Descanso</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed">Has tenido 3 sesiones hoy. Considera un breve descanso de atención plena antes de tu próxima cita.</p>
                                        <button className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
                                            Iniciar ejercicio de respiración 5-min →
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* ── end sidebar widgets ── */}

                    </div>

                    {/* Barra Lateral Derecha - Herramientas Clínicas */}
                    <div className="hidden xl:block bg-white border-l border-gray-100 p-6 space-y-6 overflow-y-auto">

                        {/* Feature 1: Revenue Snapshot */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    Ingresos del Mes
                                </h4>
                                <span className={`flex items-center gap-0.5 text-xs font-semibold ${revenueGrowth > 0 ? 'text-emerald-600' : 'text-rose-500'
                                    }`}>
                                    {revenueGrowth > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {Math.abs(revenueGrowth)}%
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">${mockRevenue.thisMonth.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-0.5 mb-4">vs ${mockRevenue.lastMonth.toLocaleString()} el mes pasado</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-amber-50 rounded-xl p-3">
                                    <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Pendiente cobro</p>
                                    <p className="text-lg font-bold text-amber-700 mt-0.5">${mockRevenue.outstanding}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Reclamos activos</p>
                                    <p className="text-lg font-bold text-blue-700 mt-0.5">{mockRevenue.pendingClaims}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Widget */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                    Mensajes
                                </h4>
                                <div className="flex items-center gap-2">
                                    {stats.unreadMessages > 0 && (
                                        <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {stats.unreadMessages}
                                        </span>
                                    )}
                                    <button className="text-xs text-blue-600 font-semibold hover:text-blue-700">Ver Todo</button>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {mockMessages.map((msg) => (
                                    <motion.button
                                        key={msg.id}
                                        whileHover={{ backgroundColor: '#f9fafb' }}
                                        className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.unread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {msg.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className={`text-sm truncate ${msg.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{msg.name}</p>
                                                {msg.unread && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0"></span>}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{msg.preview}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 shrink-0">{msg.time}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Notes Widget */}
                        <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Notas Rápidas
                                </h4>
                                <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                                    Ver Todo
                                </button>
                            </div>
                            <textarea
                                placeholder="Anota observaciones de la sesión..."
                                className="w-full h-32 p-3 bg-white rounded-xl border border-indigo-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="w-full mt-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                                Guardar Nota
                            </button>
                        </div>

                        {/* Crisis Resources */}
                        <div className="bg-linear-to-br from-rose-50 to-red-50 rounded-3xl p-6 border border-rose-200">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Recursos de Crisis
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900">Línea de Crisis</p>
                                        <p className="text-sm font-bold text-rose-600">988</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900">Apoyo por Texto</p>
                                        <p className="text-xs text-gray-600">Envía CASA al 741741</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Treatment Progress */}
                        <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Progreso Semanal
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="font-medium text-gray-700">Sesiones Completadas</span>
                                        <span className="font-bold text-emerald-600">{stats.completedThisWeek || 0}/12</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${((stats.completedThisWeek || 0) / 12) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="font-medium text-gray-700">Metas de Tratamiento</span>
                                        <span className="font-bold text-blue-600">8/10</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Self-Care Reminder */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">Toma un Descanso</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">Has tenido 3 sesiones hoy. Considera un breve descanso de atención plena antes de tu próxima cita.</p>
                                    <button className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
                                        Iniciar ejercicio de respiración 5-min →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Feature 7: CPD / Supervision Hours Tracker */}
                        <div className="bg-linear-to-br from-violet-50 to-purple-50 rounded-3xl p-6 border border-violet-100">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-violet-600" />
                                Horas de Formación CPD
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="font-medium text-gray-700">Formación continua</span>
                                        <span className="font-bold text-violet-600">{mockCPD.completed}/{mockCPD.required} h</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${Math.min((mockCPD.completed / mockCPD.required) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="font-medium text-gray-700">Supervisión clínica</span>
                                        <span className="font-bold text-indigo-600">{mockCPD.supervised}/{mockCPD.supervisedRequired} h</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full transition-all"
                                            style={{ width: `${Math.min((mockCPD.supervised / mockCPD.supervisedRequired) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">Renovación de licencia: <span className="font-semibold text-gray-600">{mockCPD.deadline}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showPatientForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPatientForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PatientForm onClose={() => setShowPatientForm(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
