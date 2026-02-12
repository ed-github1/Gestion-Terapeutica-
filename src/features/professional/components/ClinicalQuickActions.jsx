import { motion } from 'motion/react'
import { Video, FileText, MessageSquare, Phone, AlertCircle, ClipboardList } from 'lucide-react'

/**
 * QuickActionButton Component
 */
const QuickActionButton = ({ icon: Icon, label, color, onClick, delay = 0 }) => {
    const colorClasses = {
        indigo: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200',
        emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
        amber: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
        rose: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200',
        gray: 'bg-gray-500 hover:bg-gray-600 shadow-gray-200',
        purple: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200'
    }

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-4 ${colorClasses[color]} text-white rounded-xl shadow-lg transition-all`}
        >
            <Icon className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-center leading-tight">{label}</span>
        </motion.button>
    )
}

/**
 * ClinicalQuickActions Component
 * Panel with quick access to clinical tasks
 */
const ClinicalQuickActions = ({ onAction }) => {
    const actions = [
        {
            icon: Video,
            label: 'Start Session',
            color: 'indigo',
            action: 'start_video'
        },
        {
            icon: FileText,
            label: 'Add Note',
            color: 'gray',
            action: 'add_note'
        },
        {
            icon: MessageSquare,
            label: 'Message Patient',
            color: 'emerald',
            action: 'message'
        },
        {
            icon: ClipboardList,
            label: 'Assessment',
            color: 'purple',
            action: 'assessment'
        },
        {
            icon: Phone,
            label: 'Crisis Hotline',
            color: 'rose',
            action: 'crisis_hotline'
        },
        {
            icon: AlertCircle,
            label: 'Safety Plan',
            color: 'amber',
            action: 'safety_plan'
        }
    ]

    const handleAction = (actionType) => {
        if (actionType === 'crisis_hotline') {
            window.open('tel:988', '_blank')
        } else if (onAction) {
            onAction(actionType)
        } else {
            console.log(`Action: ${actionType}`)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm"
        >
            <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {actions.map((action, index) => (
                    <QuickActionButton
                        key={action.action}
                        icon={action.icon}
                        label={action.label}
                        color={action.color}
                        onClick={() => handleAction(action.action)}
                        delay={0.1 + index * 0.05}
                    />
                ))}
            </div>
        </motion.div>
    )
}

export default ClinicalQuickActions
