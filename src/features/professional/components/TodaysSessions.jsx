import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Calendar, CalendarCheck, Video, FileText, MessageSquare, CheckCircle2, Ban, Coffee } from 'lucide-react'
import { getAvatarColor } from '@shared/utils/avatarColor'

/* ═══════════════════════════════════════════════════════════════════════════
   1. HELPERS & CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const sanitize = (s) => {
    if (!s || typeof s !== 'string') return ''
    return s.replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '').replace(/\s{2,}/g, ' ').trim()
}

const getInitials = (name) => {
    const clean = sanitize(name)
    if (!clean) return '?'
    const parts = clean.split(' ')
    return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : clean.substring(0, 2).toUpperCase()
}

const pad = (n) => String(n).padStart(2, '0')
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

const SHORT_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const SESSION_TYPE_DOT = {
    'Primera consulta': 'bg-sky-500', Seguimiento: 'bg-emerald-500',
    Extraordinaria: 'bg-amber-500', default: 'bg-gray-400',
}


const GHOST_BTN          = 'w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1'
const GHOST_BTN_ACTIVE   = 'w-8 h-8 flex items-center justify-center rounded-lg text-sky-500 dark:text-sky-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1'
const GHOST_BTN_IMMINENT = 'w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1'
const GHOST_BTN_DISABLED = 'w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed'

/** Derive all appointment metadata from raw data */
const parseAppointment = (appointment) => {
    const patientName = sanitize(appointment.nombrePaciente || appointment.patient?.name) || 'Paciente'
    const patientId   = appointment.patientId || appointment.patient?._id
    const startTime   = new Date(appointment.fechaHora)
    const endTime     = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000)
    const riskLevel   = appointment.riskLevel || 'low'
    const sessionType = appointment.type || 'Primera consulta'
    const isVideoCall = appointment.isVideoCall || appointment.mode === 'videollamada'

    const rawStatus        = appointment.estado || appointment.status || ''
    const isCompleted      = rawStatus === 'completed' || rawStatus === 'completada'
    const isCancelled      = rawStatus === 'cancelled' || rawStatus === 'cancelada' || appointment.isCancelled === true
    const isPendingPayment = !isCompleted && !isCancelled && appointment.paymentStatus === 'pending'

    const isToday     = startTime.toDateString() === new Date().toDateString()
    const dateLabel   = !isToday ? `${startTime.getDate()} ${SHORT_MONTHS[startTime.getMonth()]}` : null
    const timeRange   = `${fmtTime(startTime)} – ${fmtTime(endTime)}`
    const nowMs       = Date.now()
    const isInProgress = !isCompleted && !isCancelled && nowMs >= startTime.getTime() && nowMs < endTime.getTime()
    const isDone      = isCompleted || isCancelled

    return {
        patientName, patientId, startTime, endTime, riskLevel, sessionType,
        isVideoCall, isCompleted, isCancelled, isDone, isPendingPayment, dateLabel,
        timeRange, isInProgress,
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. STYLE RESOLVERS 
   ═══════════════════════════════════════════════════════════════════════════ */

const getCardBg = ({ isCancelled, isCompleted, isNext, isInProgress, riskLevel, isPendingPayment }) => {
    if (isCancelled)        return 'bg-white dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600'
    if (isCompleted)        return 'bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-700/60'
    if (isInProgress)       return 'bg-sky-50/80 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-700/50 border-l-[3px] border-l-sky-500 dark:border-l-sky-400 shadow-sm'
if (isNext)             return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/40 border-l-[3px] border-l-sky-300 dark:border-l-sky-600 shadow-sm'
    return 'bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-700/60'
}

const getAvatarClass = ({ isCancelled, patientId, patientName }) => {
    if (isCancelled) return 'bg-gray-100 text-gray-400 dark:bg-gray-700/60 dark:text-gray-500'
    return getAvatarColor(patientId || patientName)
}

const getNameClass = ({ isCancelled, isCompleted }) => {
    if (isCancelled) return 'line-through text-gray-400 dark:text-gray-500'
    if (isCompleted) return 'text-gray-400 dark:text-gray-500'
    return 'text-gray-900 dark:text-gray-100'
}

const getTimelineDot = ({ isCancelled, isInProgress }) => {
    if (isCancelled)  return 'w-2 h-2 bg-gray-400/30 dark:bg-gray-600/50'
    if (isInProgress) return 'w-2.5 h-2.5 bg-sky-400 dark:bg-sky-500 animate-pulse ring-2 ring-sky-400/30 dark:ring-sky-500/30'
    return 'w-2 h-2 bg-gray-400/60 dark:bg-gray-500/60'
}

const getSpineColor = () => 'border-gray-400/40 dark:border-gray-500/30'

const CHIP_FADED = 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'

/* ═══════════════════════════════════════════════════════════════════════════
   3. SHARED LAYOUT — TimelineRow (used by Session, Break & Unavailable)
   ═══════════════════════════════════════════════════════════════════════════ */

const TimeStamp = ({ time, dateLabel, dimmed }) => (
    <div className={`w-9 shrink-0 text-right pt-3 ${dimmed ? 'opacity-50' : ''}`}>
        <div className={`text-[10px] font-bold leading-none ${dimmed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
            {time}
        </div>
        {dateLabel && <div className="text-[9px] text-gray-500 dark:text-gray-500 uppercase mt-0.5">{dateLabel}</div>}
    </div>
)

const TimelineSpine = ({ isFirst, isLast, dotClass, spineColor = 'border-gray-400/70 dark:border-gray-400/40' }) => (
    <div className="relative flex flex-col items-center shrink-0 self-stretch" style={{ width: '10px' }}>
        {isFirst ? <div style={{ height: '15px' }} /> : (
            <div className={`w-0 border-l-2 border-dashed ${spineColor}`} style={{ height: '15px' }} />
        )}
        <div className={`rounded-full shrink-0 z-10 transition-all ${dotClass}`} />
        {!isLast && <div className={`w-0 border-l-2 border-dashed flex-1 ${spineColor}`} />}
    </div>
)

const DEFAULT_DOT = 'w-2 h-2 rounded-full bg-gray-400/60 dark:bg-gray-500/60'

const TimelineRow = ({ index, isFirst, isLast, timeStr, dateLabel, dotClass = DEFAULT_DOT, spineColor, dimmed, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.055, duration: 0.28 }}
        className="flex items-stretch gap-2"
    >
        <TimeStamp time={timeStr} dateLabel={dateLabel} dimmed={dimmed} />
        <TimelineSpine isFirst={isFirst} isLast={isLast} dotClass={dotClass} spineColor={spineColor} />
        <div className="flex-1 pb-1.5">{children}</div>
    </motion.div>
)

/* ═══════════════════════════════════════════════════════════════════════════
   4. SESSION CARD SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Action buttons (video, complete, file) */
const SessionActions = ({ appointment, data, isActive, isImminent, onJoinVideo, onViewDiary, onMarkComplete, onRequestPayment }) => {
    const { isCancelled, isCompleted, isVideoCall, isPendingPayment } = data
    const primaryBtn = isImminent ? GHOST_BTN_IMMINENT : isActive ? GHOST_BTN_ACTIVE : GHOST_BTN
    return (
        <div className="flex items-center gap-0.5 shrink-0">
{!isCancelled && !isCompleted && isVideoCall && (
                isPendingPayment ? (
                    <button type="button" title="Pago pendiente — no se puede iniciar la sesión" disabled className={GHOST_BTN_DISABLED}>
                        <Video className="w-5 h-5" />
                    </button>
                ) : (
                    <button type="button" title={isImminent ? 'Iniciar videollamada' : 'Videollamada'} onClick={() => onJoinVideo?.(appointment)} className={primaryBtn}>
                        <Video className="w-5 h-5" />
                    </button>
                )
            )}
            {!isCancelled && !isCompleted && !isVideoCall && (
                <button type="button" title="Marcar como completada" onClick={() => onMarkComplete?.(appointment)} className={primaryBtn}>
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            )}
            <button type="button" title="Expediente" onClick={() => onViewDiary?.(appointment)} className={GHOST_BTN}>
                <FileText className="w-5 h-5" />
            </button>
        </div>
    )
}

/** Status + type + mode chips */
const SessionChips = ({ data }) => {
    const { isCompleted, isCancelled, isDone, riskLevel, sessionType, isVideoCall, isPendingPayment } = data
    const typeDot = SESSION_TYPE_DOT[sessionType] || SESSION_TYPE_DOT.default
    const hasStatusChip = isCompleted || isCancelled || riskLevel === 'high'

    const modeLabel = isVideoCall ? 'Videollamada' : 'Presencial'
    const modeColor = isDone ? CHIP_FADED
        : isVideoCall ? 'border-sky-200 dark:border-sky-700/60 text-sky-600 dark:text-sky-400'
        : 'border-violet-200 dark:border-violet-700/60 text-violet-600 dark:text-violet-400'

    return (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
{isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60">
                    <CheckCircle2 className="w-3 h-3" /> Completada
                </span>
            )}
            {isCancelled && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/60">
                    <Ban className="w-3 h-3" /> Cancelada
                </span>
            )}
            {!isDone && riskLevel === 'high' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/60">
                    Alto riesgo
                </span>
            )}

            {hasStatusChip && <span className="text-gray-300 dark:text-gray-600 text-xs select-none">·</span>}

            {/* Session type */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${isDone ? CHIP_FADED : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                {!isDone && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot}`} />}
                <span className={isDone ? 'line-through' : ''}>{sessionType}</span>
            </span>

            <span className="text-gray-300 dark:text-gray-600 text-xs select-none">·</span>

            {/* Mode */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${modeColor}`}>
                <span className={isDone ? 'line-through' : ''}>{modeLabel}</span>
            </span>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. SESSION CARD (composed from sub-components)
   ═══════════════════════════════════════════════════════════════════════════ */

const SessionCard = ({ appointment, index, isFirst, isNext, isLast, countdown, isImminent, onJoinVideo, onViewDiary, onMarkComplete, onRequestPayment }) => {
    const data = parseAppointment(appointment)
    const { patientName, startTime, endTime, isCancelled, isCompleted, isInProgress, dateLabel, timeRange } = data

    const bgClass    = getCardBg({ ...data, isNext })
    const nameClass  = getNameClass(data)
    const dotClass   = getTimelineDot(data)
    const spineColor = getSpineColor()

    const isActive = isNext || isInProgress

    return (
        <div className="min-w-0 w-full group ">
            <TimelineRow index={index} isFirst={isFirst} isLast={isLast} timeStr={fmtTime(startTime)} dateLabel={dateLabel} dotClass={dotClass} spineColor={spineColor} dimmed={isCancelled}>
                <div className={`${bgClass} rounded-2xl px-4 py-3 transition-shadow duration-200 ${!isCancelled ? 'group-hover:shadow-md' : ''}`}>
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-full ${getAvatarClass(data)} flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}>
                            {getInitials(patientName)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                    <p className={`font-semibold text-sm leading-snug truncate ${nameClass}`}>{patientName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className={`text-xs leading-none ${isCancelled ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{timeRange}</span>
                                        {dateLabel && <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{dateLabel}</span>}
                                        {isInProgress && <span className="text-[10px] font-semibold text-sky-500 dark:text-sky-400">En curso</span>}
                                        {isNext && countdown && !isInProgress && (
                                            <span className={`text-[10px] font-semibold ${isImminent ? 'text-emerald-500 dark:text-emerald-400' : 'text-sky-500 dark:text-sky-400'}`}>{countdown}</span>
                                        )}
                                    </div>
                                </div>
                                <SessionActions appointment={appointment} data={data} isActive={isActive} isImminent={isImminent} onJoinVideo={onJoinVideo} onViewDiary={onViewDiary} onMarkComplete={onMarkComplete} onRequestPayment={onRequestPayment} />
                            </div>
                            <SessionChips data={data} />
                        </div>
                    </div>
                    {isInProgress && (() => {
                        const pct = Math.min(100, Math.round((Date.now() - startTime.getTime()) / (endTime.getTime() - startTime.getTime()) * 100))
                        return (
                            <div className="mt-3 h-0.5 rounded-full overflow-hidden bg-sky-100 dark:bg-sky-900/30">
                                <div className="h-full bg-linear-to-r from-sky-400 to-teal-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                        )
                    })()}
                </div>
            </TimelineRow>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. BREAK & UNAVAILABLE CARDS (use shared TimelineRow)
   ═══════════════════════════════════════════════════════════════════════════ */

const BreakCard = ({ time, index, isFirst = false, isLast = false }) => {
    const [h, m] = (time + ' ').split(/[\s:]/)
    const timeStr = `${pad(h)}:${pad(m || '00')}`

    return (
        <TimelineRow index={index} isFirst={isFirst} isLast={isLast} timeStr={timeStr}>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2">
                <Coffee className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">Hora de Descanso</span>
            </div>
        </TimelineRow>
    )
}

const AvailableSlotCard = ({ slot, index, isFirst = false, isLast = false }) => {
    const timeStr = fmtTime(new Date(slot.fechaHora))

    return (
        <TimelineRow index={index} isFirst={isFirst} isLast={isLast} timeStr={timeStr}>
            <div className="flex items-center justify-center py-1">
                <Ban className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </div>
        </TimelineRow>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   EmptyState
───────────────────────────────────────────────────────────────────────────── */
const EmptyState = ({ label = 'No hay sesiones hoy', sub = 'Tu agenda está libre', icon: Icon = Calendar, iconClass = 'text-gray-400 dark:text-gray-500', bare = false }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        {bare ? (
            <Icon className={`w-10 h-10 mb-3 mx-auto ${iconClass}`} />
        ) : (
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon className={`w-7 h-7 ${iconClass}`} />
            </div>
        )}
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1 text-sm">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
)

/* ─────────────────────────────────────────────────────────────────────────────
   SessionsSkeleton
───────────────────────────────────────────────────────────────────────────── */

/** Width variants so skeleton rows look natural, not identical */
const SKELETON_WIDTHS = [
    { name: 'w-24', detail: 'w-20', badge: 'w-14' },
    { name: 'w-28', detail: 'w-16', badge: 'w-12' },
    { name: 'w-20', detail: 'w-24', badge: 'w-16' },
    { name: 'w-32', detail: 'w-14', badge: 'w-10' },
]

const SessionCardSkeleton = ({ index }) => {
    const w = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]
    const isFirst = index === 0
    return (
        <div
            className="flex items-start gap-2 animate-pulse"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Time stamp column */}
            <div className="w-9 shrink-0 text-right pt-2.5 space-y-1">
                <div className="w-8 h-3 bg-gray-200 dark:bg-gray-600 rounded ml-auto" />
                <div className="w-5 h-2 bg-gray-100 dark:bg-gray-700 rounded ml-auto" />
            </div>

            {/* Timeline track */}
            <div className="flex flex-col items-center pt-3 shrink-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isFirst ? 'bg-sky-200 dark:bg-sky-700' : 'bg-gray-200 dark:bg-gray-600'}`} />
                <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700 mt-1 min-h-10" />
            </div>

            {/* Card body */}
            <div
                className={`flex-1 rounded-2xl px-3 py-3 mb-1.5 ${
                    isFirst ? 'bg-sky-50/60 dark:bg-sky-900/20 border border-sky-100/80 dark:border-sky-800/40' : 'bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600'
                }`}
            >
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full shrink-0 ${isFirst ? 'bg-sky-200 dark:bg-sky-700' : 'bg-gray-200 dark:bg-gray-600'}`} />

                    {/* Text lines */}
                    <div className="flex-1 space-y-2">
                        <div className={`h-3 ${w.name} bg-gray-200 dark:bg-gray-600 rounded`} />
                        <div className={`h-2 ${w.detail} bg-gray-100 dark:bg-gray-700 rounded`} />
                    </div>

                    {/* Action pill */}
                    <div className={`h-6 ${w.badge} bg-gray-200 dark:bg-gray-600 rounded-full shrink-0`} />
                </div>
            </div>
        </div>
    )
}

const SessionsSkeleton = () => (
    <div className="space-y-0 pr-1">
        {[...Array(4)].map((_, i) => (
            <SessionCardSkeleton key={i} index={i} />
        ))}
    </div>
)

/* ─────────────────────────────────────────────────────────────────────────────
   TodaysSessions — main export
───────────────────────────────────────────────────────────────────────────── */
const TodaysSessions = ({
    sessions = [],
    loading,
    onJoinVideo,
    onViewDiary,
    onMessage,
    onMarkComplete,
    onRequestPayment,
    nextSessionTime = null,
    nextSessionCountdown = null,
    nextIsImminent = false,
    isViewingToday = false,
}) => {
    const scrollRef = useRef(null)
    const currentRef = useRef(null)

    // Auto-scroll to the current/next session when viewing today
    useEffect(() => {
        if (!isViewingToday || loading) return
        const id = setTimeout(() => {
            const container = scrollRef.current
            const anchor = currentRef.current
            if (!container || !anchor) return
            // Calculate absolute offset of anchor inside the scroll container
            const containerRect = container.getBoundingClientRect()
            const anchorRect    = anchor.getBoundingClientRect()
            // anchorRect.top - containerRect.top = anchor's position relative to container's visible top
            const scrollTo = container.scrollTop + (anchorRect.top - containerRect.top) - 24
            container.scrollTop = Math.max(0, scrollTo)
        }, 150)
        return () => clearTimeout(id)
    }, [isViewingToday, loading, sessions.length])

    // Find the index of the first item at or after 30 min ago (scroll anchor)
    const now = Date.now()
    const anchorIndex = (() => {
        const idx = sessions.findIndex(item => {
            if (!item.fechaHora) return false
            return new Date(item.fechaHora).getTime() >= now - 30 * 60 * 1000
        })
        // If everything is in the past, anchor to the last real session
        if (idx === -1) {
            const lastReal = [...sessions].reverse().findIndex(item => !item.isUnavailable)
            return lastReal === -1 ? sessions.length - 1 : sessions.length - 1 - lastReal
        }
        return idx
    })()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="min-w-0 xl:flex xl:flex-col xl:flex-1 xl:min-h-0"
        >
            {loading ? (
                <SessionsSkeleton />
            ) : sessions.length === 0 ? (
                <EmptyState />
            ) : sessions.every(s => s.isUnavailable || s.isBreak) ? (
                <EmptyState icon={CalendarCheck} label="Sin sesiones este día" sub={null} bare iconClass="text-blue-200 dark:text-blue-700" />
            ) : (
                <div ref={scrollRef} className="space-y-0 xl:flex-1 xl:min-h-0 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {sessions.map((item, index) => {
                            const itemTs = item.fechaHora ? new Date(item.fechaHora).getTime() : null
                            const isNext = nextSessionTime !== null && itemTs !== null && itemTs === nextSessionTime
                            const isAnchor = index === anchorIndex
                            const isLast = index === sessions.length - 1

                            const isFirst = index === 0

                            if (item.isBreak) {
                                return <BreakCard key={`break-${index}`} time={item.time} index={index} isFirst={isFirst} isLast={isLast} />
                            }
                            if (item.isUnavailable) {
                                return (
                                    <div key={item._id || item.id || `unavailable-${itemTs}-${index}`} ref={isAnchor ? currentRef : null}>
                                        <AvailableSlotCard slot={item} index={index} isFirst={isFirst} isLast={isLast} />
                                    </div>
                                )
                            }
                            return (
                                <div key={item._id || item.id || `session-${itemTs}-${index}`} ref={isAnchor ? currentRef : null}>

                                    <SessionCard
                                        appointment={item}
                                        index={index}
                                        isFirst={isFirst}
                                        isNext={isNext}
                                        isLast={isLast}
                                        countdown={isNext ? nextSessionCountdown : null}
                                        isImminent={isNext && nextIsImminent}
                                        onJoinVideo={onJoinVideo}
                                        onViewDiary={onViewDiary}
                                        onMessage={onMessage}
                                        onMarkComplete={onMarkComplete}
                                        onRequestPayment={onRequestPayment}
                                    />
                                </div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    )
}

export default TodaysSessions
