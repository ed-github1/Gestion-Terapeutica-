import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Users, UserCheck, UserMinus, DollarSign,
    Clock, Zap, Globe, ChevronDown, TrendingUp, BarChart2, Activity
} from 'lucide-react'

// ─── Mock data (TODO: replace with /api/professional/stats?year=YYYY) ─────────
const MOCK_DATA = {
    2026: {
        totalPatients: 38, activePatients: 27, inactivePatients: 11,
        totalRevenue: 142500, therapyHours: 312, hoursSaved: 87,
        monthlyRevenue: [9200, 10800, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        monthlyHours:   [28, 33, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        countries: [
            { name: 'Argentina', count: 22 }, { name: 'México', count: 6 },
            { name: 'España', count: 4 },     { name: 'Colombia', count: 3 },
            { name: 'Chile', count: 2 },      { name: 'Otros', count: 1 },
        ],
        gender: { female: 26, male: 10, other: 2 },
    },
    2025: {
        totalPatients: 52, activePatients: 38, inactivePatients: 14,
        totalRevenue: 198000, therapyHours: 524, hoursSaved: 148,
        monthlyRevenue: [14200,15600,17800,16400,18100,17200,16800,17500,16900,17200,15800,14500],
        monthlyHours:   [42,44,48,45,50,47,46,48,46,47,43,37],
        countries: [
            { name: 'Argentina', count: 30 }, { name: 'México', count: 8 },
            { name: 'España', count: 6 },     { name: 'Colombia', count: 4 },
            { name: 'Chile', count: 2 },      { name: 'Uruguay', count: 1 },
            { name: 'Otros', count: 1 },
        ],
        gender: { female: 36, male: 13, other: 3 },
    },
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── KPI Chip ─────────────────────────────────────────────────────────────────
// stripeCls: bg- color class for the left accent stripe (e.g. 'bg-violet-400')
// iconCls:   full icon-container className (bg + text, light + dark variants)
const KpiChip = ({ icon: Icon, label, value, sub, stripeCls, iconCls, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.25 }}
        className="relative bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 px-3 py-2.5 overflow-hidden hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-600/70 transition-all"
    >
        {/* left accent stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl ${stripeCls}`} />

        <div className="flex items-start gap-2 pl-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none truncate">{label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight tabular-nums mt-1">{value}</p>
                {sub && <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 leading-none">{sub}</p>}
            </div>
        </div>
    </motion.div>
)

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
const MiniBarChart = ({ data, max, barGradient, formatTip }) => (
    <div className="flex items-end gap-0.5 w-full" style={{ height: '72px' }}>
        {data.map((val, i) => {
            const pct = max > 0 ? (val / max) * 100 : 0
            const filled = pct > 0
            return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                    <div className="w-full flex items-end" style={{ height: '58px' }}>
                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: filled ? 1 : 0.07 }}
                            transition={{ duration: 0.45, delay: i * 0.025, ease: 'easeOut' }}
                            style={{
                                height: filled ? `${Math.max(pct, 7)}%` : '100%',
                                transformOrigin: 'bottom',
                                ...(filled ? { background: barGradient } : {}),
                            }}
                            className={`w-full rounded-t-xs relative ${filled ? '' : 'bg-gray-100 dark:bg-white/5'}`}
                        >
                            {filled && (
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-gray-700 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-1.5 py-0.5 rounded shadow-sm">
                                    {formatTip(val)}
                                </span>
                            )}
                        </motion.div>
                    </div>
                    <span className="text-[7px] text-gray-400 dark:text-gray-700 leading-none">{MONTHS[i]}</span>
                </div>
            )
        })}
    </div>
)

// ─── Progress Row ─────────────────────────────────────────────────────────────
const ProgressRow = ({ label, count, pct, barGradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay }}
        className="flex items-center gap-2.5"
    >
        <span className="text-[10px] text-gray-500 dark:text-gray-400 w-20 shrink-0 truncate">{label}</span>
        <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, ease: 'easeOut', delay }}
                className="h-full rounded-full"
                style={{ background: barGradient }}
            />
        </div>
        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-5 text-right tabular-nums">{count}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 w-6 text-right tabular-nums">{pct}%</span>
    </motion.div>
)

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-3 ${className}`}>
        {children}
    </div>
)

const CardTitle = ({ icon: Icon, iconCls, title, aside }) => (
    <div className="flex items-center gap-1.5 mb-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
            <Icon className="w-3 h-3" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        {aside && <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-600">{aside}</span>}
    </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProfessionalStats = () => {
    const currentYear = new Date().getFullYear()
    const availableYears = Object.keys(MOCK_DATA).map(Number).sort((a, b) => b - a)
    const [year, setYear] = useState(currentYear)
    const [yearOpen, setYearOpen] = useState(false)

    const data = useMemo(() => MOCK_DATA[year] ?? MOCK_DATA[availableYears[0]], [year])

    const maxRevenue = Math.max(...data.monthlyRevenue)
    const maxHours   = Math.max(...data.monthlyHours)

    const kpis = [
        {
            icon: Users, label: 'Pacientes atendidos', value: data.totalPatients,
            sub: `Año ${year}`,
            stripeCls: 'bg-violet-400',
            iconCls: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
            delay: 0.04,
        },
        {
            icon: UserCheck, label: 'Activos', value: data.activePatients,
            sub: `${Math.round((data.activePatients / data.totalPatients) * 100)}% retención`,
            stripeCls: 'bg-emerald-400',
            iconCls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
            delay: 0.08,
        },
        {
            icon: UserMinus, label: 'Se fueron', value: data.inactivePatients,
            sub: `${Math.round((data.inactivePatients / data.totalPatients) * 100)}% churn`,
            stripeCls: 'bg-rose-400',
            iconCls: 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400',
            delay: 0.12,
        },
        {
            icon: DollarSign, label: 'Ingresos totales', value: `$${(data.totalRevenue / 1000).toFixed(0)}k`,
            sub: `≈ $${Math.round(data.totalRevenue / 12 / 1000)}k / mes`,
            stripeCls: 'bg-amber-400',
            iconCls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
            delay: 0.16,
        },
        {
            icon: Clock, label: 'Horas de terapia', value: `${data.therapyHours}h`,
            sub: `≈ ${Math.round(data.therapyHours / 12)}h / mes`,
            stripeCls: 'bg-sky-400',
            iconCls: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
            delay: 0.20,
        },
        {
            icon: Zap, label: 'Horas ahorradas', value: `${data.hoursSaved}h`,
            sub: 'por la plataforma',
            stripeCls: 'bg-lime-400',
            iconCls: 'bg-lime-50 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400',
            delay: 0.24,
        },
    ]

    const genderRows = [
        { label: 'Mujeres',   count: data.gender.female, barGradient: 'linear-gradient(to right, #7c3aed, #a78bfa)' },
        { label: 'Varones',   count: data.gender.male,   barGradient: 'linear-gradient(to right, #0284c7, #38bdf8)' },
        { label: 'Otro / NC', count: data.gender.other,  barGradient: 'linear-gradient(to right, #65a30d, #a3e635)' },
    ]
    const genderTotal = data.gender.female + data.gender.male + data.gender.other

    return (
        <div className="min-h-full p-4 md:p-6 space-y-4">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Estadísticas</h1>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                        Crecimiento y rendimiento de tu consulta
                    </p>
                </div>

                {/* Year picker */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setYearOpen(o => !o)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors"
                    >
                        {year}
                        <ChevronDown className={`w-3 h-3 transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {yearOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-lg overflow-hidden z-20 min-w-20"
                            >
                                {availableYears.map(y => (
                                    <button
                                        key={y}
                                        onClick={() => { setYear(y); setYearOpen(false) }}
                                        className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                                            y === year
                                                ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                        }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {kpis.map((k, i) => <KpiChip key={i} {...k} />)}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Card>
                    <CardTitle
                        icon={TrendingUp}
                        iconCls="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                        title="Ingresos por mes"
                        aside={String(year)}
                    />
                    <MiniBarChart
                        data={data.monthlyRevenue}
                        max={maxRevenue}
                        barGradient="linear-gradient(to top, #d97706, #fcd34d)"
                        formatTip={v => `$${(v / 1000).toFixed(1)}k`}
                    />
                </Card>
                <Card>
                    <CardTitle
                        icon={Activity}
                        iconCls="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                        title="Horas de terapia por mes"
                        aside={String(year)}
                    />
                    <MiniBarChart
                        data={data.monthlyHours}
                        max={maxHours}
                        barGradient="linear-gradient(to top, #0369a1, #7dd3fc)"
                        formatTip={v => `${v}h`}
                    />
                </Card>
            </div>

            {/* ── Demographics ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Card>
                    <CardTitle
                        icon={Users}
                        iconCls="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
                        title="Distribución por género"
                        aside={`${genderTotal} pac.`}
                    />
                    <div className="space-y-2.5">
                        {genderRows.map((r, i) => (
                            <ProgressRow
                                key={r.label}
                                label={r.label}
                                count={r.count}
                                pct={Math.round((r.count / genderTotal) * 100)}
                                barGradient={r.barGradient}
                                delay={0.08 + i * 0.06}
                            />
                        ))}
                    </div>
                </Card>
                <Card>
                    <CardTitle
                        icon={Globe}
                        iconCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        title="País de origen"
                        aside={`${data.totalPatients} pac.`}
                    />
                    <div className="space-y-2.5">
                        {data.countries.map((c, i) => (
                            <ProgressRow
                                key={c.name}
                                label={c.name}
                                count={c.count}
                                pct={Math.round((c.count / data.totalPatients) * 100)}
                                barGradient="linear-gradient(to right, #047857, #34d399)"
                                delay={0.08 + i * 0.05}
                            />
                        ))}
                    </div>
                </Card>
            </div>

            <p className="text-[9px] text-gray-300 dark:text-gray-700 text-center pb-1">
                Datos ilustrativos · integración con API próximamente
            </p>
        </div>
    )
}

export default ProfessionalStats
