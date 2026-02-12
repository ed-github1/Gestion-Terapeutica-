import { motion } from 'motion/react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * ProgressCard Component
 * Individual progress metric card
 */
const ProgressCard = ({ title, current, previous, unit = '', delay = 0 }) => {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const isPositive = change > 0
    const isNeutral = change === 0

    const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
    const trendColor = isNeutral ? 'text-gray-500' : isPositive ? 'text-emerald-600' : 'text-red-600'
    const trendBg = isNeutral ? 'bg-gray-50' : isPositive ? 'bg-emerald-50' : 'bg-red-50'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{title}</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trendBg}`}>
                    <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                    <span className={`text-xs font-semibold ${trendColor}`}>
                        {Math.abs(change).toFixed(0)}%
                    </span>
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
                {current}{unit}
            </div>
            <div className="text-xs text-gray-400 mt-1">
                Previous: {previous}{unit}
            </div>
        </motion.div>
    )
}

/**
 * ProgressSummarySkeleton Component
 * Loading state for progress summary
 */
const ProgressSummarySkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                    <div className="w-24 h-4 bg-gray-100 rounded"></div>
                    <div className="w-12 h-6 bg-gray-100 rounded-full"></div>
                </div>
                <div className="w-16 h-8 bg-gray-100 rounded mb-1"></div>
                <div className="w-20 h-3 bg-gray-100 rounded"></div>
            </div>
        ))}
    </div>
)

/**
 * ProgressSummary Component
 * Weekly progress comparison metrics
 * 
 * @param {Object} props
 * @param {Object} props.progress - Progress data object
 * @param {boolean} props.loading - Loading state
 */
const ProgressSummary = ({ progress, loading }) => {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h2>
                <ProgressSummarySkeleton />
            </motion.div>
        )
    }

    const progressData = progress || {
        sessionsCompleted: { current: 0, previous: 0 },
        newPatients: { current: 0, previous: 0 },
        diaryEntries: { current: 0, previous: 0 },
        avgSessionDuration: { current: 0, previous: 0 }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h2>
            <div className="grid grid-cols-1 gap-3">
                <ProgressCard
                    title="Sessions Completed"
                    current={progressData.sessionsCompleted.current}
                    previous={progressData.sessionsCompleted.previous}
                    delay={0.85}
                />
                <ProgressCard
                    title="New Patients"
                    current={progressData.newPatients.current}
                    previous={progressData.newPatients.previous}
                    delay={0.9}
                />
                <ProgressCard
                    title="Diary Entries"
                    current={progressData.diaryEntries.current}
                    previous={progressData.diaryEntries.previous}
                    delay={0.95}
                />
                <ProgressCard
                    title="Avg. Duration"
                    current={progressData.avgSessionDuration.current}
                    previous={progressData.avgSessionDuration.previous}
                    unit=" min"
                    delay={1.0}
                />
            </div>
        </motion.div>
    )
}

export default ProgressSummary
