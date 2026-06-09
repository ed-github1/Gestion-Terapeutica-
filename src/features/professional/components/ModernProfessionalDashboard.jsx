import { useState, useEffect, useCallback, useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import NewPatientLinkModal from './NewPatientLinkModal'
import { useDashboardData, useCurrentTime } from '../hooks/useDashboard'
import { videoCallService } from '@shared/services/videoCallService'
import { appointmentsService } from '@shared/services/appointmentsService'
import { patientsService } from '@shared/services/patientsService'
import { professionalsService } from '@shared/services/professionalsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { showToast } from '@shared/ui/Toast'
import { ROUTES } from '@shared/constants/routes'
import {
    SessionsCalendarPanel,
    QuickActions,
    MiniCalendarWidget,
    MobileProfessionalDashboard,
} from './dashboard'
import QuickCreateModal from './QuickCreateModal'
import {
    useCalendarMonth,
    useAvailability,
    useTodaySessions,
    useDashboardSessions,
    buildKpis,
} from '../hooks'

// ── Week strip helper ─────────────────────────────────────────────────────────
const getWeekDays = (date) => {
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d
    })
}


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
    const [mobileWeekOffset, setMobileWeekOffset] = useState(0)

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

    // Mobile week strip data
    const mobileWeekAnchor = useMemo(() => {
        const d = new Date(currentTime)
        d.setDate(d.getDate() + mobileWeekOffset * 7)
        return d
    }, [currentTime, mobileWeekOffset])
    const weekDays = getWeekDays(mobileWeekAnchor)
    const todayDate = currentTime.getDate()
    const todayMonth = currentTime.getMonth()
    const todayYear = currentTime.getFullYear()
    const fmtDateHeader = currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

    // Session presence map for mobile week strip dots (accurate across month boundaries)
    const weekSessionMap = useMemo(() => {
        const s = new Set()
            ; (appointments || []).forEach(apt => {
                const d = new Date(apt.fechaHora)
                s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
            })
        return s
    }, [appointments])

    // Upcoming appointments (next 5 sorted by date)
    const upcomingApts = [...(upcomingSessions || [])].slice(0, 5)

    // Revenue data - fetched from appointments with paymentStatus === 'paid'
    const revenueThisMonth = stats?.revenueThisMonth ?? 0
    const revenueGoal = 6200 // Can be dynamic from settings
    const revenuePct = revenueGoal > 0 ? Math.min(Math.round((revenueThisMonth / revenueGoal) * 100), 100) : 0
    const outstandingAmount = stats?.outstandingAmount ?? 0

    // KPIs (shared between mobile calendar widget and desktop stats bar)
    const kpis = buildKpis(stats, 'Semana')
    const kpisDesktop = buildKpis(stats, 'Esta semana')

    // Handler for joining video call
    const handleJoinVideo = useCallback(async (appointment) => {
        const aptId = appointment._id || appointment.id
        const professionalName = user?.name || user?.nombre || 'Professional'
        const patientName = appointment.nombrePaciente || appointment.patientName || appointment.patient?.name || 'Paciente'

        // Resolve patientId — if missing from the normalized appointment, fetch it from the backend
        let targetUserId = appointment.patientUserId || appointment.patientId
        if (!targetUserId) {
            try {
                const res = await appointmentsService.getById(aptId)
                const fullApt = res.data?.data ?? res.data?.appointment ?? res.data ?? res
                const rawPid =
                    fullApt.patientUserId || fullApt.patientUser ||
                    fullApt.patientId || fullApt.patient ||
                    fullApt.userId || fullApt.user ||
                    fullApt.paciente || fullApt.pacienteId || null
                if (typeof rawPid === 'object' && rawPid !== null) {
                    targetUserId = rawPid.userId || rawPid.user || rawPid._id || rawPid.id || null
                } else {
                    targetUserId = rawPid || null
                }
            } catch (err) {
                console.warn('[handleJoinVideo] Could not fetch appointment details:', err.message)
            }
        }

        // Notify patient (REST + socket) — only if we have a target user ID
        if (targetUserId) {
            try {
                await videoCallService.sendVideoInvitation(
                    aptId, targetUserId, patientName, professionalName,
                )
            } catch (err) {
                console.warn('Could not notify patient via REST:', err.message)
            }

            // Also send via socket for real-time delivery
            const proUserId = user?._id || user?.id
            socketNotificationService.connect(proUserId)
            socketNotificationService.sendCallInvitation(targetUserId, {
                appointmentId: aptId,
                professionalName,
                patientName,
                appointmentType: appointment.type || appointment.appointmentType || 'consultation',
                appointmentTime: appointment.start ? new Date(appointment.start).toLocaleString('es-ES') : '',
            })
        } else {
            console.warn('[handleJoinVideo] No patientId available — skipping notification. Patient must join via link.')
        }

        navigate(`/professional/video/${aptId}`)
    }, [navigate, user])

    // Backend state machine: reserved/scheduled/rescheduled cannot jump directly
    // to completed — they must go through confirmed first.
    const handleMarkComplete = useCallback(async (appointment) => {
        const id = appointment._id || appointment.id
        if (!id) return
        try {
            const currentStatus = appointment.estado || appointment.status || ''
            const needsConfirm = ['reserved', 'scheduled', 'rescheduled'].includes(currentStatus)
            if (needsConfirm) {
                await appointmentsService.updateStatus(id, 'confirmed')
            }
            await appointmentsService.updateStatus(id, 'completed')
            showToast('Sesión marcada como completada', 'success')
            refreshData()
        } catch (err) {
            console.error('Mark complete error:', err)
            showToast('No se pudo completar la sesión', 'error')
        }
    }, [refreshData])

    const handleRequestPayment = useCallback((appointment) => {
        const patientName = appointment.nombrePaciente || appointment.patient?.name || 'el paciente'
        showToast(`Solicitud de pago enviada a ${patientName}`, 'info')
    }, [])

    // Resolve the full patient record when opening clinical file from a session card.
    // Steps: ID match → name match → API fetch → minimal fallback from appointment.
    const handleViewDiaryFromSession = useCallback(async (apt) => {
        const rawPid = apt?.patientId
        const id = (rawPid && typeof rawPid === 'object')
            ? (rawPid._id || rawPid.id)
            : (rawPid || apt?.patient?._id || apt?.patient?.id || null)

        // 1. ID match in local patients list
        let match = id ? patients.find(p => String(p._id || p.id) === String(id)) : null

        // 2. Name match fallback
        if (!match) {
            const aptName = (apt?.nombrePaciente || apt?.patientName || '').toLowerCase().trim()
            if (aptName) {
                match = patients.find(p =>
                    `${p.firstName || p.nombre || ''} ${p.lastName || p.apellido || ''}`.toLowerCase().trim() === aptName
                )
            }
        }

        // 3. API fetch if still no match
        if (!match && id) {
            try {
                const res = await patientsService.getById(id)
                const profile = res.data?.data ?? res.data
                if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
                    match = profile
                }
            } catch { /* endpoint may not be available */ }
        }

        // 4. Use match or build minimal object from appointment
        if (match) {
            setDiaryPatient(match)
        } else {
            const name = apt?.nombrePaciente || apt?.patientName || ''
            const parts = name.trim().split(' ')
            setDiaryPatient({
                _id: id, id,
                firstName: parts[0] || 'Paciente', lastName: parts.slice(1).join(' ') || '',
                nombre: parts[0] || 'Paciente', apellido: parts.slice(1).join(' ') || '',
                name, status: 'active',
            })
        }
    }, [patients, setDiaryPatient])

    const [kyc, setKyc] = useState({ status: null, url: null, loaded: false })

    useEffect(() => {
        professionalsService.getKycUrl()
            .then(res => {
                const raw = res.data?.data ?? res.data ?? {}
                setKyc({
                    status: raw.kycStatus ?? null,
                    url: raw.kycSessionUrl ?? raw.url ?? null,
                    loaded: true,
                })
            })
            .catch(() => setKyc(prev => ({ ...prev, loaded: true })))
    }, [])

    const showKycBanner = kyc.loaded && kyc.status !== 'approved'

    return (
        <>
            {/* ── KYC banner ── */}
            {showKycBanner && (
                <div className="fixed top-16 md:top-0 left-0 right-0 z-100 bg-amber-500 px-4 py-2.5 flex items-center gap-3">
                    <TriangleAlert className="w-4 h-4 shrink-0 text-white" strokeWidth={2.5} />
                    <p className="flex-1 text-sm font-medium text-white leading-snug">
                        Tu cuenta está pendiente de verificación. No puedes gestionar citas ni pacientes hasta completarla.
                    </p>
                    {kyc.url && (
                        <a
                            href={kyc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-3 py-1 rounded-lg bg-white text-amber-700 text-xs font-semibold hover:bg-amber-50 transition-colors"
                        >
                            Verificar ahora
                        </a>
                    )}
                </div>
            )}

            <div className="bg-transparent dark:bg-gray-950 xl:h-full xl:flex xl:flex-col">
                <div className="xl:h-full xl:flex xl:flex-col">
                    {/* ── MOBILE (< md) ── */}
                    <MobileProfessionalDashboard
                        userName={userName}
                        initials={initials}
                        fmtDateHeader={fmtDateHeader}
                        onNavigateProfile={() => navigate(ROUTES.PROFESSIONAL_PROFILE)}
                        weekDays={weekDays}
                        todayDate={currentTime.getDate()}
                        todayMonth={currentTime.getMonth()}
                        todayYear={currentTime.getFullYear()}
                        calendarData={calendarData}
                        weekSessionMap={weekSessionMap}
                        mobileWeekOffset={mobileWeekOffset}
                        onPrevWeek={() => setMobileWeekOffset(o => o - 1)}
                        onNextWeek={() => setMobileWeekOffset(o => o + 1)}
                        onResetWeek={() => setMobileWeekOffset(0)}
                        onSelectDate={setSelectedDate}
                        selectedDate={selectedDate}
                        selectedDateSessions={selectedDateSessions}
                        isViewingToday={isViewingToday}
                        selectedDateLabel={selectedDateLabel}
                        revenueThisMonth={revenueThisMonth}
                        revenueGoal={revenueGoal}
                        revenuePct={revenuePct}
                        outstandingAmount={outstandingAmount}
                        stats={stats}
                        loading={loading}
                        upcomingApts={upcomingApts}
                        nextUpcomingSession={nextUpcomingSession}
                        onJoinVideo={handleJoinVideo}
                        onViewDiary={handleViewDiaryFromSession}
                        onMarkComplete={handleMarkComplete}
                        todayAppointments={todayAppointments}
                        onShowCalendar={() => setShowCalendar(true)}
                        onNewPatient={() => setShowPatientForm(true)}
                        onNavigateAgenda={() => navigate('/dashboard/professional/appointments')}
                    />

                    {/* ═══════════════════════════════════════════════════════════════════
                        md + DESKTOP
                    ═══════════════════════════════════════════════════════════════════ */}
                    <div className="hidden md:block p-2 md:p-3 lg:p-4 xl:overflow-hidden xl:flex xl:flex-col xl:flex-1 xl:min-h-0 xl:h-screen">
                        {/* ── Layout: [Calendar card] | [Sessions col] ── */}
                        <div className="flex flex-col md:flex-row gap-2 md:gap-3 xl:gap-4 xl:flex-1 xl:min-h-0">
                            {/* LEFT — Calendar card (pure calendar, no embedded sessions on xl) */}
                            <motion.div
                                initial={{ opacity: 0, x: -32 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm w-full min-w-0 xl:w-105 xl:shrink-0 xl:flex-1 xl:min-h-0 overflow-hidden flex flex-col gap-2"
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
                                        isPro: ['PRO', 'EMPRESA'].includes((user?.subscriptionPlan || user?.plan || user?.planType || '').toUpperCase()),
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
                                            setDiaryPatient={handleViewDiaryFromSession}
                                            setShowCalendar={setShowCalendar}
                                            handleMarkComplete={handleMarkComplete}
                                            handleRequestPayment={handleRequestPayment}
                                            totalPatients={stats?.totalPatients}
                                        />
                                    }
                                />
                            </motion.div>

                            {/* RIGHT col — Stats (top) + Sessions (fills rest) — desktop only */}
                            <motion.div
                                initial={{ opacity: 0, x: 32 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
                                className="hidden xl:flex flex-col gap-2 flex-1 min-w-0 xl:min-h-0"
                            >



                                {/* Today's sessions */}
                                <div className="flex flex-col flex-1 min-h-0">
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
                                        setDiaryPatient={handleViewDiaryFromSession}
                                        setShowCalendar={setShowCalendar}
                                        handleMarkComplete={handleMarkComplete}
                                        handleRequestPayment={handleRequestPayment}
                                        totalPatients={stats?.totalPatients}
                                    />
                                </div>

                            </motion.div>

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

        </>
    )
}

export default ModernProfessionalDashboard
