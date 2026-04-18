import { motion } from 'motion/react'
import { Clock, Users, CalendarCheck, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '../../utils/dashboardUtils'
import { ROUTES } from '@shared/constants/routes'

/**
 * Unified single-row top bar: name/greeting (left) · 4 KPI pills (center) · actions (right).
 * Replaces the old stacked header + separate StatsCards row.
 */
const DashboardHeader = ({
    currentTime, userName, initials,
    // stats props (forwarded from ModernProfessionalDashboard)
    stats, todayAppointments, mockRevenue, monthGrowth, revenueGrowth,
}) => {
    const navigate = useNavigate()

    const hour = currentTime.getHours()
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

    const kpis = [
        {
            label: 'Pacientes',
            sub: 'activos',
            value: stats?.totalPatients ?? 0,
            icon: Users,
            iconCls: 'text-blue-500',
            bg: 'bg-blue-50',
            trend: monthGrowth,
            trendPos: (monthGrowth ?? 0) > 0,
        },
        {
            label: 'Semana',
            sub: 'completadas',
            value: stats?.completedThisWeek ?? 0,
            icon: TrendingUp,
            iconCls: 'text-teal-600',
            bg: 'bg-teal-50',
            trend: null,
        },
        {
            label: 'Ingreso mensual',
            sub: 'de citas',
            value: `$${(mockRevenue?.thisMonth ?? 0).toLocaleString()}`,
            icon: DollarSign,
            iconCls: 'text-amber-500',
            bg: 'bg-amber-50',
            trend: revenueGrowth,
            trendPos: (revenueGrowth ?? 0) > 0,
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-3 mb-3 flex-wrap xl:flex-nowrap"
        >
       
            {/* ── Divider ── */}
            <div className="hidden xl:block w-px h-8 bg-gray-200 shrink-0" />

            {/* ── Center: 4 KPI pills ── */}
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                {kpis.map((k) => (
                    <div
                        key={k.label}
                        className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex-1 min-w-[110px] hover:shadow-sm transition-shadow cursor-default"
                    >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${k.bg}`}>
                            <k.icon className={`w-3.5 h-3.5 ${k.iconCls}`} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 leading-none">{k.value}</p>
                            <p className="text-[10px] text-gray-400 leading-none mt-1">{k.label} · {k.sub}</p>
                        </div>
                        {/* Always render a fixed-width slot so all pills stay the same width */}
                        <div className="w-10 flex justify-end shrink-0">
                            {k.trend != null ? (
                                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${
                                    k.trendPos ? 'text-emerald-600' : 'text-rose-500'
                                }`}>
                                    {k.trendPos
                                        ? <ArrowUpRight className="w-3 h-3" />
                                        : <ArrowDownRight className="w-3 h-3" />
                                    }
                                    {Math.abs(k.trend)}%
                                </span>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Divider ── */}
            <div className="hidden xl:block w-px h-8 bg-gray-200 shrink-0" />
     {/* ── Left: Identity ── */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={() => navigate(ROUTES.PROFESSIONAL_PROFILE)}
                    className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs shrink-0 hover:bg-gray-700 transition-colors"
                    title="Ver Perfil"
                >
                    {initials}
                </button>
            </div>

        </motion.div>
    )
}

export default DashboardHeader
