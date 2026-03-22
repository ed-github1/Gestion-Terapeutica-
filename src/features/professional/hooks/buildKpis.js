import { Users, CalendarCheck, CircleDollarSign, Clock } from 'lucide-react'

/**
 * Build the KPI chip array used by both the MiniCalendarWidget and the desktop stats bar.
 *
 * @param {Object} stats - Dashboard stats from useDashboardData
 * @param {string} [weekLabel='Semana'] - Label for the weekly KPI
 * @returns {Array} KPI descriptor objects
 */
export const buildKpis = (stats, weekLabel = 'Semana') => {
    const monthGrowth = Math.round((stats.totalPatients / Math.max(stats.totalPatients - 10, 1)) * 100) - 100

    const revenueThisMonth = stats?.revenueThisMonth ?? 0
    const revenueLastMonth = stats?.revenueLastMonth ?? 0
    const outstandingAmount = stats?.outstandingAmount ?? 0
    const revenueGrowth = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : null

    return [
        { value: stats?.totalPatients ?? 0, label: 'Pacientes', trend: monthGrowth, trendPos: (monthGrowth ?? 0) >= 0, Icon: Users, iconColor: 'text-sky-400' },
        { value: stats?.completedThisWeek ?? 0, label: weekLabel, trend: null, trendPos: false, Icon: CalendarCheck, iconColor: 'text-sky-400' },
        { value: `$${revenueThisMonth.toLocaleString()}`, label: 'Ingresos', trend: revenueGrowth, trendPos: (revenueGrowth ?? 0) >= 0, Icon: CircleDollarSign, iconColor: 'text-sky-400' },
        { value: `$${outstandingAmount.toLocaleString()}`, label: 'Pendiente', trend: null, trendPos: false, Icon: Clock, iconColor: 'text-sky-400' },
    ]
}
