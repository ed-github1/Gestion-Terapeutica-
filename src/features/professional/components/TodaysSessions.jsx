import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, Video, AlertCircle, CheckCircle2, FileText, Target } from 'lucide-react'
import { formatTime } from '../dashboard/dashboardUtils'
import { useState } from 'react'
import SessionDetailsModal from './SessionDetailsModal'

/**
 * Get patient initials from name
 */
const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

/**
 * Get time ago text
 */
const getTimeAgo = (lastSession) => {
    if (!lastSession) return 'Primera Visita'
    const now = new Date()
    const last = new Date(lastSession)
    const weeks = Math.floor((now - last) / (7 * 24 * 60 * 60 * 1000))
    if (weeks === 0) return 'Esta Semana'
    if (weeks === 1) return 'Visitado Hace 1 Semana'
    return `Visitado Hace ${weeks} Semanas`
}

/**
 * Get risk level styling
 */
const getRiskStyling = (riskLevel) => {
    switch (riskLevel) {
        case 'high':
            return { border: 'border-l-4 border-rose-500', glow: 'shadow-rose-100' }
        case 'medium':
            return { border: 'border-l-4 border-amber-500', glow: 'shadow-amber-100' }
        case 'low':
        default:
            return { border: '', glow: '' }
    }
}

/**
 * SessionCard Component
 * Matches the reference design with time on left, dashed connector, avatar, name, time range, and visit badge
 */
const SessionCard = ({ appointment, index, onClick }) => {
    const patientName = appointment.nombrePaciente || appointment.patient?.name || 'Paciente Desconocido'
    const startTime = new Date(appointment.fechaHora)
    
    // Clinical data
    const riskLevel = appointment.riskLevel || 'low'
    const lastNote = appointment.lastSessionNote || 'Sin notas previas'
    const todayGoal = appointment.treatmentGoal || 'Continuar plan de tratamiento'
    const insuranceSessions = appointment.insuranceSessionsRemaining || null
    const homeworkComplete = appointment.homeworkCompleted !== false // Default true if not specified
    const riskStyling = getRiskStyling(riskLevel)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    const hours = startTime.getHours()
    const minutes = startTime.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const timeStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    
    const endHours = endTime.getHours()
    const endMinutes = endTime.getMinutes()
    const endAmpm = endHours >= 12 ? 'PM' : 'AM'
    const endDisplayHours = endHours % 12 || 12
    const endTimeStr = `${String(endDisplayHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')} ${endAmpm}`

    const timeRange = `${timeStr} - ${endTimeStr}`
    const lastVisit = appointment.ultimaVisita || appointment.lastSession

    // Rotating background colors matching reference
    const backgrounds = [
        'bg-orange-50/80', // warm peach like Jemma Linda
        'bg-white',        // plain white like Andy John
        'bg-blue-50/80',   // light blue like Ariana Jamie
        'bg-emerald-50/80',
        'bg-pink-50/80'
    ]
    const bgColor = backgrounds[index % backgrounds.length]

    // Avatar colors
    const avatarColors = [
        'bg-orange-200 text-orange-900',
        'bg-indigo-200 text-indigo-900',
        'bg-emerald-200 text-emerald-900',
        'bg-pink-200 text-pink-900',
        'bg-purple-200 text-purple-900'
    ]
    const avatarColor = avatarColors[index % avatarColors.length]

    // iMessage-style positioning - strict alternation left/right
    const isRightAligned = index % 2 === 1 // Odd indexes go right, even go left
    
    // Variable widths for visual interest
    const widths = ['70%', '85%', '75%', '80%', '65%']
    const width = widths[index % widths.length]
    const position = `max-w-[${width}] ${isRightAligned ? 'ml-auto' : ''}`

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="flex items-center gap-1 group"
        >
            {/* Time column */}
            <div className="w-8 md:w-10 shrink-0 text-right">
                <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
                <div className="text-[10px]  text-gray-400 font-medium uppercase mt-0.5">{ampm}</div>
            </div>

            {/* Dashed line */}
            <div className="w-4 md:w-6 border-t border-dashed border-gray-300 shrink-0"></div>

            {/* Card container with full dashed line */}
            <div className={`flex-1 flex items-center ${isRightAligned ? 'justify-end' : 'justify-start'}`}>
                {/* Leading dashed line for right-aligned cards */}
                {isRightAligned && <div className="flex-1 border-t border-dashed border-gray-300"></div>}
                
                {/* Card - Clean design with click handler */}
                <div 
                    className={`${position} relative shrink-0 cursor-pointer`}
                    onClick={() => onClick(appointment)}
                >
                    {/* Risk level alert - subtle indicator above card */}
                    {riskLevel === 'high' && (
                        <div className="absolute -top-5 left-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                    )}
                    
                    <div className={`flex items-center gap-2 md:gap-3 ${bgColor} ${riskLevel === 'high' ? 'ring-2 ring-rose-200' : ''} rounded-xl md:rounded-2xl px-2.5 md:px-4 py-2 md:py-2.5 transition-all hover:shadow-md hover:scale-[1.02] min-w-0`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 shadow-sm relative`}>
                            {getInitials(patientName)}
                            {/* Homework completion badge - subtle */}
                            {homeworkComplete && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Video className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500 shrink-0" />
                                <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-tight wrap-break-word">{patientName}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-gray-400">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                                <span className="truncate">{timeRange}</span>
                            </div>
                        </div>

                        {/* Visit badge */}
                        <div className="hidden lg:flex bg-white/70 border border-gray-200 rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-[10px] text-gray-400 font-medium italic whitespace-nowrap shrink-0">
                            {getTimeAgo(lastVisit)}
                        </div>
                    </div>
                </div>
                
                {/* Trailing dashed line for left-aligned cards */}
                {!isRightAligned && <div className="flex-1 border-t border-dashed border-gray-300"></div>}
            </div>

            {/* Dashed line trailing */}
            <div className="hidden lg:block w-4 md:w-6 border-t border-dashed border-gray-300 shrink-0"></div>
        </motion.div>
    )
}

/**
 * BreakCard Component
 * Dark pill-shaped break indicator with diagonal stripes
 */
const BreakCard = ({ time, index }) => {
    const parts = time.split(' ')
    const timeStr = parts[0] || '09:00'
    const ampm = parts[1] || 'AM'

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="flex items-center gap-1 my-1"
        >
            {/* Time column */}
            <div className="w-8 md:w-10 shrink-0 text-right">
                <div className="text-[10px] font-bold text-gray-400 leading-none">{timeStr}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{ampm}</div>
            </div>

            {/* Dashed line */}
            <div className="w-4 md:w-6 border-t border-dashed border-gray-300 shrink-0"></div>

            {/* Break container - full width */}
            <div className="flex-1 flex items-center">
                {/* Break pill - full width */}
                <div className="flex-1 relative overflow-hidden bg-blue-600 rounded-full px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-center">
                    {/* Diagonal stripes overlay */}
                    <div 
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, white 3px, white 5px)'
                        }}
                    ></div>
                    <span className="relative text-white font-bold text-xs md:text-sm">Hora de Descanso</span>
                </div>
            </div>

            {/* Trailing dash */}
            <div className="hidden lg:block w-4 md:w-6 border-t border-dashed border-gray-300 shrink-0"></div>
        </motion.div>
    )
}

/**
 * EmptyState Component
 */
const EmptyState = () => (
    <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1">No hay sesiones hoy</p>
        <p className="text-sm text-gray-400">Tu agenda está libre hoy</p>
    </div>
)

/**
 * SessionsSkeleton Component
 */
const SessionsSkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="w-10 shrink-0 text-right">
                    <div className="w-8 h-3 bg-gray-200 rounded ml-auto mb-1"></div>
                    <div className="w-5 h-2 bg-gray-100 rounded ml-auto"></div>
                </div>
                <div className="w-6 border-t border-dashed border-gray-200 shrink-0"></div>
                <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                    <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                    <div className="flex-1">
                        <div className="w-24 h-3 bg-gray-200 rounded mb-1.5"></div>
                        <div className="w-16 h-2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="hidden lg:block w-20 h-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="hidden lg:block w-6 border-t border-dashed border-gray-200 shrink-0"></div>
            </div>
        ))}
    </div>
)

/**
 * TodaysSessions Component
 */
const TodaysSessions = ({ sessions = [], loading, onJoinVideo, onViewProfile }) => {
    const [selectedSession, setSelectedSession] = useState(null)

    // Sort sessions by time
    const sortedSessions = [...sessions].sort((a, b) =>
        new Date(a.fechaHora) - new Date(b.fechaHora)
    )

    // Insert break time between 8:30-9:30 gap (after last <=9:00 session, before first >9:00 session)
    const sessionsWithBreak = []
    let breakInserted = false
    sortedSessions.forEach((session, idx) => {
        sessionsWithBreak.push(session)
        if (!breakInserted && idx < sortedSessions.length - 1) {
            const currentHour = new Date(session.fechaHora).getHours()
            const currentMin = new Date(session.fechaHora).getMinutes()
            const nextHour = new Date(sortedSessions[idx + 1].fechaHora).getHours()
            // Insert break if current session is at or before 9:00 and next one is after 9:00
            if ((currentHour < 9 || (currentHour === 9 && currentMin === 0)) && nextHour >= 9 && nextHour > currentHour) {
                sessionsWithBreak.push({ isBreak: true, time: '09:00 AM' })
                breakInserted = true
            }
        }
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
        

            {loading ? (
                <SessionsSkeleton />
            ) : sessions.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {sessionsWithBreak.map((item, index) =>
                            item.isBreak ? (
                                <BreakCard
                                    key={`break-${index}`}
                                    time={item.time}
                                    index={index}
                                />
                            ) : (
                                <SessionCard
                                    key={item.id || index}
                                    appointment={item}
                                    index={index}
                                    onClick={setSelectedSession}
                                />
                            )
                        )}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Session Details Modal */}
            {selectedSession && (
                <SessionDetailsModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onJoinVideo={onJoinVideo}
                    onAddNote={(session) => console.log('Add note for:', session)}
                    onMessage={(session) => console.log('Message:', session)}
                />
            )}
        </motion.div>
    )
}

export default TodaysSessions
