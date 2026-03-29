import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    ChevronDown, BarChart2, TrendingUp, TrendingDown,
    DollarSign, Users, Clock, UserMinus, Lightbulb,
    Calendar, Target, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

// ─── Mock data (TODO: replace with /api/professional/stats?year=YYYY) ─────────
const MOCK_DATA = {
    2026: {
        totalPatients: 38, activePatients: 27, inactivePatients: 11,
        totalRevenue: 142500, therapyHours: 312, avgSessionMin: 52,
        monthlyRevenue: [9200, 10800, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        monthlyHours:   [28, 33, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        monthlyPatients:[24, 26, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        countries: [
            { name: 'Argentina', count: 22 }, { name: 'México', count: 6 },
            { name: 'España', count: 4 },     { name: 'Colombia', count: 3 },
            { name: 'Chile', count: 2 },      { name: 'Otros', count: 1 },
        ],
        gender: { female: 26, male: 10, other: 2 },
        referrals: [
            { source: 'Boca en boca',    count: 16 },
            { source: 'Redes sociales',  count: 9 },
            { source: 'Google',          count: 7 },
            { source: 'Derivación médica', count: 4 },
            { source: 'Otros',           count: 2 },
        ],
        peakHours: [
            [0,0,1,2,3,2,0], [0,1,2,3,4,3,1], [0,0,2,4,5,4,1],
            [0,1,3,5,4,3,0], [0,2,4,3,2,1,0], [0,0,1,1,0,0,0],
        ],
    },
    2025: {
        totalPatients: 52, activePatients: 38, inactivePatients: 14,
        totalRevenue: 198000, therapyHours: 524, avgSessionMin: 50,
        monthlyRevenue: [14200,15600,17800,16400,18100,17200,16800,17500,16900,17200,15800,14500],
        monthlyHours:   [42,44,48,45,50,47,46,48,46,47,43,37],
        monthlyPatients:[32,34,36,35,38,37,36,38,37,38,35,30],
        countries: [
            { name: 'Argentina', count: 30 }, { name: 'México', count: 8 },
            { name: 'España', count: 6 },     { name: 'Colombia', count: 4 },
            { name: 'Chile', count: 2 },      { name: 'Uruguay', count: 1 },
            { name: 'Otros', count: 1 },
        ],
        gender: { female: 36, male: 13, other: 3 },
        referrals: [
            { source: 'Boca en boca',    count: 22 },
            { source: 'Google',          count: 12 },
            { source: 'Redes sociales',  count: 10 },
            { source: 'Derivación médica', count: 5 },
            { source: 'Otros',           count: 3 },
        ],
        peakHours: [
            [0,1,2,3,4,3,0], [0,2,3,4,5,4,1], [0,1,3,5,5,4,1],
            [0,2,4,5,4,3,0], [0,3,4,3,2,1,0], [0,0,1,2,1,0,0],
        ],
    },
}

const MONTHS      = ['E','F','M','A','M','J','J','A','S','O','N','D']
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_SHORT  = ['Lun','Mar','Mié','Jue','Vie','Sáb']
const HOURS_RANGE = ['9h','11h','13h','15h','17h','19h','21h']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (v) => v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${v}`
const delta = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100)

// ─── Reusable primitives ──────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 ${className}`}>
        {children}
    </div>
)

const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600 mb-2">{children}</p>
)

const DeltaBadge = ({ value }) => {
    if (value == null) return null
    const positive = value >= 0
    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
            positive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
        }`}>
            {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {positive ? '+' : ''}{value}%
        </span>
    )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#22c55e', width = 64, height = 24 }) => {
    const filtered = data.filter(v => v > 0)
    if (filtered.length < 2) return null
    const max = Math.max(...filtered)
    const min = Math.min(...filtered)
    const range = max - min || 1
    const pts = filtered.map((v, i) => {
        const x = (i / (filtered.length - 1)) * width
        const y = height - ((v - min) / range) * (height - 4) - 2
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={width} height={height} className="shrink-0">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, delta: d, sparkData, sparkColor, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all"
    >
        <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2} />
            </div>
            {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{value}</span>
            <DeltaBadge value={d} />
        </div>
        {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </motion.div>
)

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BarChart = ({ data, max, barColor, height = 100, label }) => {
    const [hovered, setHovered] = useState(null)
    return (
        <div>
            <div className="flex items-end gap-0.75 w-full" style={{ height }}>
                {data.map((val, i) => {
                    const pct = max > 0 ? (val / max) * 100 : 0
                    const filled = val > 0
                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-1 relative"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className="w-full flex items-end cursor-default" style={{ height: height - 16 }}>
                                <motion.div
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: filled ? 1 : 0.03 }}
                                    transition={{ duration: 0.5, delay: i * 0.025, ease: 'easeOut' }}
                                    style={{
                                        height: filled ? `${Math.max(pct, 6)}%` : '100%',
                                        transformOrigin: 'bottom',
                                        background: filled ? barColor : undefined,
                                    }}
                                    className={`w-full rounded-sm transition-opacity ${filled ? (hovered === i ? 'opacity-100' : 'opacity-75') : 'bg-gray-100 dark:bg-white/3'}`}
                                />
                            </div>

                            {/* Tooltip */}
                            <AnimatePresence>
                                {hovered === i && filled && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="absolute -top-7 z-10 text-[9px] font-bold text-gray-700 dark:text-white whitespace-nowrap bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none"
                                    >
                                        {label(val)}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <span className={`text-[8px] leading-none transition-colors ${hovered === i ? 'text-gray-700 dark:text-gray-200 font-bold' : 'text-gray-400 dark:text-gray-600'}`}>{MONTHS[i]}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Donut ────────────────────────────────────────────────────────────────────
const DonutChart = ({ active, total, size = 120 }) => {
    const pct = Math.round((active / total) * 100)
    const r = 38
    const c = 2 * Math.PI * r
    const activeLen = (active / total) * c
    return (
        <div className="relative inline-flex" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={r} fill="none" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="10" />
                <motion.circle
                    cx="50" cy="50" r={r} fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${c}` }}
                    animate={{ strokeDasharray: `${activeLen} ${c - activeLen}` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{pct}%</span>
                <span className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">retención</span>
            </div>
        </div>
    )
}

// ─── Horizontal bar row ───────────────────────────────────────────────────────
const HBar = ({ label, count, pct, barColor, delay = 0, dot }) => (
    <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay }}
        className="flex items-center gap-2.5"
    >
        {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 truncate">{label}</span>
        <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay }}
                className="h-full rounded-full"
                style={{ background: barColor }}
            />
        </div>
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-6 text-right tabular-nums">{count}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 w-8 text-right tabular-nums">{pct}%</span>
    </motion.div>
)

// ─── Heatmap ──────────────────────────────────────────────────────────────────
const Heatmap = ({ data }) => {
    const maxVal = Math.max(...data.flat())
    return (
        <div className="space-y-1">
            {/* hour labels */}
            <div className="flex gap-1 ml-9">
                {HOURS_RANGE.map(h => (
                    <span key={h} className="flex-1 text-[8px] text-gray-400 dark:text-gray-600 text-center">{h}</span>
                ))}
            </div>
            {data.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-1">
                    <span className="w-7 text-[9px] text-gray-400 dark:text-gray-500 text-right shrink-0">{DAYS_SHORT[dayIdx]}</span>
                    {row.map((val, hIdx) => {
                        const intensity = maxVal > 0 ? val / maxVal : 0
                        return (
                            <motion.div
                                key={hIdx}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dayIdx * 0.04 + hIdx * 0.02, duration: 0.2 }}
                                className="flex-1 aspect-square rounded-sm"
                                title={`${DAYS_SHORT[dayIdx]} ${HOURS_RANGE[hIdx]}: ${val} sesiones`}
                                style={{
                                    background: val === 0
                                        ? 'var(--heat-empty, rgba(0,0,0,0.03))'
                                        : `rgba(34, 197, 94, ${0.15 + intensity * 0.85})`,
                                }}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProfessionalStats = () => {
    const currentYear = new Date().getFullYear()
    const availableYears = Object.keys(MOCK_DATA).map(Number).sort((a, b) => b - a)
    const [year, setYear] = useState(currentYear)
    const [yearOpen, setYearOpen] = useState(false)

    const data = useMemo(() => MOCK_DATA[year] ?? MOCK_DATA[availableYears[0]], [year])
    const prevData = useMemo(() => MOCK_DATA[year - 1], [year])

    const maxRevenue = Math.max(...data.monthlyRevenue)
    const maxHours   = Math.max(...data.monthlyHours)
    const genderTotal = data.gender.female + data.gender.male + data.gender.other
    const revenuePerPatient = Math.round(data.totalRevenue / data.totalPatients)

    // Deltas vs previous year
    const dRevenue   = prevData ? delta(data.totalRevenue, prevData.totalRevenue) : null
    const dPatients  = prevData ? delta(data.activePatients, prevData.activePatients) : null
    const dHours     = prevData ? delta(data.therapyHours, prevData.therapyHours) : null
    const dChurn     = prevData ? delta(data.inactivePatients, prevData.inactivePatients) : null
    const dRevPerPat = prevData ? delta(revenuePerPatient, Math.round(prevData.totalRevenue / prevData.totalPatients)) : null
    const dAvgSess   = prevData ? delta(data.avgSessionMin, prevData.avgSessionMin) : null

    // Period label for charts
    const filledRevenue = data.monthlyRevenue.map((v, i) => ({ v, i })).filter(x => x.v > 0)
    const filledHours   = data.monthlyHours.map((v, i) => ({ v, i })).filter(x => x.v > 0)
    const makePeriod = (filled, all) =>
        all.every(v => v > 0) ? String(year) :
        filled.length > 0 ? `${MONTH_NAMES[filled[0].i]} – ${MONTH_NAMES[filled.at(-1).i]}` : String(year)

    // Auto-insights
    const insights = useMemo(() => {
        const list = []
        const retPct = Math.round((data.activePatients / data.totalPatients) * 100)
        if (retPct >= 70) list.push({ type: 'positive', text: `Retención del ${retPct}% — excelente fidelización de pacientes.` })
        else list.push({ type: 'warning', text: `Retención del ${retPct}% — podrías mejorar el seguimiento post-sesión.` })

        const topCountry = data.countries[0]
        if (topCountry) list.push({ type: 'info', text: `El ${Math.round((topCountry.count / data.totalPatients) * 100)}% de tus pacientes son de ${topCountry.name}.` })

        if (data.avgSessionMin > 50) list.push({ type: 'info', text: `Sesión promedio de ${data.avgSessionMin} min — buen equilibrio entre profundidad y eficiencia.` })

        if (dRevenue != null && dRevenue > 0) list.push({ type: 'positive', text: `Ingresos crecieron ${dRevenue}% vs ${year - 1}.` })
        else if (dRevenue != null && dRevenue < 0) list.push({ type: 'warning', text: `Ingresos bajaron ${Math.abs(dRevenue)}% vs ${year - 1}. Revisar precios o frecuencia.` })

        const topRef = data.referrals?.[0]
        if (topRef) list.push({ type: 'info', text: `La principal fuente de referidos es "${topRef.source}" (${Math.round((topRef.count / data.totalPatients) * 100)}%).` })

        return list.slice(0, 4)
    }, [data, dRevenue, year])

    const genderRows = [
        { label: 'Mujeres',   count: data.gender.female, bar: 'linear-gradient(to right, #7c3aed, #a78bfa)', dot: '#8b5cf6' },
        { label: 'Varones',   count: data.gender.male,   bar: 'linear-gradient(to right, #0284c7, #38bdf8)', dot: '#0ea5e9' },
        { label: 'Otro / NC', count: data.gender.other,  bar: 'linear-gradient(to right, #6b7280, #9ca3af)', dot: '#9ca3af' },
    ]

    return (
        <div className="min-h-full p-4 md:p-6 space-y-5 max-w-300">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sky-100 to-teal-100 dark:from-sky-500/15 dark:to-teal-500/15 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Estadísticas</h1>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-none">
                        Rendimiento y crecimiento de tu consulta
                    </p>
                </div>
                <div className="relative shrink-0">
                    <button
                        onClick={() => setYearOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm"
                    >
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {year}
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {yearOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-24"
                            >
                                {availableYears.map(y => (
                                    <button
                                        key={y}
                                        onClick={() => { setYear(y); setYearOpen(false) }}
                                        className={`w-full px-4 py-2 text-xs text-left transition-colors ${
                                            y === year
                                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
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

            {/* ══════════ KPI CARDS ══════════ */}
            <SectionLabel>Resumen anual</SectionLabel>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard
                    icon={DollarSign}
                    iconBg="bg-amber-50 dark:bg-amber-500/10"
                    iconColor="text-amber-500 dark:text-amber-400"
                    label="Ingresos totales"
                    value={fmt$(data.totalRevenue)}
                    sub={`≈ ${fmt$(Math.round(data.totalRevenue / 12))} / mes`}
                    delta={dRevenue}
                    sparkData={data.monthlyRevenue}
                    sparkColor="#f59e0b"
                    delay={0}
                />
                <KpiCard
                    icon={Users}
                    iconBg="bg-emerald-50 dark:bg-emerald-500/10"
                    iconColor="text-emerald-500 dark:text-emerald-400"
                    label="Pacientes activos"
                    value={data.activePatients}
                    sub={`de ${data.totalPatients} atendidos`}
                    delta={dPatients}
                    sparkData={data.monthlyPatients}
                    sparkColor="#22c55e"
                    delay={0.05}
                />
                <KpiCard
                    icon={Clock}
                    iconBg="bg-sky-50 dark:bg-sky-500/10"
                    iconColor="text-sky-500 dark:text-sky-400"
                    label="Horas de terapia"
                    value={`${data.therapyHours}h`}
                    sub={`≈ ${Math.round(data.therapyHours / 12)}h / mes`}
                    delta={dHours}
                    sparkData={data.monthlyHours}
                    sparkColor="#0ea5e9"
                    delay={0.1}
                />
                <KpiCard
                    icon={UserMinus}
                    iconBg="bg-rose-50 dark:bg-rose-500/10"
                    iconColor="text-rose-500 dark:text-rose-400"
                    label="Churn"
                    value={data.inactivePatients}
                    sub={`${Math.round((data.inactivePatients / data.totalPatients) * 100)}% no continuaron`}
                    delta={dChurn}
                    delay={0.15}
                />
                <KpiCard
                    icon={Target}
                    iconBg="bg-violet-50 dark:bg-violet-500/10"
                    iconColor="text-violet-500 dark:text-violet-400"
                    label="Ingreso / paciente"
                    value={fmt$(revenuePerPatient)}
                    sub="promedio anual por paciente"
                    delta={dRevPerPat}
                    delay={0.2}
                />
                <KpiCard
                    icon={Clock}
                    iconBg="bg-teal-50 dark:bg-teal-500/10"
                    iconColor="text-teal-500 dark:text-teal-400"
                    label="Duración promedio"
                    value={`${data.avgSessionMin} min`}
                    sub="por sesión"
                    delta={dAvgSess}
                    delay={0.25}
                />
            </div>

            {/* ══════════ TRENDS ══════════ */}
            <SectionLabel>Tendencias mensuales</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ingresos por mes</span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">{makePeriod(filledRevenue, data.monthlyRevenue)}</span>
                    </div>
                    <BarChart data={data.monthlyRevenue} max={maxRevenue} barColor="#f59e0b" label={fmt$} height={120} />
                </Card>
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sky-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Horas de terapia</span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">{makePeriod(filledHours, data.monthlyHours)}</span>
                    </div>
                    <BarChart data={data.monthlyHours} max={maxHours} barColor="#0ea5e9" label={v => `${v}h`} height={120} />
                </Card>
            </div>

            {/* ══════════ RETENTION + DEMOGRAPHICS ══════════ */}
            <SectionLabel>Pacientes</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Retention donut */}
                <Card className="flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-4 self-start">Retención</span>
                    <DonutChart active={data.activePatients} total={data.totalPatients} />
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Activos</span>
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 tabular-nums">{data.activePatients}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Se fueron</span>
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 tabular-nums">{data.inactivePatients}</span>
                        </div>
                    </div>
                </Card>

                {/* Gender */}
                <Card>
                    <div className="flex items-baseline justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Género</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">{genderTotal} pac.</span>
                    </div>
                    <div className="space-y-3">
                        {genderRows.map((r, i) => (
                            <HBar
                                key={r.label}
                                label={r.label}
                                count={r.count}
                                pct={Math.round((r.count / genderTotal) * 100)}
                                barColor={r.bar}
                                dot={r.dot}
                                delay={0.08 + i * 0.06}
                            />
                        ))}
                    </div>
                </Card>

                {/* Countries */}
                <Card>
                    <div className="flex items-baseline justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">País de origen</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">{data.totalPatients} pac.</span>
                    </div>
                    <div className="space-y-2.5">
                        {data.countries.map((c, i) => (
                            <HBar
                                key={c.name}
                                label={c.name}
                                count={c.count}
                                pct={Math.round((c.count / data.totalPatients) * 100)}
                                barColor="linear-gradient(to right, #059669, #6ee7b7)"
                                delay={0.05 + i * 0.04}
                            />
                        ))}
                    </div>
                </Card>
            </div>

            {/* ══════════ HEATMAP + REFERRALS + INSIGHTS ══════════ */}
            <SectionLabel>Análisis</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Peak hours heatmap */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Horarios más solicitados</span>
                    </div>
                    <Heatmap data={data.peakHours} />
                    <div className="flex items-center gap-1 mt-3 justify-end">
                        <span className="text-[8px] text-gray-400 dark:text-gray-600">Menos</span>
                        {[0.1, 0.3, 0.55, 0.8, 1].map((op, i) => (
                            <span key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(34, 197, 94, ${op})` }} />
                        ))}
                        <span className="text-[8px] text-gray-400 dark:text-gray-600">Más</span>
                    </div>
                </Card>

                {/* Referral sources */}
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Fuente de referidos</span>
                    </div>
                    <div className="space-y-2.5">
                        {data.referrals.map((r, i) => (
                            <HBar
                                key={r.source}
                                label={r.source}
                                count={r.count}
                                pct={Math.round((r.count / data.totalPatients) * 100)}
                                barColor="linear-gradient(to right, #0369a1, #7dd3fc)"
                                delay={0.05 + i * 0.05}
                            />
                        ))}
                    </div>
                </Card>

                {/* Insights */}
                <Card className="bg-linear-to-br from-white to-sky-50/40 dark:from-gray-800/60 dark:to-sky-900/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Insights</span>
                    </div>
                    <div className="space-y-2.5">
                        {insights.map((ins, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                                className="flex gap-2 items-start"
                            >
                                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                                    ins.type === 'positive' ? 'bg-emerald-400' :
                                    ins.type === 'warning'  ? 'bg-amber-400' : 'bg-sky-400'
                                }`} />
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{ins.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </div>

            <p className="text-[9px] text-gray-300 dark:text-gray-700 text-center pb-2">
                Datos ilustrativos · integración con API próximamente
            </p>
        </div>
    )
}

export default ProfessionalStats
