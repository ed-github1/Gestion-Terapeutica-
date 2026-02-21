import { motion } from 'motion/react'
import { X, FileText, MessageSquare, Clock, Target, AlertTriangle, BookOpen } from 'lucide-react'

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
 * SessionDetailsModal Component
 * Shows comprehensive clinical information for a selected session
 */
const SessionDetailsModal = ({ session, onClose, onJoinVideo, onAddNote, onMessage, onViewDiary }) => {
    if (!session) return null

    const patientName = session.nombrePaciente || session.patient?.name || 'Unknown Patient'
    const riskLevel = session.riskLevel || 'low'
    const homeworkComplete = session.homeworkCompleted !== false
    const insuranceSessions = session.insuranceSessionsRemaining || null
    const todayGoal = session.treatmentGoal || 'Continue treatment plan'
    const lastNote = session.lastSessionNote || 'No previous notes'
    
    const startTime = new Date(session.fechaHora)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    
    // Avatar color based on name
    const avatarColors = [
        'bg-orange-200 text-orange-900',
        'bg-indigo-200 text-indigo-900',
        'bg-emerald-200 text-emerald-900',
        'bg-pink-200 text-pink-900',
        'bg-purple-200 text-purple-900'
    ]
    const avatarColor = avatarColors[patientName.length % avatarColors.length]

    const handleStartSession = () => {
        console.log('handleStartSession called, session:', session)
        if (onJoinVideo) {
            console.log('Calling onJoinVideo with session')
            onJoinVideo(session)
        }
        onClose()
    }

    const handleAddNote = () => {
        if (onAddNote) onAddNote(session)
        onClose()
    }

    const handleMessage = () => {
        if (onMessage) onMessage(session)
        onClose()
    }

    const handleViewDiary = () => {
        if (onViewDiary) onViewDiary(session)
        onClose()
    }

    return (
        <>
            {/* Backdrop — fades independently */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Centering shell — no pointer events so backdrop click still works */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                {/* Panel — shared layout element that morphs from the pill card */}
                <motion.div
                    layoutId={`session-pill-${session.id || session.fechaHora}`}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Inner content fades in after the layout morph begins */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: 0.08 }}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-5 border-b border-gray-100">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>

                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-xl ${avatarColor} flex items-center justify-center font-bold text-sm shadow-sm relative`}>
                                {getInitials(patientName)}
                                {homeworkComplete && (
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-gray-900 truncate">{patientName}</h2>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{timeStr} - {endTimeStr}</span>
                                </div>
                            </div>

                            {/* Risk Badge */}
                            {riskLevel === 'high' && (
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Prep actions — equal weight, full row */}
                        <div className="grid grid-cols-3 gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleViewDiary}
                                className="flex flex-col items-center gap-1.5 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span className="text-[11px] font-semibold">Expediente</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddNote}
                                className="flex flex-col items-center gap-1.5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors"
                            >
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-[11px] font-medium">Añadir nota</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleMessage}
                                className="flex flex-col items-center gap-1.5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors"
                            >
                                <MessageSquare className="w-4 h-4 text-gray-500" />
                                <span className="text-[11px] font-medium">Mensaje</span>
                            </motion.button>
                        </div>

                        {/* Today's Goal */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Objetivo de Hoy</h3>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{todayGoal}</p>
                        </div>

                        {/* Last Note */}
                        {lastNote !== 'No previous notes' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Última Nota</h3>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{lastNote}</p>
                            </div>
                        )}

                        {/* Metrics Row */}
                        <div className="flex gap-3 pt-2">
                            {/* Homework */}
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${homeworkComplete ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                <span className={homeworkComplete ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                                    Tarea {homeworkComplete ? 'completa' : 'pendiente'}
                                </span>
                            </div>

                            {/* Insurance */}
                            {insuranceSessions !== null && (
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${insuranceSessions <= 3 ? 'bg-amber-500' : 'bg-blue-400'}`}></div>
                                    <span className={insuranceSessions <= 3 ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                        {insuranceSessions} sesiones restantes
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Risk Alert */}
                        {riskLevel === 'high' && (
                            <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                <div className="text-xs text-rose-700 leading-relaxed">
                                    <span className="font-semibold">Paciente de alto riesgo.</span> Revisar plan de seguridad antes de la sesión.
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
                </motion.div>
            </div>
        </>
    )
}

export default SessionDetailsModal
