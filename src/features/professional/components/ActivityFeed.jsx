import { 
    FileText, CheckCircle2, AlertTriangle, AlertCircle, 
    XCircle, TrendingUp 
} from 'lucide-react'

/* ── Helpers ──────────────────────────────────────── */

const getTimeAgo = (timestamp) => {
    const diffMs = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMs / 3600000)
    const days = Math.floor(diffMs / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days === 1) return 'Yesterday'
    return `${days}d`
}

const ACTIVITY_CONFIG = {
    crisis_alert:         { icon: AlertTriangle, dot: 'bg-red-500' },
    mood_log:             { icon: TrendingUp,    dot: 'bg-blue-500' },
    homework_complete:    { icon: CheckCircle2,  dot: 'bg-emerald-500' },
    insurance_expiring:   { icon: AlertCircle,   dot: 'bg-amber-500' },
    appointment_cancelled:{ icon: XCircle,       dot: 'bg-gray-400' },
    outcome_improvement:  { icon: TrendingUp,    dot: 'bg-emerald-500' },
    default:              { icon: FileText,      dot: 'bg-gray-400' },
}

/* ── ActivityItem ─────────────────────────────────── */

const ActivityItem = ({ activity, isLast }) => {
    const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.default

    return (
        <div className="flex gap-3 relative">
            {/* Timeline */}
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${config.dot}`} />
                {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 leading-snug">{activity.description}</p>
                    <span className="text-xs text-gray-400 shrink-0">{getTimeAgo(activity.timestamp)}</span>
                </div>
            </div>
        </div>
    )
}

/* ── Loading & Empty ──────────────────────────────── */

const EmptyState = () => (
    <div className="text-center py-8">
        <p className="text-sm text-gray-400">No recent activity</p>
    </div>
)

const LoadingSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
            </div>
        ))}
    </div>
)

/* ── ActivityFeed ─────────────────────────────────── */

const ActivityFeed = ({ activities = [], loading }) => {
    const sorted = [...activities].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    )

    if (loading) return <LoadingSkeleton />
    if (activities.length === 0) return <EmptyState />

    return (
        <div>
            {sorted.map((activity, i) => (
                <ActivityItem 
                    key={activity.id || i} 
                    activity={activity}
                    isLast={i === sorted.length - 1}
                />
            ))}
        </div>
    )
}

export default ActivityFeed
