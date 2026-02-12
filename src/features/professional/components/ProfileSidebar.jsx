import { motion } from 'motion/react'
import { MessageCircle, User, Calendar, FileText } from 'lucide-react'
import { getPatientInitials } from "../dashboard/dashboardUtils"

/**
 * ActivePatientCard Component
 * Individual active patient card
 */
const ActivePatientCard = ({ patient, onClick }) => {
    const initials = getPatientInitials(patient.name || patient.nombre)
    const unreadCount = patient.unreadMessages || 0

    return (
        <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(patient)}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
        >
            <div className="relative">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {initials}
                </div>
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                    {patient.name || patient.nombre}
                </p>
                <p className="text-xs text-gray-500">
                    {patient.lastSession ? `Last: ${patient.lastSession}` : 'No sessions yet'}
                </p>
            </div>
        </motion.button>
    )
}

/**
 * ProfileSidebar Component
 * Right sidebar with user profile and active patients
 * 
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Array} props.activePatients - Array of active patients
 * @param {Function} props.onPatientClick - Handler for patient click
 * @param {Function} props.onOpenChat - Handler for opening chat
 */
const ProfileSidebar = ({ user, activePatients = [], onPatientClick, onOpenChat }) => {
    const userInitials = user?.name ? getPatientInitials(user.name) : 'DR'

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-6"
        >
            {/* User Profile Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-lg">
                        {userInitials}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-center mb-1">
                        Dr. {user?.name || user?.nombre || 'Professional'}
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                        {user?.especialidad || 'Clinical Psychologist'}
                    </p>

                    {/* Quick Stats */}
                    <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                                {activePatients.length}
                            </div>
                            <div className="text-xs text-gray-500">Patients</div>
                        </div>
                        <div className="text-center border-x border-gray-100">
                            <div className="text-lg font-bold text-gray-900">
                                {user?.sessionsToday || 0}
                            </div>
                            <div className="text-xs text-gray-500">Today</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                                {user?.rating || '5.0'}
                            </div>
                            <div className="text-xs text-gray-500">Rating</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Patients */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Active Patients</h3>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                        {activePatients.length}
                    </span>
                </div>

                {activePatients.length === 0 ? (
                    <div className="text-center py-6">
                        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No active patients</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {activePatients.slice(0, 8).map((patient) => (
                            <ActivePatientCard
                                key={patient.id}
                                patient={patient}
                                onClick={onPatientClick}
                            />
                        ))}
                    </div>
                )}

                {activePatients.length > 8 && (
                    <button className="w-full mt-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                        View All Patients
                    </button>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                    <motion.button
                        whileHover={{ x: 4 }}
                        onClick={onOpenChat}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                        <MessageCircle className="w-4 h-4 text-indigo-600" />
                        <span>Messages</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>My Schedule</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Reports</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}

export default ProfileSidebar
