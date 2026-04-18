import { motion } from 'motion/react'
import {
    Users, CalendarCheck, TrendingUp, DollarSign,
    ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

/**
 * Four KPI stat cards displayed in a responsive 2→4 column grid.
 *
 * @param {object} props
 * @param {object} props.stats             - Dashboard stats from useDashboardData
 * @param {Array}  props.todayAppointments - Today's appointment list (for session count)
 * @param {object} props.mockRevenue       - Revenue snapshot { thisMonth, lastMonth, ... }
 * @param {number} props.monthGrowth       - Patient growth % (can be negative)
 * @param {number} props.revenueGrowth     - Revenue growth % vs last month
 */
const StatsCards = ({ stats, todayAppointments, mockRevenue, monthGrowth, revenueGrowth }) => {
    const cards = [
        {
            label: 'Pacientes activos',
            labelShort: 'Pacientes',
            value: stats.totalPatients || 0,
            icon: Users,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50',
            trend: monthGrowth,
            delay: 0.1,
        },
        {
            label: 'Sesiones hoy',
            labelShort: 'Hoy',
            value: todayAppointments.length,
            icon: CalendarCheck,
            iconColor: 'text-sky-600',
            iconBg: 'bg-sky-50',
            trend: null,
            delay: 0.15,
        },
        {
            label: 'Completadas semana',
            labelShort: 'Semana',
            value: stats.completedThisWeek || 0,
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50',
            trend: stats.weekAppointments > 0
                ? Math.round((stats.completedThisWeek / stats.weekAppointments) * 100) - 80
                : null,
            delay: 0.2,
        },
        {
            label: 'Ingreso mensual',
            labelShort: 'Ingreso mensual',
            value: `$${mockRevenue.thisMonth.toLocaleString()}`,
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50',
            trend: revenueGrowth,
            delay: 0.25,
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            {cards.map((card) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay, duration: 0.25 }}
                    className="bg-white rounded-xl px-3 py-2 border border-gray-200 flex items-center gap-2.5 hover:shadow-md transition-shadow cursor-default shadow-sm"
                >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                        <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 leading-none">{card.value}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5 truncate leading-none">
                            <span className="sm:hidden">{card.labelShort}</span>
                            <span className="hidden sm:inline">{card.label}</span>
                        </p>
                    </div>

                    {card.trend !== null && card.trend !== undefined && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${
                            card.trend > 0
                                ? 'text-emerald-600'
                                : card.trend < 0
                                    ? 'text-rose-500'
                                    : 'text-gray-400'
                        }`}>
                            {card.trend > 0
                                ? <ArrowUpRight className="w-3 h-3" />
                                : card.trend < 0
                                    ? <ArrowDownRight className="w-3 h-3" />
                                    : <Minus className="w-3 h-3" />
                            }
                            {Math.abs(card.trend)}%
                        </span>
                    )}
                </motion.div>
            ))}
        </div>
    )
}

export default StatsCards
