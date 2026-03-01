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
                className="text-white/20"
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
                className="text-white"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
            className="text-3xl md:text-4xl font-bold text-white tabular-nums leading-none"
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
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                <Minus className="w-3 h-3 text-white/70" />
                <span className="text-[10px] font-semibold text-white/70">—</span>
            </div>
        )
    }

    const diff = current - previous
    const isPositive = diff > 0
    const percentage = Math.abs((diff / previous) * 100).toFixed(0)

    return (
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${isPositive ? 'bg-white/25 text-white' : 'bg-black/20 text-white/80'}`}>
            {isPositive ? (
                <TrendingUp className="w-3 h-3" />
            ) : (
                <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-[10px] font-semibold">{percentage}%</span>
        </div>
    )
}

/**
 * StatCard Component — vivid gradient card with white text and circular progress
 */
const StatCard = ({ icon: Icon, value, label, previous, progress, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="relative group cursor-pointer"
    >
        {/* Outer glow on hover */}
        <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-40 rounded-2xl blur-xl transition-opacity duration-500 -z-10`} />

        {/* Card */}
        <div className={`relative ${gradient} rounded-2xl p-5 md:p-6 shadow-lg overflow-hidden`}>
            {/* Decorative background circles */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />

            {/* Top: Icon + Trend badge */}
            <div className="relative flex items-start justify-between mb-5">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-sm">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <TrendIndicator current={value} previous={previous} />
            </div>

            {/* Middle: Value + Circular progress */}
            <div className="relative flex items-end justify-between">
                <div className="flex flex-col gap-1">
                    <AnimatedCounter value={value} delay={delay + 0.2} />
                    <p className="text-[11px] font-semibold text-white/65 uppercase tracking-widest mt-0.5">
                        {label}
                    </p>
                </div>

                {progress !== undefined && (
                    <div className="relative mb-0.5">
                        <CircularProgress
                            percentage={progress}
                            size={54}
                            strokeWidth={4}
                            delay={delay + 0.3}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{progress}%</span>
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
                    className="relative mt-4 pt-3 border-t border-white/20 flex items-center gap-1.5 text-[11px] text-white/60"
                >
                    <span>vs previous:</span>
                    <span className="font-bold text-white/85">{previous}</span>
                </motion.div>
            )}
        </div>
    </motion.div>
)



/**
 * StatCardSkeleton Component
 * Loading placeholder for stat cards
 */
const StatCardSkeleton = () => (
    <div className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-5 md:p-6 overflow-hidden relative">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/20 rounded-full" />
        <div className="flex items-start justify-between mb-5">
            <div className="w-10 h-10 bg-white/30 rounded-xl"></div>
            <div className="w-14 h-6 bg-white/30 rounded-full"></div>
        </div>
        <div className="flex items-end justify-between">
            <div>
                <div className="w-16 h-9 bg-white/30 rounded mb-2"></div>
                <div className="w-24 h-2.5 bg-white/30 rounded"></div>
            </div>
            <div className="w-[54px] h-[54px] rounded-full bg-white/20"></div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/20">
            <div className="w-28 h-2.5 bg-white/30 rounded"></div>
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
                gradient="bg-gradient-to-br from-blue-400 to-blue-700"
                delay={0.1}
            />
            <StatCard
                icon={Calendar}
                value={stats.todaySessions || 0}
                label="Today's Sessions"
                previous={stats.completedToday || 0}
                progress={Math.round(sessionsProgress)}
                gradient="bg-gradient-to-br from-sky-300 to-teal-500"
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
