import { motion, AnimatePresence } from 'motion/react'
import { X, Video, Phone, MessageSquare, FileText, AlertTriangle, CheckCircle2, Clock, Calendar, Target, TrendingUp, Shield } from 'lucide-react'

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
const SessionDetailsModal = ({ session, onClose, onJoinVideo, onAddNote, onMessage }) => {
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
        if (onJoinVideo) onJoinVideo(session)
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className={`w-16 h-16 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xl shadow-lg relative`}>
                                {getInitials(patientName)}
                                {homeworkComplete && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">{patientName}</h2>
                                <div className="flex items-center gap-3 text-sm text-white/90">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{timeStr} - {endTimeStr}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{startTime.toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Badge */}
                            {riskLevel === 'high' && (
                                <div className="flex items-center gap-1.5 bg-rose-500 px-3 py-1.5 rounded-full text-sm font-semibold">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>High Risk</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStartSession}
                                className="flex flex-col items-center gap-2 p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg transition-colors"
                            >
                                <Video className="w-6 h-6" />
                                <span className="text-sm font-semibold">Start Session</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddNote}
                                className="flex flex-col items-center gap-2 p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl shadow-lg transition-colors"
                            >
                                <FileText className="w-6 h-6" />
                                <span className="text-sm font-semibold">Add Note</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleMessage}
                                className="flex flex-col items-center gap-2 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-colors"
                            >
                                <MessageSquare className="w-6 h-6" />
                                <span className="text-sm font-semibold">Message</span>
                            </motion.button>
                        </div>

                        {/* Today's Goal */}
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-gray-900">Today's Goal</h3>
                            </div>
                            <p className="text-gray-700 text-sm">{todayGoal}</p>
                        </div>

                        {/* Last Session Notes */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <h3 className="font-bold text-gray-900">Previous Session Notes</h3>
                            </div>
                            <p className="text-gray-700 text-sm">{lastNote}</p>
                        </div>

                        {/* Clinical Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Insurance */}
                            {insuranceSessions !== null && (
                                <div className={`p-4 rounded-xl border ${insuranceSessions <= 3 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className={`w-4 h-4 ${insuranceSessions <= 3 ? 'text-amber-600' : 'text-gray-600'}`} />
                                        <h4 className="text-xs font-semibold text-gray-600 uppercase">Insurance</h4>
                                    </div>
                                    <p className={`text-2xl font-bold ${insuranceSessions <= 3 ? 'text-amber-700' : 'text-gray-900'}`}>
                                        {insuranceSessions}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">sessions remaining</p>
                                </div>
                            )}

                            {/* Homework Status */}
                            <div className={`p-4 rounded-xl border ${homeworkComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className={`w-4 h-4 ${homeworkComplete ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase">Homework</h4>
                                </div>
                                <p className={`text-lg font-bold ${homeworkComplete ? 'text-emerald-700' : 'text-gray-500'}`}>
                                    {homeworkComplete ? 'Completed' : 'Pending'}
                                </p>
                            </div>
                        </div>

                        {/* Risk Alert */}
                        {riskLevel === 'high' && (
                            <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-rose-900 mb-1">Safety Alert</h4>
                                        <p className="text-sm text-rose-700">This patient is marked as high risk. Review safety plan before session.</p>
                                        <div className="flex gap-3 mt-3">
                                            <a href="tel:988" className="text-sm font-semibold text-rose-700 hover:text-rose-900">
                                                📞 988 Crisis Line
                                            </a>
                                            <a href="tel:911" className="text-sm font-semibold text-rose-700 hover:text-rose-900">
                                                🚨 911 Emergency
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default SessionDetailsModal
