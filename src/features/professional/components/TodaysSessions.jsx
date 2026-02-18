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
    
    // Simpler responsive width - let it flow naturally
    const position = isRightAligned ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'

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
                    className={`${position} relative shrink-0 cursor-pointer min-w-0 w-full`}
                    onClick={() => onClick(appointment)}
                >
                    <div className={`flex items-center gap-1.5 md:gap-2 ${bgColor} ${riskLevel === 'high' ? 'ring-2 ring-rose-200' : ''} rounded-xl md:rounded-2xl px-2 md:px-3 py-1.5 md:py-2 transition-all hover:shadow-md hover:scale-[1.02] min-w-0 w-full`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full ${avatarColor} flex items-center justify-center font-bold text-[9px] md:text-xs shrink-0 shadow-sm relative`}>
                            {getInitials(patientName)}
                            {/* Homework completion badge - subtle */}
                            {homeworkComplete && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full border border-white"></div>
                            )}
                        </div>

                        {/* Info - with proper flex and truncation */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1 mb-0.5">
                                <Video className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-500 shrink-0" />
                                <h3 className="font-bold text-gray-900 text-[10px] md:text-xs leading-tight truncate">{patientName}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-[8px] md:text-[9px] text-gray-400">
                                <Clock className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
                                <span className="truncate">{timeRange}</span>
                            </div>
                        </div>

                        {/* Visit badge - hide on smaller screens */}
                        <div className="hidden xl:flex bg-white/70 border border-gray-200 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-[9px] text-gray-400 font-medium italic whitespace-nowrap shrink-0">
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
 * AvailableSlotCard Component
 * Gray/blue pill showing unavailable time slot (not in schedule) or break time
 */
const AvailableSlotCard = ({ slot, index }) => {
    const startTime = new Date(slot.fechaHora)
    const hours = startTime.getHours()
    const minutes = startTime.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const timeStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

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

            {/* Unavailable slot container - full width */}
            <div className="flex-1 flex items-center">
                {/* Unavailable pill - full width with stripes */}
                <div className="flex-1 relative overflow-hidden bg-gray-400/60 rounded-full px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-center">
                    {/* Diagonal stripes overlay */}
                    <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, white 3px, white 5px)'
                        }}
                    ></div>
                    <span className="relative text-white font-semibold text-xs md:text-sm">No Disponible</span>
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
    
    console.log('TodaysSessions - Received sessions count:', sessions.length)
    console.log('TodaysSessions - Session times order:', sessions.map(s => {
        const date = new Date(s.fechaHora)
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    }))

    // Use sessions as-is - they're already sorted from parent
    const sortedSessions = sessions

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
                        {sortedSessions.map((item, index) =>
                            item.isBreak ? (
                                <BreakCard
                                    key={`break-${index}`}
                                    time={item.time}
                                    index={index}
                                />
                            ) : item.isUnavailable ? (
                                <AvailableSlotCard
                                    key={item.id || index}
                                    slot={item}
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
