import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import NewPatientLinkModal from './NewPatientLinkModal'
import { useDashboardData, useCurrentTime } from '../hooks/useDashboard'
import { videoCallService } from '@shared/services/videoCallService'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { showToast } from '@shared/ui/Toast'
import { ROUTES } from '@shared/constants/routes'
import {
    SessionsCalendarPanel,
    QuickActions,
    MiniCalendarWidget,
} from './dashboard'
import QuickCreateModal from './QuickCreateModal'
import {
    useCalendarMonth,
    useAvailability,
    useTodaySessions,
    useDashboardSessions,
    buildKpis,
} from '../hooks'

const ModernProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const currentTime = useCurrentTime()
    const { stats, patients, appointments, loading, refreshData } = useDashboardData()

    // Extracted hooks
    const availability = useAvailability()
    const { calendarMonth, setCalendarMonth, calendarMonthApts } = useCalendarMonth()
    const { todayAppointments, allDaySlots } = useTodaySessions(appointments, availability, loading)

    // Local UI state
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [quickCreate, setQuickCreate] = useState(null)
    const [quickForm, setQuickForm] = useState({ patientName: '', time: '09:00', duration: '60', mode: 'consultorio' })
    const [selectedDate, setSelectedDate] = useState(() => new Date())
    const [calendarView, setCalendarView] = useState('sessions')

    // Derived session data
    const {
        calendarData, availabilityDays, upcomingSessions,
        selectedDateSessions, isViewingToday, isShowingUpcoming,
        selectedDateLabel, nextUpcomingSession,
    } = useDashboardSessions({
        appointments, calendarMonth, calendarMonthApts,
        availability, selectedDate, currentTime,
        allDaySlots, todayAppointments,
    })

    // User identity
    const userName = user?.name?.split(' ')[0] || user?.nombre || 'Doctor'
    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const greeting = currentTime.getHours() < 12 ? 'Buenos días' : currentTime.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'

    // KPIs (shared between mobile calendar widget and desktop stats bar)
    const kpis = buildKpis(stats, 'Semana')
    const kpisDesktop = buildKpis(stats, 'Esta semana')

    // Handler for joining video call
    const handleJoinVideo = useCallback(async (appointment) => {
        const professionalName = user?.name || user?.nombre || 'Professional'
        const patientName = appointment.nombrePaciente || appointment.patientName || appointment.patient?.name || 'Paciente'

        // Resolve patientId — if missing from the normalized appointment, fetch it from the backend
        let targetUserId = appointment.patientUserId || appointment.patientId
        if (!targetUserId) {
            try {
                const res = await appointmentsService.getById(appointment.id)
                const fullApt = res.data?.data ?? res.data?.appointment ?? res.data ?? res
                const rawPid = fullApt.patientId || fullApt.patient || fullApt.userId || fullApt.user || fullApt.paciente
                if (typeof rawPid === 'object' && rawPid !== null) {
                    targetUserId = rawPid.userId || rawPid.user || rawPid._id || rawPid.id || null
                } else {
                    targetUserId = rawPid || null
                }
            } catch (err) {
                console.warn('[handleJoinVideo] Could not fetch appointment details:', err.message)
            }
        }

        // 1. Try to start the call (creates room on backend)
        try {
            await videoCallService.startCall(appointment.id)
        } catch { /* Room may already exist */ }

        // 2. Notify patient (REST + socket) — only if we have a target user ID
        if (targetUserId) {
            try {
                await videoCallService.sendVideoInvitation(
                    appointment.id, targetUserId, patientName, professionalName,
                )
            } catch (err) {
                console.warn('Could not notify patient via REST:', err.message)
            }

            // Also send via socket for real-time delivery
            const proUserId = user?._id || user?.id
            const proToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || ''
            socketNotificationService.connect(proUserId, proToken)
            socketNotificationService.sendCallInvitation(targetUserId, {
                appointmentId: appointment.id,
                professionalName,
                patientName,
                appointmentType: appointment.type || appointment.appointmentType || 'consultation',
                appointmentTime: appointment.start ? new Date(appointment.start).toLocaleString('es-ES') : '',
            })
        } else {
            console.warn('[handleJoinVideo] No patientId available — skipping notification. Patient must join via link.')
        }

        navigate(`/professional/video/${appointment.id}`)
    }, [navigate, user])

    // Handler for marking a presencial session as completed
    const handleMarkComplete = useCallback(async (appointment) => {
        const id = appointment._id || appointment.id
        if (!id) return
        try {
            await appointmentsService.updateStatus(id, 'completed')
            showToast('Sesión marcada como completada', 'success')
            refreshData()
        } catch (err) {
            console.error('Mark complete error:', err)
            showToast('No se pudo completar la sesión', 'error')
        }
    }, [refreshData])

    // Filtered patient search results removed — search bar now lives in layout header

    return (
        <>
            <div className="bg-transparent dark:bg-gray-900/50 xl:h-full xl:flex xl:flex-col">
                <div className="xl:h-full xl:flex xl:flex-col">
                    {/* Main Content */}
                    <div className="p-2 md:p-3 lg:p-4 xl:overflow-hidden xl:flex xl:flex-col xl:flex-1 xl:min-h-0 xl:h-screen">
                        {/* ── Layout: [Calendar card] | [Sessions col] ── */}
                        <div className="flex flex-col md:flex-row gap-2 md:gap-3 xl:flex-1 xl:min-h-0">

                            {/* LEFT — Calendar card (pure calendar, no embedded sessions on xl) */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-full min-w-0 xl:w-105 xl:shrink-0 xl:flex-1 xl:min-h-0 overflow-hidden flex flex-col"
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
                                        isPro: ['PRO', 'EMPRESA'].includes(user?.subscriptionPlan || user?.plan || user?.planType),
                                    }}
                                    kpis={kpis}
                                    quickActionsSlot={
                                        <QuickActions
                                            variant="calendar"
                                            setShowPatientForm={setShowPatientForm}
                                            setShowCalendar={setShowCalendar}
                                        />
                                    }
                                    availabilityDays={availabilityDays}
                                    mobileSessionsLabel={isShowingUpcoming ? 'Próximas sesiones' : 'Sesiones de hoy'}
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
                                            handleMarkComplete={handleMarkComplete}
                                            totalPatients={stats?.totalPatients}
                                        />
                                    }
                                />
                            </motion.div>

                            {/* RIGHT col — Stats (top) + Sessions (fills rest) — desktop only */}
                            <div className="hidden xl:flex flex-col gap-2 flex-1 min-w-0 xl:min-h-0">

                                {/* Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-2 py-2 shadow-sm shrink-0 grid grid-cols-4 gap-2 overflow-hidden"
                                >
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 animate-pulse flex flex-col gap-1.5">
                                                <div className="h-2.5 w-full max-w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
                                                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
                                            </div>
                                        ))
                                    ) : (
                                        kpisDesktop.map(({ value, label, trend, trendPos, Icon, iconColor }) => (
                                            <div key={label} className="min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 flex flex-col gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
                                                <div className="flex items-center justify-between gap-1 min-w-0">
                                                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                                        <Icon size={12} className={`shrink-0 ${iconColor}`} strokeWidth={2.5} />
                                                        <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase truncate">{label}</span>
                                                    </div>
                                                    {trend != null && (
                                                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${trendPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                                                            }`}>
                                                            {trendPos ? '↑' : '↓'}{Math.abs(trend)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[22px] font-black text-gray-900 dark:text-white leading-none tabular-nums tracking-tight truncate">{value}</span>
                                            </div>
                                        ))
                                    )}
                                </motion.div>

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
                                        handleMarkComplete={handleMarkComplete}
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
            <QuickCreateModal
                quickCreate={quickCreate}
                setQuickCreate={setQuickCreate}
                quickForm={quickForm}
                setQuickForm={setQuickForm}
                onCreated={() => setCalendarMonth(prev => ({ ...prev }))}
            />

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
