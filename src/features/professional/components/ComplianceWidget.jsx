import { motion } from 'motion/react'
import { Shield, Award, FileCheck, Clock, AlertCircle } from 'lucide-react'

/**
 * ComplianceItem Component
 */
const ComplianceItem = ({ icon: Icon, label, value, status, daysRemaining, delay = 0 }) => {
    // Status colors
    const statusColors = {
        good: 'text-emerald-600 bg-emerald-50',
        warning: 'text-amber-600 bg-amber-50',
        urgent: 'text-rose-600 bg-rose-50'
    }
    
    const statusColor = statusColors[status] || statusColors.good

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
        >
            <div className={`p-2 rounded-lg ${statusColor}`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 mb-0.5">{label}</p>
                <p className="text-[11px] text-gray-500">{value}</p>
            </div>
            
            {daysRemaining !== undefined && (
                <div className={`text-right shrink-0`}>
                    <p className={`text-xs font-bold ${status === 'urgent' ? 'text-rose-600' : status === 'warning' ? 'text-amber-600' : 'text-gray-600'}`}>
                        {daysRemaining}
                    </p>
                    <p className="text-[10px] text-gray-400">days</p>
                </div>
            )}
        </motion.div>
    )
}

/**
 * ComplianceWidget Component
 * Shows license status, CEU credits, and other compliance requirements
 */
const ComplianceWidget = ({ compliance = {} }) => {
    // Mock compliance data if not provided
    const {
        licenseExpiration = new Date('2026-12-31'),
        licenseNumber = 'PSY-12345',
        ceuCreditsRequired = 40,
        ceuCreditsEarned = 28,
        supervisionHoursRequired = 0,
        supervisionHoursCompleted = 0,
        informedConsentExpirations = 3
    } = compliance

    // Calculate days until license expiration
    const daysUntilExpiration = Math.floor((new Date(licenseExpiration) - new Date()) / (1000 * 60 * 60 * 24))
    const licenseStatus = daysUntilExpiration < 30 ? 'urgent' : daysUntilExpiration < 90 ? 'warning' : 'good'

    // Calculate CEU progress
    const ceuProgress = (ceuCreditsEarned / ceuCreditsRequired) * 100
    const ceuStatus = ceuProgress < 50 ? 'warning' : ceuProgress < 75 ? 'warning' : 'good'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-indigo-100 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                <h2 className="text-sm md:text-base font-bold text-gray-900">Compliance Status</h2>
            </div>

            <div className="space-y-2">
                {/* License Expiration */}
                <ComplianceItem
                    icon={Shield}
                    label="License Renewal"
                    value={licenseNumber}
                    status={licenseStatus}
                    daysRemaining={daysUntilExpiration}
                    delay={0.1}
                />

                {/* CEU Credits */}
                <ComplianceItem
                    icon={Award}
                    label="CEU Credits"
                    value={`${ceuCreditsEarned} / ${ceuCreditsRequired} completed`}
                    status={ceuStatus}
                    delay={0.2}
                />

                {/* Informed Consent */}
                {informedConsentExpirations > 0 && (
                    <ComplianceItem
                        icon={FileCheck}
                        label="Consent Forms"
                        value={`${informedConsentExpirations} expiring soon`}
                        status="warning"
                        delay={0.3}
                    />
                )}

                {/* Supervision Hours (if applicable) */}
                {supervisionHoursRequired > 0 && (
                    <ComplianceItem
                        icon={Clock}
                        label="Supervision Hours"
                        value={`${supervisionHoursCompleted} / ${supervisionHoursRequired} logged`}
                        status={supervisionHoursCompleted >= supervisionHoursRequired ? 'good' : 'warning'}
                        delay={0.4}
                    />
                )}
            </div>

            {/* Quick Action */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
                <Shield className="w-4 h-4" />
                <span>View Full Compliance Report</span>
            </motion.button>
        </motion.div>
    )
}

export default ComplianceWidget
