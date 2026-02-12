import { motion } from 'motion/react'
import { UserPlus, Calendar, Users, BookOpen, Video, TrendingUp } from 'lucide-react'

/**
 * QuickActionButton Component
 * Individual quick action button with icon and label
 */
const QuickActionButton = ({ icon: Icon, title, bgColor, iconColor, hoverColor, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${bgColor} ${hoverColor} rounded-xl p-4 transition-all flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:shadow-md`}
    >
        <Icon className={`w-5 h-5 ${iconColor} transition-transform group-hover:scale-110`} />
        <span className="text-sm font-medium text-gray-900 text-center">{title}</span>
    </motion.button>
)

/**
 * QuickActions Component
 * Grid of quick action buttons for common tasks
 * 
 * @param {Object} props
 * @param {Function} props.onNewPatient - Handler for new patient action
 * @param {Function} props.onViewCalendar - Handler for view calendar action
 * @param {Function} props.onViewPatients - Handler for view patients action
 * @param {Function} props.onViewDiaries - Handler for view diaries action
 * @param {Function} props.onVideoCall - Handler for video call action
 * @param {Function} props.onReports - Handler for reports action
 */
const QuickActions = ({
    onNewPatient,
    onViewCalendar,
    onViewPatients,
    onViewDiaries,
    onVideoCall,
    onReports
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
                <QuickActionButton
                    icon={UserPlus}
                    title="Nuevo Paciente"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    hoverColor="hover:bg-blue-100"
                    onClick={onNewPatient}
                />
                <QuickActionButton
                    icon={Calendar}
                    title="Ver Agenda"
                    bgColor="bg-emerald-50"
                    iconColor="text-emerald-600"
                    hoverColor="hover:bg-emerald-100"
                    onClick={onViewCalendar}
                />
                <QuickActionButton
                    icon={Users}
                    title="Ver Pacientes"
                    bgColor="bg-indigo-50"
                    iconColor="text-indigo-600"
                    hoverColor="hover:bg-indigo-100"
                    onClick={onViewPatients}
                />
                <QuickActionButton
                    icon={BookOpen}
                    title="Diarios"
                    bgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    hoverColor="hover:bg-purple-100"
                    onClick={onViewDiaries}
                />
                <QuickActionButton
                    icon={Video}
                    title="Videollamadas"
                    bgColor="bg-pink-50"
                    iconColor="text-pink-600"
                    hoverColor="hover:bg-pink-100"
                    onClick={onVideoCall}
                />
                <QuickActionButton
                    icon={TrendingUp}
                    title="Reportes"
                    bgColor="bg-amber-50"
                    iconColor="text-amber-600"
                    hoverColor="hover:bg-amber-100"
                    onClick={onReports}
                />
            </div>
        </motion.div>
    )
}

export default QuickActions
