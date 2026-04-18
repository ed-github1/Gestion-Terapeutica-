/**
 * MobileProfessionalDashboard.jsx
 * Mobile-only (< md) layout for the professional dashboard.
 * Pure presentational component — all data/logic lives in ModernProfessionalDashboard.
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
    UserPlus, FileText, MessageSquare,
    CheckSquare, Square, ChevronRight, ChevronLeft,
    Ban, CheckCircle2, Video, Plus, CalendarDays,
    AlertCircle,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const DOW_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const SHORT_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const TODO_BADGE_COLORS = {
    patients: { bg: 'bg-sky-500/20',    text: 'text-sky-400',    label: 'CITA'     },
    admin:    { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'ADMIN'    },
    personal: { bg: 'bg-amber-500/20',  text: 'text-amber-400',  label: 'PERSONAL' },
}

const SESSION_TYPE_DOT = {
    'Primera consulta': 'bg-sky-400', Seguimiento: 'bg-emerald-400',
    Extraordinaria: 'bg-amber-400',
}

const AVATAR_PALETTES = [
    ['bg-sky-100 dark:bg-sky-900/60',     'text-sky-600 dark:text-sky-300'],
    ['bg-emerald-100 dark:bg-emerald-900/60', 'text-emerald-600 dark:text-emerald-300'],
    ['bg-violet-100 dark:bg-violet-900/60',  'text-violet-600 dark:text-violet-300'],
    ['bg-amber-100 dark:bg-amber-900/60',   'text-amber-600 dark:text-amber-300'],
    ['bg-teal-100 dark:bg-teal-900/60',    'text-teal-600 dark:text-teal-300'],
    ['bg-rose-100 dark:bg-rose-900/60',    'text-rose-600 dark:text-rose-300'],
    ['bg-blue-100 dark:bg-blue-900/60',    'text-blue-600 dark:text-blue-300'],
    ['bg-cyan-100 dark:bg-cyan-900/60',    'text-cyan-600 dark:text-cyan-300'],
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitialsFrom = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase()
}
const avatarBg = (name) => {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length]
}
const pad2 = (n) => String(n).padStart(2, '0')
const fmtTime = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const fmtRange = (apt) => {
    const s = new Date(apt.fechaHora)
    const e = new Date(s.getTime() + (apt.duration || 60) * 60_000)
    return `${fmtTime(s)} – ${fmtTime(e)}`
}

// ── HeroSessionCard — the ONE thing that owns the screen ─────────────────────
const HeroSessionCard = ({ apt, onJoinVideo, onViewDiary, onMarkComplete }) => {
    const name        = apt.nombrePaciente || apt.patientName || 'Paciente'
    const start       = new Date(apt.fechaHora)
    const end         = new Date(start.getTime() + (apt.duration || 60) * 60_000)
    const isVideoCall = apt.isVideoCall || apt.mode === 'videollamada'
    const nowMs       = Date.now()
    const isInProgress = nowMs >= start.getTime() && nowMs < end.getTime()
    const sessionType = apt.type || apt.appointmentType || 'Primera consulta'
    const typeDot     = SESSION_TYPE_DOT[sessionType] || 'bg-gray-400'
    const [avatarBgCls, avatarTextCls] = avatarBg(name)

    const minsUntil = Math.round((start.getTime() - nowMs) / 60_000)
    const countdown = isInProgress
        ? `En curso · ${Math.round((end.getTime() - nowMs) / 60_000)} min restantes`
        : minsUntil <= 60 && minsUntil > 0
            ? `En ${minsUntil} min`
            : `${fmtTime(start)}`

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`relative rounded-2xl overflow-hidden border ${isInProgress ? 'border-sky-200 dark:border-sky-900/30' : 'border-gray-200 dark:border-gray-800/60'}`}
        >
            {/* Gradient background */}
            <div className={`absolute inset-0 ${
                isInProgress
                    ? 'bg-linear-to-br from-sky-50 via-sky-50/60 to-white dark:from-sky-900/80 dark:via-sky-900/60 dark:to-gray-900'
                    : 'bg-linear-to-br from-gray-50 to-white dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-900'
            }`} />
            {isInProgress && (
                <div className="absolute inset-0 bg-sky-500/5" />
            )}

            {/* Live indicator bar */}
            {isInProgress && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-sky-500 via-sky-400 to-cyan-400" />
            )}

            <div className="relative p-4">
                {/* Status label */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        isInProgress ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500'
                    }`}>
                        {isInProgress ? '● En curso' : 'Próxima sesión'}
                    </span>
                    <span className={`text-[11px] font-semibold tabular-nums ${
                        isInProgress ? 'text-sky-600 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>{countdown}</span>
                </div>

                {/* Patient row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-full ${avatarBgCls} ${avatarTextCls} flex items-center justify-center font-bold text-sm shrink-0`}>
                        {getInitialsFrom(name)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums">{fmtRange(apt)}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${typeDot}`} />
                                {sessionType}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDiary?.(apt)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[12px] font-semibold text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Expediente
                    </button>
                    {isVideoCall ? (
                        <button
                            onClick={() => onJoinVideo?.(apt)}
                            className={`flex-2 flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl text-[12px] font-bold active:scale-95 transition-all ${
                                isInProgress
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                                    : 'bg-sky-500/20 border border-sky-500/40 text-sky-500 dark:text-sky-300'
                            }`}
                        >
                            <Video className="w-3.5 h-3.5" />
                            {isInProgress ? 'Unirse ahora' : 'Unirse'}
                        </button>
                    ) : (
                        <button
                            onClick={() => onMarkComplete?.(apt)}
                            className="flex-2 flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[12px] font-bold text-emerald-400 active:scale-95 transition-all"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completar
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ── SessionRow — lightweight list row for non-hero sessions ──────────────────
const SessionRow = ({ apt, index, onJoinVideo, onViewDiary, onMarkComplete }) => {
    const name        = apt.nombrePaciente || apt.patientName || 'Paciente'
    const start       = new Date(apt.fechaHora)
    const isVideoCall = apt.isVideoCall || apt.mode === 'videollamada'
    const rawStatus   = apt.estado || apt.status || ''
    const isCompleted = rawStatus === 'completed' || rawStatus === 'completada'
    const isCancelled = rawStatus === 'cancelled' || rawStatus === 'cancelada' || apt.isCancelled === true
    const sessionType = apt.type || apt.appointmentType || 'Primera consulta'
    const typeDot     = SESSION_TYPE_DOT[sessionType] || 'bg-gray-500'
    const [avatarBgCls, avatarTextCls] = avatarBg(name)

    return (
        <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 + index * 0.04, duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3 ${
                index > 0 ? 'border-t border-gray-100 dark:border-gray-700/50' : ''
            }`}
        >
            {/* Time */}
            <span className={`text-[12px] font-bold tabular-nums w-11 shrink-0 ${
                isCancelled || isCompleted ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'
            }`}>
                {fmtTime(start)}
            </span>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full ${
                isCancelled ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' :
                isCompleted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' :
                `${avatarBgCls} ${avatarTextCls}`
            } flex items-center justify-center font-bold text-[11px] shrink-0`}>
                {getInitialsFrom(name)}
            </div>

            {/* Name + type */}
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold leading-none truncate ${
                    isCancelled ? 'line-through text-gray-400 dark:text-gray-600' :
                    isCompleted ? 'text-gray-400 dark:text-gray-500' :
                    'text-gray-800 dark:text-gray-200'
                }`}>{name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {!isCancelled && !isCompleted && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot}`} />}
                    <span className="text-[10px] text-gray-500">{sessionType}</span>
                    {isCancelled && <span className="text-[10px] text-rose-400 font-medium">Cancelada</span>}
                    {isCompleted && <span className="text-[10px] text-emerald-400 font-medium">Completada</span>}
                </div>
            </div>

            {/* Right actions */}
            {!isCancelled && !isCompleted && (
                <div className="flex items-center gap-1 shrink-0">
                    {isVideoCall ? (
                        <button
                            onClick={() => onJoinVideo?.(apt)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0075C9] text-white active:scale-90 transition-all"
                            aria-label="Unirse a videollamada"
                        >
                            <Video className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onMarkComplete?.(apt)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:scale-90 transition-all"
                            aria-label="Marcar como completada"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onViewDiary?.(apt)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 active:scale-90 transition-all"
                        aria-label="Ver expediente"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    )
}

// ── Component ─────────────────────────────────────────────────────────────────
const MobileProfessionalDashboard = ({
    // Identity
    userName,
    initials,
    fmtDateHeader,
    onNavigateProfile,
    // Week strip
    weekDays,
    todayDate,
    todayMonth,
    todayYear,
    calendarData,
    weekSessionMap,
    mobileWeekOffset,
    onPrevWeek,
    onNextWeek,
    onResetWeek,
    onSelectDate,
    selectedDate,
    selectedDateSessions,
    isViewingToday,
    selectedDateLabel,
    // Revenue
    revenueThisMonth,
    revenueGoal,
    revenuePct,
    outstandingAmount,
    // Stats
    stats,
    loading,
    // Upcoming appointments
    upcomingApts,
    nextUpcomingSession,
    // Session action handlers
    onJoinVideo,
    onViewDiary,
    onMarkComplete,
    // Today
    todayAppointments,
    onShowCalendar,
    // Quick access
    onNewPatient,
    onNavigateAgenda,
    // Todos
    todos,
    pendingTodoCount,
    onTodoToggle,
    onTodoOpen,
}) => {
    // Decide which sessions list to render
    const sessions = selectedDateSessions?.length > 0
        ? selectedDateSessions
        : (isViewingToday && upcomingApts.length > 0 ? upcomingApts.slice(0, 6) : [])

    // Hero = next/in-progress active session. Rows = the rest.
    const heroApt = sessions.find(apt => {
        const rawStatus = apt.estado || apt.status || ''
        const isDone = rawStatus === 'completed' || rawStatus === 'completada' ||
                       rawStatus === 'cancelled' || rawStatus === 'cancelada' || apt.isCancelled
        if (isDone) return false
        if (nextUpcomingSession) {
            return (apt._id || apt.id) === (nextUpcomingSession._id || nextUpcomingSession.id)
        }
        return true
    }) || null
    const rowApts = sessions.filter(apt => apt !== heroApt)

    return (
        <div className="md:hidden px-4 pt-4 pb-28 flex flex-col gap-5 max-w-lg mx-auto w-full">

            {/* ─────────────────────────────────────────────────────
                HEADER
            ───────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 capitalize">{fmtDateHeader}</p>
                    <h1 className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight mt-0.5 tracking-tight">
                        {userName}
                    </h1>
                </div>
                <button
                    onClick={onNewPatient}
                    className="w-11 h-11 rounded-full bg-[#0075C9] flex items-center justify-center active:scale-90 transition-transform shrink-0 mt-0.5"
                    aria-label="Nuevo paciente"
                >
                    <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
            </div>

            {/* ─────────────────────────────────────────────────────
                WEEK STRIP — minimal, borderless
            ───────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <button onClick={onPrevWeek} className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-600 active:text-gray-600 dark:active:text-gray-300 transition-colors" aria-label="Semana anterior">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {mobileWeekOffset === 0 ? (
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500 tabular-nums">
                            {weekDays[0] && `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${SHORT_MONTHS[weekDays[6].getMonth()]}`}
                        </span>
                    ) : (
                        <button onClick={onResetWeek} className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#0075C9]/20 text-[#54C0E8] active:scale-95 transition-all">
                            Hoy
                        </button>
                    )}
                    <button onClick={onNextWeek} className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-600 active:text-gray-600 dark:active:text-gray-300 transition-colors" aria-label="Semana siguiente">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    {weekDays.map((d, i) => {
                        const dayNum     = d.getDate()
                        const isToday    = dayNum === todayDate && d.getMonth() === todayMonth && d.getFullYear() === todayYear
                        const isSelected = selectedDate
                            ? dayNum === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()
                            : false
                        const hasSessions = weekSessionMap
                            ? weekSessionMap.has(`${d.getFullYear()}-${d.getMonth()}-${dayNum}`)
                            : !!(calendarData?.dayMap?.[dayNum]?.count)
                        return (
                            <button key={i} onClick={() => onSelectDate(d)} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{DOW_LABELS[i]}</span>
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
                                    isToday && isSelected ? 'bg-[#0075C9] text-white ring-2 ring-[#54C0E8]/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1623]'
                                    : isToday            ? 'bg-[#0075C9] text-white'
                                    : isSelected         ? 'bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-white ring-1 ring-gray-300 dark:ring-gray-500/50 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1623]'
                                    :                      'text-gray-500 dark:text-gray-400'
                                }`}>{dayNum}</span>
                                <span className={`w-1 h-1 rounded-full ${hasSessions ? (isToday ? 'bg-white/50' : 'bg-[#54C0E8]/80') : 'bg-transparent'}`} />
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────
                SESSIONS
            ───────────────────────────────────────────────────── */}
            <div>
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        {selectedDateLabel || 'Sesiones de hoy'}
                    </span>
                    <button onClick={onNavigateAgenda} className="text-[11px] font-semibold text-[#0075C9] flex items-center gap-0.5 active:opacity-70">
                        Agenda <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
                        <div className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800/30 animate-pulse" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-8 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-[13px] text-gray-500 dark:text-gray-500">
                            {isViewingToday ? 'Sin citas hoy' : 'Sin citas este día'}
                        </p>
                        <button
                            onClick={onShowCalendar}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-[12px] font-semibold text-gray-500 dark:text-gray-400 active:scale-[0.96] transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Agendar cita
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Hero card — the next/in-progress session */}
                        {heroApt && (
                            <div className="mb-3">
                                <HeroSessionCard
                                    apt={heroApt}
                                    onJoinVideo={onJoinVideo}
                                    onViewDiary={onViewDiary}
                                    onMarkComplete={onMarkComplete}
                                />
                            </div>
                        )}

                        {/* Remaining sessions as rows inside a single container */}
                        {rowApts.length > 0 && (
                            <div className="bg-white dark:bg-gray-900/60 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                                {rowApts.map((apt, i) => (
                                    <SessionRow
                                        key={apt._id || apt.id || i}
                                        apt={apt}
                                        index={i}
                                        onJoinVideo={onJoinVideo}
                                        onViewDiary={onViewDiary}
                                        onMarkComplete={onMarkComplete}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pending payments banner */}
            {outstandingAmount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40"
                >
                    <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    <p className="text-[12px] text-amber-700 dark:text-amber-300 font-medium">
                        <span className="font-bold">${outstandingAmount.toLocaleString()}</span> pendiente de cobrar
                    </p>
                </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────
                TODOS — planning, last
            ───────────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Tareas</span>
                    {pendingTodoCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-400">{pendingTodoCount} pendientes</span>
                    )}
                </div>
                {todos.length === 0 ? (
                    <button
                        onClick={onTodoOpen}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-dashed border-gray-300 dark:border-gray-700/60 text-[12px] font-semibold text-gray-400 dark:text-gray-600 active:scale-[0.98] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir tarea
                    </button>
                ) : (
                    <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800/80">
                            {todos.slice(0, 4).map((todo) => {
                                const badge = TODO_BADGE_COLORS[todo.category] || TODO_BADGE_COLORS.personal
                                return (
                                    <li key={todo.id} className="flex items-center gap-3 px-4 py-3">
                                        <button onClick={() => onTodoToggle(todo.id)} className="shrink-0">
                                            {todo.done
                                                ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                                                : <Square className="w-4 h-4 text-gray-600" />}
                                        </button>
                                        <span className={`flex-1 text-[13px] leading-tight ${todo.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {todo.text}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                                            {badge.label}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                        <button
                            onClick={onTodoOpen}
                            className="w-full py-2.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
                        >
                            Ver todas las tareas
                        </button>
                    </div>
                )}
            </motion.div>

        </div>
    )
}

export default MobileProfessionalDashboard
