import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Calendar, Clock, Video, FileText, MessageSquare, CheckCircle2, XCircle, Target } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
/** Strip stray "undefined" / "null" words that may leak into display names. */
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

const getTimeComponents = (date) => {
    const h = date.getHours()
    const m = date.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const dh = h % 12 || 12
    return {
        timeStr: `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        ampm,
    }
}

const getRelativeTime = (dateStr) => {
    if (!dateStr) return null
    const now = new Date()
    const then = new Date(dateStr)
    const diffMs = now - then
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    const weeks = Math.floor(diffDays / 7)
    if (weeks < 4) return `Hace ${weeks} sem.`
    const months = Math.floor(diffDays / 30)
    return months <= 1 ? 'Hace 1 mes' : `Hace ${months} meses`
}

const SESSION_TYPE_STYLES = {
    Consulta:    'bg-blue-100/70 text-blue-700',
    Seguimiento: 'bg-violet-100/70 text-violet-700',
    Evaluación:  'bg-amber-100/70 text-amber-700',
    Primera:     'bg-teal-100/70 text-teal-700',
    default:     'bg-gray-100 text-gray-600',
}

/* ─────────────────────────────────────────────────────────────────────────────
   SessionCard — pill with inline action tray (no modal)
───────────────────────────────────────────────────────────────────────────── */
const SessionCard = ({
    appointment,
    index,
    isNext = false,
    countdown = null,
    isImminent = false,
    onJoinVideo,
    onViewDiary,
    onMessage,
}) => {
    const patientName   = sanitize(appointment.nombrePaciente || appointment.patient?.name) || 'Paciente'
    const startTime      = new Date(appointment.fechaHora)
    const endTime        = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000)
    const riskLevel      = appointment.riskLevel || 'low'
    const homeworkOk     = appointment.homeworkCompleted !== false
    const sessionType    = appointment.type || 'Consulta'
    const treatmentGoal  = appointment.treatmentGoal || ''
    const lastVisit      = getRelativeTime(appointment.ultimaVisita)

    const { timeStr, ampm }     = getTimeComponents(startTime)
    const { timeStr: endStr, ampm: endAmpm } = getTimeComponents(endTime)
    const timeRange = `${timeStr} – ${endStr} ${endAmpm}`
    const typeStyle = SESSION_TYPE_STYLES[sessionType] || SESSION_TYPE_STYLES.default

    // Show date label when the appointment is NOT today
    const now = new Date()
    const isToday = startTime.getDate() === now.getDate() &&
        startTime.getMonth() === now.getMonth() &&
        startTime.getFullYear() === now.getFullYear()
    const shortMonths = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    const dateLabel = !isToday
        ? `${startTime.getDate()} ${shortMonths[startTime.getMonth()]}`
        : null

    /* visual tokens ── next session gets indigo, risk gets rose, default cycles */
    const bgPalette = [
        'bg-white border border-gray-100',
        'bg-orange-50/70 border border-orange-100/60',
        'bg-sky-50/70 border border-sky-100/60',
        'bg-emerald-50/70 border border-emerald-100/60',
        'bg-sky-50/70 border border-sky-100/60',
    ]
    const avatarPalette = [
        'bg-gray-200 text-gray-800',
        'bg-orange-200 text-orange-900',
        'bg-sky-200 text-sky-900',
        'bg-emerald-200 text-emerald-900',
        'bg-sky-200 text-sky-800',
    ]

    const bgClass = isNext
        ? 'bg-sky-50 border border-sky-200/80'
        : riskLevel === 'high'
            ? 'bg-rose-50/70 border border-rose-100/70'
            : bgPalette[index % bgPalette.length]

    const avatarClass = isNext
        ? 'bg-blue-700 text-white'
        : riskLevel === 'high'
            ? 'bg-rose-200 text-rose-900'
            : avatarPalette[index % avatarPalette.length]

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.055, duration: 0.28 }}
            className="min-w-0 w-full"
        >
            {/* ── PRÓXIMA label ─────────────────────────────── */}
            {isNext && (
                <div className="flex items-center gap-1.5 pl-12 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isImminent ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isImminent ? 'text-emerald-600' : 'text-sky-500'}`}>
                        Próxima sesión
                    </span>
                </div>
            )}

            {/* ── Timeline row ──────────────────────────────── */}
            <div className="flex items-start gap-2">
                {/* Time stamp */}
                <div className="w-9 shrink-0 text-right pt-2.5">
                    <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
                    <div className="text-[9px] text-gray-400 uppercase mt-0.5">{dateLabel || ampm}</div>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center pt-3 shrink-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isNext ? 'bg-sky-500' : 'bg-gray-300'}`} />
                    <div className="w-px flex-1 bg-gray-200 mt-1 min-h-6" />
                </div>

                {/* Card */}
                <div className="flex-1 pb-1.5">
                    {/* Pill — 3-line layout with inline actions */}
                    <div className={`w-full ${bgClass} rounded-xl px-3 py-2.5`}>
                        {/* Row 1: avatar + name + action icons */}
                        <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full ${avatarClass} flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm`}>
                                {getInitials(patientName)}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-xs leading-tight truncate ${isNext ? 'text-blue-950' : 'text-gray-900'}`}>
                                    {patientName}
                                </p>
                            </div>

                            {/* Badges + action icons */}
                            <div className="shrink-0 flex items-center gap-1">
                                {isNext && countdown ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 mr-0.5 ${
                                        isImminent ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-blue-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isImminent ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                        {countdown}
                                    </span>
                                ) : riskLevel === 'high' ? (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 mr-0.5">Alto riesgo</span>
                                ) : null}

                                <button
                                    type="button"
                                    title="Mensaje"
                                    onClick={() => onMessage && onMessage(appointment)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 active:scale-90 transition-all shadow-sm"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    type="button"
                                    title={isImminent ? 'Iniciar videollamada' : 'Videollamada'}
                                    onClick={() => onJoinVideo && onJoinVideo(appointment)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition-all shadow-sm ${
                                        isImminent
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400'
                                            : 'bg-white/80 border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                >
                                    <Video className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    type="button"
                                    title="Expediente"
                                    onClick={() => onViewDiary && onViewDiary(appointment)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 text-white active:scale-90 transition-all shadow-sm border border-blue-600"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Row 2: time range + session type tag */}
                        <div className="flex items-center gap-1.5 mt-1.5 pl-10.5">
                            <Clock className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                            <span className="text-[9px] text-gray-400">{timeRange}</span>
                            <span className="text-gray-300">·</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${typeStyle}`}>
                                {sessionType}
                            </span>
                        </div>

                        {/* Row 3: treatment goal · last visit · homework chip */}
                        {(treatmentGoal || lastVisit || true) && (
                            <div className="flex items-center gap-1.5 mt-1 pl-10.5 flex-wrap">
                                {treatmentGoal && (
                                    <span className="flex items-center gap-1 text-[9px] text-gray-500 truncate max-w-[45%]" title={treatmentGoal}>
                                        <Target className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                        {treatmentGoal}
                                    </span>
                                )}
                                {treatmentGoal && lastVisit && <span className="text-gray-300 text-[9px]">·</span>}
                                {lastVisit && (
                                    <span className="text-[9px] text-gray-400">
                                        {lastVisit}
                                    </span>
                                )}
                                {(treatmentGoal || lastVisit) && <span className="text-gray-300 text-[9px]">·</span>}
                                {homeworkOk ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Tarea
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                                        <XCircle className="w-2.5 h-2.5" />
                                        Tarea
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   BreakCard
───────────────────────────────────────────────────────────────────────────── */
const BreakCard = ({ time, index }) => {
    const [h, m, meridiem] = (time + ' ').split(/[\s:]/)
    const timeStr = `${String(h).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`
    const ampm = meridiem || (parseInt(h) >= 12 ? 'PM' : 'AM')

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.055, duration: 0.28 }}
            className="flex items-start gap-2 my-1"
        >
            <div className="w-9 shrink-0 text-right pt-2.5">
                <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
                <div className="text-[9px] text-gray-400 uppercase mt-0.5">{ampm}</div>
            </div>
            <div className="flex flex-col items-center pt-3 shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-300 shrink-0" />
                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-6" />
            </div>
            <div className="flex-1 pb-1.5">
                <div className="relative overflow-hidden bg-blue-600/90 rounded-xl px-4 py-2.5 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 4px,white 4px,white 7px)' }} />
                    <span className="relative text-white font-semibold text-xs">Hora de Descanso</span>
                </div>
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   AvailableSlotCard — "No disponible" stripe
───────────────────────────────────────────────────────────────────────────── */
const AvailableSlotCard = ({ slot, index }) => {
    const startTime = new Date(slot.fechaHora)
    const { timeStr, ampm } = getTimeComponents(startTime)

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.055, duration: 0.28 }}
            className="flex items-start gap-2 my-1"
        >
            <div className="w-9 shrink-0 text-right pt-2.5">
                <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
                <div className="text-[9px] text-gray-400 uppercase mt-0.5">{ampm}</div>
            </div>
            <div className="flex flex-col items-center pt-3 shrink-0">
                <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                <div className="w-px flex-1 bg-gray-200 mt-1 min-h-6" />
            </div>
            <div className="flex-1 pb-1.5">
                <div className="relative overflow-hidden bg-gray-400/50 rounded-xl px-4 py-2.5 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 4px,white 4px,white 7px)' }} />
                    <span className="relative text-white font-semibold text-xs">No Disponible</span>
                </div>
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   EmptyState
───────────────────────────────────────────────────────────────────────────── */
const EmptyState = () => (
    <div className="text-center py-12">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1 text-sm">No hay sesiones hoy</p>
        <p className="text-xs text-gray-400">Tu agenda está libre</p>
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
                <div className="w-8 h-3 bg-gray-200 rounded ml-auto" />
                <div className="w-5 h-2 bg-gray-100 rounded ml-auto" />
            </div>

            {/* Timeline track */}
            <div className="flex flex-col items-center pt-3 shrink-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isFirst ? 'bg-sky-200' : 'bg-gray-200'}`} />
                <div className="w-px flex-1 bg-gray-100 mt-1 min-h-10" />
            </div>

            {/* Card body */}
            <div
                className={`flex-1 rounded-2xl px-3 py-3 mb-1.5 ${
                    isFirst ? 'bg-sky-50/60 border border-sky-100/80' : 'bg-gray-50 border border-gray-100'
                }`}
            >
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full shrink-0 ${isFirst ? 'bg-sky-200' : 'bg-gray-200'}`} />

                    {/* Text lines */}
                    <div className="flex-1 space-y-2">
                        <div className={`h-3 ${w.name} bg-gray-200 rounded`} />
                        <div className={`h-2 ${w.detail} bg-gray-100 rounded`} />
                    </div>

                    {/* Action pill */}
                    <div className={`h-6 ${w.badge} bg-gray-200 rounded-full shrink-0`} />
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
            ) : (
                <div ref={scrollRef} className="space-y-0 xl:flex-1 xl:min-h-0 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {sessions.map((item, index) => {
                            const itemTs = item.fechaHora ? new Date(item.fechaHora).getTime() : null
                            const isNext = nextSessionTime !== null && itemTs !== null && itemTs === nextSessionTime
                            const isAnchor = index === anchorIndex

                            if (item.isBreak) {
                                return <BreakCard key={`break-${index}`} time={item.time} index={index} />
                            }
                            if (item.isUnavailable) {
                                return (
                                    <div key={itemTs || index} ref={isAnchor ? currentRef : null}>
                                        <AvailableSlotCard slot={item} index={index} />
                                    </div>
                                )
                            }
                            return (
                                <div key={itemTs || index} ref={isAnchor ? currentRef : null}>
                                    <SessionCard
                                        appointment={item}
                                        index={index}
                                        isNext={isNext}
                                        countdown={isNext ? nextSessionCountdown : null}
                                        isImminent={isNext && nextIsImminent}
                                        onJoinVideo={onJoinVideo}
                                        onViewDiary={onViewDiary}
                                        onMessage={onMessage}
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
