import { motion } from 'motion/react'
import { Users, Calendar, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Circular Progress Ring Component
 */
const CircularProgress = ({ percentage, size = 80, strokeWidth = 6, delay = 0 }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                className="text-gray-100"
            />
            {/* Progress circle */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                className="text-indigo-500"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    strokeDasharray: circumference,
                }}
            />
        </svg>
    )
}

/**
 * Animated Counter Component
 */
const AnimatedCounter = ({ value, delay = 0 }) => {
    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 tabular-nums"
        >
            {value}
        </motion.span>
    )
}

/**
 * Trend Indicator Component
 */
const TrendIndicator = ({ current, previous }) => {
    if (!previous || current === previous) {
        return (
            <div className="flex items-center gap-1 text-gray-400">
                <Minus className="w-3 h-3" />
                <span className="text-xs font-medium">No change</span>
            </div>
        )
    }

    const diff = current - previous
    const isPositive = diff > 0
    const percentage = Math.abs((diff / previous) * 100).toFixed(0)

    return (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? (
                <TrendingUp className="w-3 h-3" />
            ) : (
                <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-semibold">{percentage}%</span>
        </div>
    )
}

/**
 * StatCard Component - Reimagined with circular progress and gradients
 */
const StatCard = ({ icon: Icon, value, label, previous, progress, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.03, y: -4 }}
        className="relative group cursor-pointer"
    >
        {/* Gradient background blob */}
        <div className={`absolute inset-0 ${gradient} opacity-10 rounded-3xl blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
        
        {/* Card content */}
        <div className="relative bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 overflow-hidden group-hover:shadow-lg transition-all duration-300">
            {/* Top section: Icon and trend */}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10`}>
                    <Icon className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                </div>
                <TrendIndicator current={value} previous={previous} />
            </div>

            {/* Middle: Circular progress with value */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <AnimatedCounter value={value} delay={delay + 0.2} />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                        {label}
                    </p>
                </div>
                
                {progress !== undefined && (
                    <div className="relative">
                        <CircularProgress 
                            percentage={progress} 
                            size={60} 
                            strokeWidth={5}
                            delay={delay + 0.3}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">{progress}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Previous value comparison */}
            {previous !== undefined && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.5 }}
                    className="text-xs text-gray-400 flex items-center gap-1"
                >
                    <span>vs last period:</span>
                    <span className="font-semibold text-gray-600">{previous}</span>
                </motion.div>
            )}

            {/* Hover glow effect */}
            <div className={`absolute -inset-1 ${gradient} opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-opacity duration-500 -z-10`}></div>
        </div>
    </motion.div>
)



/**
 * StatCardSkeleton Component
 * Loading placeholder for stat cards
 */
const StatCardSkeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
            <div className="w-12 h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <div className="w-20 h-10 bg-gray-100 rounded mb-2"></div>
                <div className="w-24 h-3 bg-gray-100 rounded"></div>
            </div>
            <div className="w-14 h-14 rounded-full bg-gray-100"></div>
        </div>
    </div>
)

/**
 * DashboardStats Component
 * Grid of statistics cards showing key metrics
 * 
 * @param {Object} props
 * @param {Object} props.stats - Statistics object
 * @param {boolean} props.loading - Loading state
 */
const DashboardStats = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
                {[...Array(4)].map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    // Calculate progress percentages and clinical metrics
    const activePatientsProgress = stats.totalPatients ? Math.min((stats.activePatients / stats.totalPatients) * 100, 100) : 0
    const sessionsProgress = stats.todaySessions ? Math.min((stats.completedToday / stats.todaySessions) * 100, 100) : 0
    const notesProgress = stats.pendingNotes ? Math.max(100 - ((stats.pendingNotes / 20) * 100), 0) : 100 // Inverse: fewer pending = better
    const utilizationProgress = stats.weeklyCapacity ? (stats.weekSessions?.completed / stats.weeklyCapacity) * 100 : 0

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8"
        >
            <StatCard
                icon={Users}
                value={stats.activePatients || stats.totalPatients || 0}
                label="Active Caseload"
                previous={stats.previousActivePatients}
                progress={Math.round(activePatientsProgress)}
                gradient="bg-gradient-to-br from-blue-400 to-indigo-600"
                delay={0.1}
            />
            <StatCard
                icon={Calendar}
                value={stats.todaySessions || 0}
                label="Today's Sessions"
                previous={stats.completedToday || 0}
                progress={Math.round(sessionsProgress)}
                gradient="bg-gradient-to-br from-purple-400 to-pink-600"
                delay={0.2}
            />
            <StatCard
                icon={FileText}
                value={stats.pendingNotes || 0}
                label="Pending Notes"
                previous={stats.previousPendingNotes}
                progress={Math.round(notesProgress)}
                gradient="bg-gradient-to-br from-amber-400 to-orange-600"
                delay={0.3}
            />
            <StatCard
                icon={TrendingUp}
                value={`${Math.round(utilizationProgress)}%`}
                label="Week Utilization"
                previous={stats.previousUtilization}
                progress={Math.round(utilizationProgress)}
                gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
                delay={0.4}
            />
        </motion.div>
    )
}

export default DashboardStats
