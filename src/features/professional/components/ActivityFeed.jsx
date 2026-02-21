import { motion } from 'motion/react'
import { FileText, UserCheck, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle, TrendingDown, AlertCircle } from 'lucide-react'
import { formatDate } from '../dashboard/dashboardUtils'

/**
 * Get initials from name
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
const getTimeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours === 1) return 'hace 1h'
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `hace ${diffDays}d`
    if (diffWeeks === 1) return 'hace 1 sem'
    return `hace ${diffWeeks} sem`
}

/**
 * Get activity icon and styling based on type and priority
 */
const getActivityStyle = (type, priority) => {
    const styles = {
        crisis_alert: {
            icon: AlertTriangle,
            iconBg: 'bg-rose-500',
            iconColor: 'text-white',
            border: 'border-l-4 border-rose-500'
        },
        mood_log: {
            icon: TrendingUp,
            iconBg: 'bg-blue-500',
            iconColor: 'text-white',
            border: priority === 'high' ? 'border-l-4 border-blue-500' : ''
        },
        homework_complete: {
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500',
            iconColor: 'text-white',
            border: ''
        },
        insurance_expiring: {
            icon: AlertCircle,
            iconBg: 'bg-amber-500',
            iconColor: 'text-white',
            border: 'border-l-4 border-amber-500'
        },
        appointment_cancelled: {
            icon: XCircle,
            iconBg: 'bg-gray-500',
            iconColor: 'text-white',
            border: 'border-l-4 border-gray-400'
        },
        outcome_improvement: {
            icon: TrendingUp,
            iconBg: 'bg-emerald-500',
            iconColor: 'text-white',
            border: ''
        },
        default: {
            icon: FileText,
            iconBg: 'bg-indigo-500',
            iconColor: 'text-white',
            border: ''
        }
    }
    
    return styles[type] || styles.default
}

/**
 * ActivityItem Component
 * Individual activity feed item with clinical styling
 */
const ActivityItem = ({ activity, index, total }) => {
    const patientName = activity.patientName || activity.description?.split('-')[0]?.trim() || 'Activity'
    const activityStyle = getActivityStyle(activity.type, activity.priority)
    const Icon = activityStyle.icon
    
    // Format time
    const timeAgo = getTimeAgo(activity.timestamp)
    
    // Background based on priority
    const bgColor = activity.priority === 'high' 
        ? 'bg-rose-50/50' 
        : activity.priority === 'medium'
        ? 'bg-amber-50/30'
        : 'bg-white'
    
    // Avatar colors
    const avatarColors = [
        'bg-amber-200 text-amber-800',
        'bg-blue-200 text-blue-800',
        'bg-purple-200 text-purple-800',
        'bg-emerald-200 text-emerald-800',
        'bg-pink-200 text-pink-800'
    ]
    const avatarColor = avatarColors[index % avatarColors.length]

    return (
        <div className="relative">
            {/* Timeline connector */}
            {index < total - 1 && (
                <div className="absolute left-4.5 top-full w-px h-4 border-l-2 border-dashed border-gray-200"></div>
            )}
            
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`flex items-start gap-3 p-3 rounded-xl ${bgColor} ${activityStyle.border} hover:shadow-md transition-all cursor-pointer group mb-1`}
            >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg ${activityStyle.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className={`w-4 h-4 ${activityStyle.iconColor}`} strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-xs leading-tight">{activity.title}</h3>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">{timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug wrap-break-word">
                        {activity.description}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

/**
 * EmptyState Component
 * Display when no recent activity
 */
const EmptyState = () => (
    <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1">Sin actividad reciente</p>
        <p className="text-sm text-gray-400">La actividad aparecerá aquí</p>
    </div>
)

/**
 * ActivitySkeleton Component
 * Loading state for activity feed
 */
const ActivitySkeleton = () => (
    <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 animate-pulse">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
        ))}
    </div>
)

/**
 * ActivityFeed Component
 * Display recent activity/events feed
 * 
 * @param {Object} props
 * @param {Array} props.activities - Array of recent activities
 * @param {boolean} props.loading - Loading state
 */
const ActivityFeed = ({ activities = [], loading }) => {
    // Sort activities by timestamp (most recent first)
    const sortedActivities = [...activities].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    )

    if (loading) {
        return <ActivitySkeleton />
    }

    if (activities.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="space-y-4">
            {sortedActivities.map((activity, index) => (
                <ActivityItem 
                    key={activity.id || index} 
                    activity={activity}
                    index={index}
                    total={sortedActivities.length}
                />
            ))}
        </div>
    )
}

export default ActivityFeed
