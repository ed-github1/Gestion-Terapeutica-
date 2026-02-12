import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Clock, Video, MoreHorizontal, Calendar } from 'lucide-react'
import SessionDetailsModal from './SessionDetailsModal'

/* ── Helpers ──────────────────────────────────────── */

const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase()
}

const formatSessionTime = (date) => {
    const h = date.getHours()
    const m = date.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

const getTimeAgo = (lastVisit) => {
    if (!lastVisit) return 'New patient'
    const weeks = Math.floor((Date.now() - new Date(lastVisit)) / (7 * 24 * 60 * 60 * 1000))
    if (weeks === 0) return 'This week'
    if (weeks === 1) return '1 week ago'
    return `${weeks} weeks ago`
}

const AVATAR_COLORS = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-cyan-100 text-cyan-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
]

/* ── SessionRow ───────────────────────────────────── */

const SessionRow = ({ appointment, index, onClick, isNow }) => {
    const name = appointment.nombrePaciente || appointment.patient?.name || 'Unknown'
    const start = new Date(appointment.fechaHora)
    const end = new Date(start.getTime() + 50 * 60 * 1000) // 50-min session
    const risk = appointment.riskLevel || 'low'
    const lastVisit = appointment.ultimaVisita || appointment.lastSession
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

    return (
        <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onClick(appointment)}
            className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 group ${
                isNow ? 'bg-indigo-50/40' : ''
            } ${index > 0 ? 'border-t border-gray-100' : ''}`}
        >
            {/* Time */}
            <div className="w-16 shrink-0">
                <p className={`text-sm font-medium ${isNow ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {formatSessionTime(start)}
                </p>
                <p className="text-xs text-gray-400">{formatSessionTime(end)}</p>
            </div>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-xs font-semibold shrink-0 relative`}>
                {getInitials(name)}
                {risk === 'high' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate">{getTimeAgo(lastVisit)}</p>
            </div>

            {/* Status / Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {isNow && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                        Now
                    </span>
                )}
                {risk === 'high' && (
                    <span className="hidden sm:inline-flex px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full">
                        High risk
                    </span>
                )}
                <Video className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </motion.button>
    )
}

/* ── BreakRow ─────────────────────────────────────── */

const BreakRow = ({ time, index }) => {
    const parts = time.split(' ')
    return (
        <div className={`flex items-center gap-4 px-4 py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="w-16 shrink-0">
                <p className="text-sm font-medium text-gray-400">{parts[0]}</p>
                <p className="text-xs text-gray-300">{parts[1]}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-gray-400 px-2">Break</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>
        </div>
    )
}

/* ── Empty & Loading States ───────────────────────── */

const EmptyState = () => (
    <div className="text-center py-12 px-6">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">No sessions today</p>
        <p className="text-xs text-gray-400 mt-1">Your schedule is clear</p>
    </div>
)

const LoadingSkeleton = () => (
    <div className="divide-y divide-gray-100">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-16 shrink-0">
                    <div className="h-4 w-12 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-10 bg-gray-100 rounded" />
                </div>
                <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
            </div>
        ))}
    </div>
)

/* ── TodaysSessions ───────────────────────────────── */

const TodaysSessions = ({ sessions = [], loading, onJoinVideo, onViewProfile }) => {
    const [selectedSession, setSelectedSession] = useState(null)

    // Sort sessions by time
    const sorted = [...sessions].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

    // Insert break if there's a >60 min gap
    const items = []
    sorted.forEach((session, idx) => {
        items.push(session)
        if (idx < sorted.length - 1) {
            const curEnd = new Date(session.fechaHora).getTime() + 50 * 60 * 1000
            const nextStart = new Date(sorted[idx + 1].fechaHora).getTime()
            if (nextStart - curEnd >= 60 * 60 * 1000) {
                const breakTime = new Date(curEnd + 10 * 60 * 1000)
                items.push({
                    isBreak: true,
                    time: formatSessionTime(breakTime)
                })
            }
        }
    })

    // Check if a session is happening now
    const now = Date.now()
    const isSessionNow = (s) => {
        const start = new Date(s.fechaHora).getTime()
        return now >= start && now <= start + 50 * 60 * 1000
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {sessions.length}
                    </span>
                </div>
                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    View calendar
                </button>
            </div>

            {/* List */}
            {loading ? (
                <LoadingSkeleton />
            ) : sessions.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) =>
                            item.isBreak ? (
                                <BreakRow key={`break-${index}`} time={item.time} index={index} />
                            ) : (
                                <SessionRow
                                    key={item.id || index}
                                    appointment={item}
                                    index={index}
                                    onClick={setSelectedSession}
                                    isNow={isSessionNow(item)}
                                />
                            )
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            {selectedSession && (
                <SessionDetailsModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onJoinVideo={onJoinVideo}
                    onAddNote={(s) => console.log('Add note:', s)}
                    onMessage={(s) => console.log('Message:', s)}
                />
            )}
        </>
    )
}

export default TodaysSessions
