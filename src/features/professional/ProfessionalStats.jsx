import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
    Users, UserCheck, UserMinus, DollarSign,
    Clock, Zap, Globe, ChevronDown, TrendingUp, BarChart2
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

// ─── Primitives ───────────────────────────────────────────────────────────────

const Chip = ({ icon: Icon, iconBg, iconColor, label, value, sub, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.25 }}
        className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 flex items-center gap-2.5 hover:shadow-sm transition-shadow"
    >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-none truncate">{label}</p>
            {sub && <p className="text-[10px] text-gray-300 mt-0.5 leading-none truncate">{sub}</p>}
        </div>
    </motion.div>
)

const Section = ({ children, className = '' }) => (
    <div className={`bg-stone-50 rounded-2xl border border-stone-100 p-4 ${className}`}>
        {children}
    </div>
)

const SectionTitle = ({ icon: Icon, iconColor, title, aside }) => (
    <div className="flex items-center gap-1.5 mb-3">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2} />
        <span className="text-xs font-semibold text-gray-600">{title}</span>
        {aside && <span className="ml-auto text-[10px] text-gray-400">{aside}</span>}
    </div>
)

const MiniBar = ({ data, max, color, formatTip }) => (
    <div className="flex items-end gap-px h-20 w-full">
        {data.map((val, i) => {
            const pct = max > 0 ? (val / max) * 100 : 0
            return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                    <div className="w-full flex items-end" style={{ height: '64px' }}>
                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: pct > 0 ? 1 : 0 }}
                            transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                            style={{ height: `${pct}%`, transformOrigin: 'bottom' }}
                            className={`w-full rounded-t ${pct > 0 ? color : 'bg-stone-200'} relative`}
                        >
                            {pct > 0 && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {formatTip(val)}
                                </span>
                            )}
                        </motion.div>
                    </div>
                    <span className="text-[8px] text-stone-400">{MONTHS[i]}</span>
                </div>
            )
        })}
    </div>
)

const DonutRow = ({ female, male, other }) => {
    const total = female + male + other
    const rows = [
        { label: 'Mujeres',   count: female, pct: Math.round((female / total) * 100), color: 'bg-indigo-400' },
        { label: 'Varones',   count: male,   pct: Math.round((male   / total) * 100), color: 'bg-sky-400' },
        { label: 'Otro / NC', count: other,  pct: Math.round((other  / total) * 100), color: 'bg-lime-400' },
    ]
    return (
        <div className="space-y-2">
            {rows.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-16 shrink-0">{r.label}</span>
                    <div className="flex-1 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.pct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${r.color}`}
                        />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-600 w-5 text-right">{r.count}</span>
                    <span className="text-[10px] text-gray-400 w-7 text-right">{r.pct}%</span>
                </div>
            ))}
        </div>
    )
}

const CountryRows = ({ countries, total }) => (
    <div className="space-y-2">
        {countries.map((c, i) => {
            const pct = Math.round((c.count / total) * 100)
            return (
                <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-2"
                >
                    <span className="text-[10px] text-gray-500 w-20 shrink-0">{c.name}</span>
                    <div className="flex-1 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.45, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                            className="h-full rounded-full bg-indigo-400"
                        />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-600 w-5 text-right">{c.count}</span>
                    <span className="text-[10px] text-gray-400 w-7 text-right">{pct}%</span>
                </motion.div>
            )
        })}
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

    return (
        <div className="p-3 md:p-6 lg:p-8 space-y-3">

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" strokeWidth={2} />
                    <h1 className="text-sm font-bold text-gray-800">Estadísticas</h1>
                    <span className="text-[10px] text-gray-400">· crecimiento y rendimiento de tu consulta</span>
                </div>

                {/* Year picker */}
                <div className="relative">
                    <button
                        onClick={() => setYearOpen(o => !o)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                        {year}
                        <ChevronDown className={`w-3 h-3 transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {yearOpen && (
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 min-w-20">
                            {availableYears.map(y => (
                                <button
                                    key={y}
                                    onClick={() => { setYear(y); setYearOpen(false) }}
                                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-indigo-50 transition ${y === year ? 'font-bold text-indigo-600' : 'text-gray-600'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI chips */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Chip icon={Users}    iconBg="bg-indigo-50" iconColor="text-indigo-600"
                      label="Pacientes atendidos" value={data.totalPatients}
                      sub={`${year}`} delay={0.05} />
                <Chip icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600"
                      label="Activos"
                      value={data.activePatients}
                      sub={`${Math.round((data.activePatients / data.totalPatients) * 100)}%`} delay={0.10} />
                <Chip icon={UserMinus} iconBg="bg-rose-50" iconColor="text-rose-500"
                      label="Se fueron"
                      value={data.inactivePatients}
                      sub={`${Math.round((data.inactivePatients / data.totalPatients) * 100)}%`} delay={0.15} />
                <Chip icon={DollarSign} iconBg="bg-amber-50" iconColor="text-amber-600"
                      label="Ingresos totales"
                      value={`$${(data.totalRevenue / 1000).toFixed(0)}k`}
                      sub={`~$${Math.round(data.totalRevenue / 12 / 1000).toFixed(0)}k/mes`} delay={0.20} />
                <Chip icon={Clock} iconBg="bg-sky-50" iconColor="text-sky-600"
                      label="Horas de terapia"
                      value={`${data.therapyHours} h`}
                      sub={`~${Math.round(data.therapyHours / 12)} h/mes`} delay={0.25} />
                <Chip icon={Zap} iconBg="bg-violet-50" iconColor="text-violet-600"
                      label="Horas ahorradas"
                      value={`${data.hoursSaved} h`}
                      sub="plataforma" delay={0.30} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Section>
                    <SectionTitle icon={TrendingUp} iconColor="text-amber-500" title="Ingresos por mes" aside={String(year)} />
                    <MiniBar data={data.monthlyRevenue} max={maxRevenue} color="bg-amber-400"
                             formatTip={v => `$${(v/1000).toFixed(1)}k`} />
                </Section>
                <Section>
                    <SectionTitle icon={Clock} iconColor="text-sky-500" title="Horas de terapia por mes" aside={String(year)} />
                    <MiniBar data={data.monthlyHours} max={maxHours} color="bg-sky-400"
                             formatTip={v => `${v} h`} />
                </Section>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Section>
                    <SectionTitle icon={Users} iconColor="text-indigo-500" title="Distribución por género"
                                  aside={`${data.gender.female + data.gender.male + data.gender.other} pac.`} />
                    <DonutRow {...data.gender} />
                </Section>
                <Section>
                    <SectionTitle icon={Globe} iconColor="text-indigo-500" title="País de origen"
                                  aside={`${data.totalPatients} pac.`} />
                    <CountryRows countries={data.countries} total={data.totalPatients} />
                </Section>
            </div>

            <p className="text-[10px] text-stone-300 text-center pb-1">
                Datos ilustrativos · integración con API próximamente
            </p>
        </div>
    )
}

export default ProfessionalStats
