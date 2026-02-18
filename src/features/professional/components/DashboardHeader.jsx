import { motion, AnimatePresence } from 'motion/react'
import { Clock, Plus, AlertTriangle, Phone, Bell, Search } from 'lucide-react'
import { getGreeting, formatDate, formatTime } from "../dashboard/dashboardUtils"
import { Calendar } from 'lucide-react'
/**
 * DashboardHeader Component
 * Displays greeting, date/time, and action buttons
 * 
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Date} props.currentTime - Current time for real-time clock
 * @param {string} props.error - Error message to display
 * @param {Function} props.onNewPatient - Handler for new patient button
 * @param {Function} props.onClearError - Handler to clear error
 * @param {Array} props.highRiskPatients - Array of high-risk patients for crisis alerts
 */
const DashboardHeader = ({ user, currentTime, error, onNewPatient, onClearError, highRiskPatients = [] }) => {
    const userName = user?.name?.split(' ')[0] || user?.nombre || 'Doctor'
    const hasCrisisAlert = highRiskPatients && highRiskPatients.length > 0

    // Get user initials
    const getInitials = () => {
        if (!user) return '?'
        if (user.nombre && user.apellido) {
            return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
        }
        if (user.name) {
            const parts = user.name.split(' ')
            return parts.length > 1 
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : user.name.substring(0, 2).toUpperCase()
        }
        return user.email ? user.email[0].toUpperCase() : '?'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
        >
            {/* Crisis Alert Banner - Priority display */}
            <AnimatePresence>
                {hasCrisisAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 bg-linear-to-r from-rose-50 to-red-50 border-l-4 border-rose-500 rounded-2xl p-4 shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-500 rounded-xl shrink-0">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-rose-900 mb-1">
                                    Crisis Alert: {highRiskPatients.length} High-Risk {highRiskPatients.length === 1 ? 'Patient' : 'Patients'}
                                </h3>
                                <p className="text-xs text-rose-700 mb-2">
                                    {highRiskPatients.map(p => p.name).join(', ')} - Review safety plans before sessions
                                </p>
                                <div className="flex items-center gap-3">
                                    <a href="tel:988" className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>988 Suicide Hotline</span>
                                    </a>
                                    <span className="text-gray-300">|</span>
                                    <a href="tel:911" className="text-xs font-semibold text-rose-700 hover:text-rose-900">
                                        911 Emergency
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Header Row - Greeting on left, Search/Actions on right */}
            <div className="flex items-start justify-between gap-6">
                {/* Left Side - Greeting and Date */}
                <div className="flex-1">
                    <h1 className="text-base text-gray-500 mb-1">{getGreeting(currentTime)},</h1>
                    <p className="text-4xl font-bold text-gray-900 mb-3">
                        Dr. {userName}! 
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Calendar className='w-4 h-4' />
                            <span>{formatDate(currentTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(currentTime)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Search Bar + Actions */}
                <div className="hidden lg:flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar"
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
                        />
                    </div>

                    {/* Notification Bell */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-2xl flex items-center justify-center shadow-md transition-colors shrink-0"
                    >
                        <Bell className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* User Profile Circle */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white text-base font-bold cursor-pointer shadow-md shrink-0"
                    >
                        {getInitials()}
                    </motion.div>
                </div>
            </div>

            {/* New Patient Button Row */}
            <div className="mt-6 flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNewPatient}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-2xl shadow-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Paciente</span>
                </motion.button>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
                    >
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900">{error}</p>
                        </div>
                        <button onClick={onClearError} className="text-amber-600 hover:text-amber-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default DashboardHeader
