import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
    Users, Clock, DollarSign, TrendingUp, MapPin, Briefcase,
    BadgeCheck, Pencil, X, ChevronDown, ChevronUp, Bell,
} from 'lucide-react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'
import { statsService } from '@shared/services/statsService'
import { professionalsService } from '@shared/services/professionalsService'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
    2026: {
        totalPatients: 38, activePatients: 27, inactivePatients: 11,
        totalRevenue: 142500, therapyHours: 312, avgSessionMin: 52,
        monthlyRevenue: [9200, 10800, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        monthlyHours: [28, 33, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        monthlyPatients: [24, 26, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    2025: {
        totalPatients: 52, activePatients: 38, inactivePatients: 14,
        totalRevenue: 198000, therapyHours: 524, avgSessionMin: 50,
        monthlyRevenue: [14200, 15600, 17800, 16400, 18100, 17200, 16800, 17500, 16900, 17200, 15800, 14500],
        monthlyHours: [42, 44, 48, 45, 50, 47, 46, 48, 46, 47, 43, 37],
        monthlyPatients: [32, 34, 36, 35, 38, 37, 36, 38, 37, 38, 35, 30],
    },
}
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const fmt$ = v => v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${v}`
const calcDelta = (cur, prev) => prev ? Math.round(((cur - prev) / prev) * 100) : null

// ─── Field primitives ─────────────────────────────────────────────────────────
const FL = ({ children }) => (
    <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#8B96B1] uppercase tracking-[0.5px] mb-1.5">
        {children}
    </label>
)

const inputCls = "w-full px-3 py-2.5 text-sm bg-white dark:bg-[#0F1419] border border-gray-200 dark:border-[#2A3F5F] rounded-lg text-gray-900 dark:text-[#F5F7FA] outline-none focus:border-blue-500 dark:focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#0066FF]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"

const FField = ({ label, type = 'text', value, onChange, disabled }) => (
    <div>
        <FL>{label}</FL>
        <input type={type} value={value} onChange={onChange} disabled={disabled} className={inputCls} />
    </div>
)

const FSelect = ({ label, value, onChange, disabled, options }) => (
    <div>
        <FL>{label}</FL>
        <select value={value} onChange={onChange} disabled={disabled} className={`${inputCls} appearance-none`}>
            {options.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-[#1A2332]">{o.label}</option>)}
        </select>
    </div>
)

const FToggle = ({ checked, onChange, disabled }) => (
    <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex w-11 h-6 rounded-full border-none transition-colors duration-200 shrink-0
            ${checked ? 'bg-blue-600 dark:bg-[#0066FF]' : 'bg-gray-200 dark:bg-[#2A3F5F]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
)

const GENDER_OPTS = [
    { value: '', label: 'Seleccionar...' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'no_binario', label: 'No binario' },
    { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]
const COUNTRY_OPTS = [
    { value: '', label: 'Seleccionar país...' },
    ...PROFESSIONAL_COUNTRIES.map(c => ({ value: c.code, label: c.name })),
]

// --- Skeleton shimmer ---
// Delegates to the global .skeleton class in index.css (background-position sweep).
const Skeleton = ({ className = '' }) => (
    <div className={`skeleton ${className}`} />
)

// ─── Metric card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, iconColor, label, value, d }) => (
    <div className="min-w-0 bg-white dark:bg-[#0F1419] rounded-2xl px-3 pt-2.5 pb-3 flex flex-col gap-1.5 hover:bg-gray-50 dark:hover:bg-[#111820] transition-colors overflow-hidden">
        <div className="flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                <Icon size={12} className={`shrink-0 ${iconColor}`} strokeWidth={2.5} />
                <span className="text-[10px] font-semibold text-gray-400 dark:text-[#8B96B1] tracking-wide uppercase truncate">{label}</span>
            </div>
            {d != null && (
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${d >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-[#10B981]/10 dark:text-[#10B981]' : 'bg-rose-50 text-rose-500 dark:bg-[#EF4444]/10 dark:text-[#EF4444]'}`}>
                    {d >= 0 ? '↑' : '↓'}{Math.abs(d)}%
                </span>
            )}
        </div>
        <span className="text-[22px] font-black text-gray-900 dark:text-[#F5F7FA] leading-none tabular-nums tracking-tight truncate">{value}</span>
    </div>
)

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const makeTooltip = (formatter) => ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3F5F] rounded-lg px-3.5 py-2 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-[#8B96B1] mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-[#F5F7FA] m-0">{formatter(payload[0].value)}</p>
        </div>
    )
}

// ─── Profile modal ────────────────────────────────────────────────────────────
const ProfileModal = ({ open, onClose, profile, onChangeProfile, saving, saved, saveError, onSave, onDiscard, showPw, setShowPw, notif, onChangeNotif }) => {
    const [tab, setTab] = useState('credentials')

    useEffect(() => {
        if (!open) return
        const h = e => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', h)
        return () => document.removeEventListener('keydown', h)
    }, [open, onClose])

    const TABS = [
        { id: 'credentials', label: 'Credenciales' },
        { id: 'contact', label: 'Contacto' },
        { id: 'preferences', label: 'Preferencias' },
    ]

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            className="pointer-events-auto w-full max-w-[600px] max-h-[90vh] flex flex-col bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3F5F] rounded-xl overflow-hidden shadow-xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2A3F5F] shrink-0">
                                <span className="text-lg font-bold text-gray-900 dark:text-[#F5F7FA]">Editar perfil</span>
                                <button onClick={onClose} className="flex items-center justify-center text-gray-400 dark:text-[#8B96B1] hover:text-gray-700 dark:hover:text-[#F5F7FA] transition-colors cursor-pointer bg-transparent border-none p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 px-6 py-3 border-b border-gray-100 dark:border-[#2A3F5F] shrink-0">
                                {TABS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`px-4 py-1.5 rounded-md text-[13px] font-semibold border-none cursor-pointer transition-all duration-150
                                            ${tab === t.id
                                                ? 'bg-blue-600 dark:bg-[#0066FF] text-white'
                                                : 'bg-transparent text-gray-400 dark:text-[#8B96B1] hover:text-gray-600 dark:hover:text-[#B8C5D6]'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {tab === 'credentials' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FField label="Nombre" value={profile.nombre} onChange={e => onChangeProfile('nombre', e.target.value)} disabled={saving} />
                                        <FField label="Apellido" value={profile.apellido} onChange={e => onChangeProfile('apellido', e.target.value)} disabled={saving} />
                                        <FField label="Especialidad" value={profile.especialidad} onChange={e => onChangeProfile('especialidad', e.target.value)} disabled={saving} />
                                        <FField label="Cédula / Licencia" value={profile.cedula} onChange={e => onChangeProfile('cedula', e.target.value)} disabled={saving} />
                                    </div>
                                )}
                                {tab === 'contact' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <FField label="Correo electrónico" type="email" value={profile.email} onChange={e => onChangeProfile('email', e.target.value)} disabled={saving} />
                                        </div>
                                        <FSelect label="País" value={profile.country} onChange={e => onChangeProfile('country', e.target.value)} disabled={saving} options={COUNTRY_OPTS} />
                                        <FSelect label="Género" value={profile.genero} onChange={e => onChangeProfile('genero', e.target.value)} disabled={saving} options={GENDER_OPTS} />
                                    </div>
                                )}
                                {tab === 'preferences' && (
                                    <div className="flex flex-col gap-5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F7FA] m-0">Recordatorio 24h antes</p>
                                                <p className="text-xs text-gray-400 dark:text-[#8B96B1] mt-1 mb-0">Recibe un aviso un día antes de cada sesión</p>
                                            </div>
                                            <FToggle checked={notif.emailReminders} onChange={v => onChangeNotif('emailReminders', v)} disabled={saving} />
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-[#2A3F5F] pt-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F7FA] m-0">Contraseña</p>
                                                    <p className="text-xs text-gray-400 dark:text-[#8B96B1] mt-1 mb-0">Actualiza tu contraseña regularmente</p>
                                                </div>
                                                <button
                                                    type="button" onClick={() => setShowPw(s => !s)}
                                                    className="bg-transparent border border-gray-200 dark:border-[#2A3F5F] rounded-md px-3.5 py-1.5 text-[13px] font-semibold text-blue-600 dark:text-[#0066FF] cursor-pointer hover:border-gray-300 dark:hover:border-[#3A5F8F] transition-colors"
                                                >
                                                    {showPw ? 'Cancelar' : 'Cambiar'}
                                                </button>
                                            </div>
                                            {showPw && <ChangePasswordForm />}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-[#2A3F5F] shrink-0">
                                {saveError && <span className="text-xs text-red-500 dark:text-[#EF4444] flex-1">{saveError}</span>}
                                <button onClick={onDiscard} className="bg-transparent border-none px-4 py-2 text-[13px] text-gray-400 dark:text-[#8B96B1] hover:text-gray-600 dark:hover:text-[#B8C5D6] cursor-pointer transition-colors">
                                    Descartar
                                </button>
                                <button
                                    onClick={onSave} disabled={saving}
                                    className={`px-5 py-2 rounded-lg border-none text-[13px] font-semibold text-white transition-colors duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed
                                        ${saved ? 'bg-emerald-500 dark:bg-[#10B981]' : 'bg-blue-600 dark:bg-[#0066FF] hover:bg-blue-700 dark:hover:bg-[#0052CC]'}`}
                                >
                                    {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProfessionalAccountTab = () => {
    const { user, updateProfile } = useAuth()
    const originalRef = useRef({ especialidad: '', cedula: '' })

    const [ready, setReady] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [chartMetric, setChartMetric] = useState('revenue')
    const [summaryOpen, setSummaryOpen] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [showPw, setShowPw] = useState(false)
    const [notif, setNotif] = useState({ emailReminders: true })
    const [profile, setProfile] = useState({
        nombre: '', apellido: '', email: '', country: '', genero: '', especialidad: '', cedula: '',
    })
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

    const availableYears = Object.keys(MOCK).map(Number).sort((a, b) => b - a)
    const [year] = useState(new Date().getFullYear())
    const [apiData, setApiData] = useState({})

    useEffect(() => {
        const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')))
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => obs.disconnect()
    }, [])

    useEffect(() => {
        if (!user) return
        const dp = user.datosPersonales ?? {}
        const esp = dp.especialidad || user.especialidad || ''
        const ced = dp.cedulaProfesional || user.cedula || ''
        originalRef.current = { especialidad: esp, cedula: ced }
        setProfile({
            nombre: user.nombre || user.name || '',
            apellido: user.apellido || '',
            email: user.email || user.correo || '',
            country: user.country || '',
            genero: (user.gender || user.genero || '').toLowerCase(),
            especialidad: esp, cedula: ced,
        })
        const t = setTimeout(() => setReady(true), 400)
        return () => clearTimeout(t)
    }, [user])

    useEffect(() => {
        if (apiData[year] !== undefined) return
        statsService.getProfessionalStats(year)
            .then(res => setApiData(prev => ({ ...prev, [year]: res.data?.data ?? res.data })))
            .catch(() => setApiData(prev => ({ ...prev, [year]: null })))
    }, [year])

    const data = useMemo(() => {
        const live = apiData[year]
        return live || MOCK[year] || MOCK[availableYears[0]]
    }, [year, apiData, availableYears])

    const prevData = useMemo(() => {
        const live = apiData[year - 1]
        return live !== undefined ? live : MOCK[year - 1]
    }, [year, apiData])

    const handleChangeProfile = (key, val) => {
        setProfile(prev => ({ ...prev, [key]: val }))
        setIsDirty(true)
    }

    const handleDiscard = () => {
        const dp = user?.datosPersonales ?? {}
        setProfile({
            nombre: user?.nombre || user?.name || '',
            apellido: user?.apellido || '',
            email: user?.email || user?.correo || '',
            country: user?.country || '',
            genero: (user?.gender || user?.genero || '').toLowerCase(),
            especialidad: dp.especialidad || user?.especialidad || '',
            cedula: dp.cedulaProfesional || user?.cedula || '',
        })
        setIsDirty(false)
        setSaveError(null)
    }

    const handleSave = async () => {
        setSaveError(null)
        setSaving(true)
        const emailChanged = profile.email !== (user?.email || user?.correo || '')
        const diff = {}
        if (profile.nombre !== (user?.nombre || user?.name || '')) diff.nombre = profile.nombre
        if (profile.apellido !== (user?.apellido || '')) diff.apellido = profile.apellido
        if (profile.country !== (user?.country || '')) diff.country = profile.country.toUpperCase()
        if (profile.genero !== (user?.gender || user?.genero || '').toLowerCase()) diff.gender = profile.genero
        if (profile.especialidad !== originalRef.current.especialidad) diff.especialidad = profile.especialidad
        if (profile.cedula !== originalRef.current.cedula) diff.cedulaProfesional = profile.cedula
        const tasks = []
        if (Object.keys(diff).length > 0) tasks.push(professionalsService.updateProfile(diff))
        if (emailChanged) tasks.push(updateProfile({ email: profile.email }))
        const results = await Promise.allSettled(tasks)
        const failed = results.find(r => r.status === 'rejected')
        setSaving(false)
        if (failed) {
            setSaveError(failed.reason?.message || 'Error al guardar.')
        } else {
            setSaved(true)
            setIsDirty(false)
            setTimeout(() => { setSaved(false); setModalOpen(false) }, 1500)
        }
    }

    if (!ready) return (
        <div className="-m-8 min-h-[calc(100%+4rem)] bg-gray-50 dark:bg-[#0F1419] flex flex-col">
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-10 py-6 border-b border-gray-100 dark:border-[#2A3F5F]">
                <div className="flex flex-col gap-3">
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-36 rounded-md" />
                        <Skeleton className="h-3 w-44 rounded-full" />
                        <Skeleton className="h-3 w-28 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>

            <div className="p-8 flex flex-col gap-8">
                {/* Metrics grid skeleton */}
                <div className="bg-gray-100 dark:bg-[#1A2332] rounded-2xl border border-gray-200 dark:border-[#2A3F5F] px-2 py-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#0F1419] rounded-2xl px-3 pt-2.5 pb-3 flex flex-col gap-2">
                            <Skeleton className="h-2.5 w-20 rounded-full" />
                            <Skeleton className="h-6 w-12 rounded" />
                        </div>
                    ))}
                </div>

                {/* Chart skeleton */}
                <div className="bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3F5F] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-8 w-44 rounded-lg" />
                    </div>
                    <Skeleton className="h-75 rounded-lg" />
                </div>

                {/* Summary row skeleton */}
                <Skeleton className="h-12 rounded-lg" />
            </div>
        </div>
    )

    // Derived
    const heroName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user?.name || 'Profesional'
    const heroInitials = heroName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const heroSpec = profile.especialidad || user?.specialty || user?.especialidad || 'Profesional de Salud'
    const countryName = PROFESSIONAL_COUNTRIES.find(c => c.code === profile.country)?.name || null

    const retention = data.totalPatients > 0 ? Math.round((data.activePatients / data.totalPatients) * 100) : 0
    const revPerPatient = data.totalPatients > 0 ? Math.round(data.totalRevenue / data.totalPatients) : 0
    const dRevenue = prevData ? calcDelta(data.totalRevenue, prevData.totalRevenue) : null
    const dPatients = prevData ? calcDelta(data.activePatients, prevData.activePatients) : null
    const dRetention = prevData && prevData.totalPatients > 0
        ? calcDelta(retention, Math.round((prevData.activePatients / prevData.totalPatients) * 100))
        : null

    const CHART = {
        revenue: { rawData: data.monthlyRevenue, formatter: fmt$, color: '#0066FF', activeCls: 'bg-blue-600 dark:bg-[#0066FF]' },
        hours: { rawData: data.monthlyHours, formatter: v => `${v}h`, color: '#10B981', activeCls: 'bg-emerald-500 dark:bg-[#10B981]' },
        patients: { rawData: data.monthlyPatients, formatter: String, color: '#00D4FF', activeCls: 'bg-cyan-400 dark:bg-[#00D4FF]' },
    }
    const cc = CHART[chartMetric]
    const chartData = cc.rawData.map((v, i) => ({ month: MONTHS[i], value: v }))

    // Recharts SVG props — can't use Tailwind classes, derive from isDark state
    const chartTickFill = isDark ? '#8B96B1' : '#9CA3AF'
    const chartGridStroke = isDark ? '#2A3F5F' : '#E5E7EB'
    const chartDotStroke = isDark ? '#1A2332' : '#F9FAFB'

    return (
        <>
            <div className="-m-8 min-h-[calc(100%+4rem)] bg-gray-50 dark:bg-[#0F1419]">
                {/* ══ 1. HEADER ════════════════════════════════════════════════ */}
                <div className="flex items-center justify-between px-10 py-6 border-b border-gray-100 dark:border-[#2A3F5F]">
                    <div className="flex flex-col gap-3">
                        {/* Avatar */}
                        <div className="size-28 rounded-full shrink-0 bg-gray-100 dark:bg-[#1A2332] border-2 border-gray-200 dark:border-[#2A3F5F] flex items-center justify-center text-4xl font-bold text-gray-700 dark:text-[#F5F7FA]">
                            {heroInitials}
                        </div>
                        {/* Identity */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xl font-bold text-gray-900 dark:text-[#F5F7FA] leading-tight">{heroName}</span>
                            <div className="inline-flex items-center gap-1">
                                <BadgeCheck size={14} fill="#0066FF" className="text-white" strokeWidth={2.5} />
                                <span className="text-[11px] font-semibold text-gray-500 dark:text-[#B8C5D6]">Verificado por Totalmente</span>
                            </div>
                            <div className="flex items-center gap-3.5 flex-wrap">
                                <span className="flex items-center gap-1 text-[13px] text-gray-400 dark:text-[#8B96B1]">
                                    <Briefcase size={13} /> {heroSpec}
                                </span>
                            </div>
                            {countryName && (
                                <span className="flex items-center gap-1 text-[13px] text-gray-400 dark:text-[#8B96B1]">
                                    <MapPin size={13} /> {countryName}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* CTA */}
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg shrink-0 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A2332] dark:hover:bg-[#2A3F5F] border border-gray-200 dark:border-[#2A3F5F] text-gray-700 dark:text-[#F5F7FA] text-[13px] font-semibold cursor-pointer transition-colors duration-150"
                    >
                        <Pencil size={14} /> Editar perfil
                    </button>
                </div>

                {/* ── Content ───────────────────────────────────────────────── */}
                <div className="p-8 flex flex-col gap-8">

                    {/* ══ 2. PRIMARY METRICS ════════════════════════════════════ */}
                    <div className="bg-gray-100 dark:bg-[#1A2332] rounded-2xl border border-gray-200 dark:border-[#2A3F5F] px-2 py-2 grid grid-cols-2 lg:grid-cols-4 gap-2 overflow-hidden">
                        <MetricCard icon={Users} iconColor="text-cyan-500 dark:text-[#00D4FF]" label="Pacientes activos" value={data.activePatients} d={dPatients} />
                        <MetricCard icon={Clock} iconColor="text-gray-400 dark:text-[#8B96B1]" label="Duración promedio" value={`${data.avgSessionMin}m`} d={null} />
                        <MetricCard icon={DollarSign} iconColor="text-blue-600 dark:text-[#0066FF]" label="Ingresos mensuales" value={fmt$(Math.round(data.totalRevenue / 12))} d={dRevenue} />
                        <MetricCard icon={TrendingUp} iconColor="text-emerald-500 dark:text-[#10B981]" label="Retención" value={`${retention}%`} d={dRetention} />
                    </div>

                    {/* ══ 3. MAIN CHART ════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3F5F] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm font-semibold text-gray-500 dark:text-[#B8C5D6]">Tendencia anual</span>
                            <div className="flex gap-1 bg-gray-100 dark:bg-[#0F1419] rounded-lg p-1">
                                {[
                                    { key: 'revenue', label: 'Ingresos' },
                                    { key: 'hours', label: 'Horas' },
                                    { key: 'patients', label: 'Pacientes' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setChartMetric(key)}
                                        className={`px-3.5 py-1 rounded-md text-xs font-semibold border-none cursor-pointer transition-all duration-150
                                            ${chartMetric === key
                                                ? `${CHART[key].activeCls} text-white`
                                                : 'bg-transparent text-gray-400 dark:text-[#8B96B1] hover:text-gray-600 dark:hover:text-[#B8C5D6]'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={chartMetric} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id={`grad-${chartMetric}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={cc.color} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={cc.color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: chartTickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: chartTickFill, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={cc.formatter} width={58} />
                                        <Tooltip content={makeTooltip(cc.formatter)} />
                                        <Area type="monotone" dataKey="value" stroke={cc.color} strokeWidth={2} fill={`url(#grad-${chartMetric})`} animationDuration={450} dot={false} activeDot={{ r: 4, fill: cc.color, stroke: chartDotStroke, strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ══ 4. YEAR-TO-DATE SUMMARY (collapsed) ══════════════════ */}
                    <div>
                        <button
                            onClick={() => setSummaryOpen(o => !o)}
                            className={`flex items-center justify-between w-full px-5 py-3.5 bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3F5F] cursor-pointer text-gray-500 dark:text-[#B8C5D6] text-[13px] font-semibold transition-all hover:border-gray-300 dark:hover:border-[#3A5F8F]
                                ${summaryOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
                        >
                            <span>Resumen del año</span>
                            {summaryOpen
                                ? <ChevronUp size={16} className="text-gray-400 dark:text-[#8B96B1]" />
                                : <ChevronDown size={16} className="text-gray-400 dark:text-[#8B96B1]" />}
                        </button>
                        <AnimatePresence>
                            {summaryOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 dark:bg-[#2A3F5F] border border-gray-200 dark:border-[#2A3F5F] border-t-0 rounded-b-lg overflow-hidden">
                                        {[
                                            { label: 'Ingresos totales', value: fmt$(data.totalRevenue), icon: DollarSign, color: 'text-blue-600 dark:text-[#0066FF]' },
                                            { label: 'Horas totales', value: `${data.therapyHours}h`, icon: Clock, color: 'text-emerald-500 dark:text-[#10B981]' },
                                            { label: 'Ingreso / paciente', value: fmt$(revPerPatient), icon: TrendingUp, color: 'text-cyan-500 dark:text-[#00D4FF]' },
                                        ].map(({ label, value, icon: Icon, color }) => (
                                            <div key={label} className="bg-white dark:bg-[#1A2332] p-5 flex flex-col gap-2">
                                                <Icon size={18} className={color} strokeWidth={1.75} />
                                                <span className="text-[22px] font-bold text-gray-900 dark:text-[#F5F7FA] leading-none tabular-nums">{value}</span>
                                                <span className="text-[11px] font-semibold text-gray-400 dark:text-[#8B96B1] uppercase tracking-[0.5px]">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ══ 5. FOOTER ════════════════════════════════════════════ */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#2A3F5F] pt-6">
                        <div className="flex items-center gap-2.5">
                            <Bell size={16} className="text-gray-400 dark:text-[#8B96B1]" strokeWidth={1.75} />
                            <span className="text-sm text-gray-500 dark:text-[#B8C5D6]">Recordatorio 24h antes</span>
                        </div>
                        <FToggle checked={notif.emailReminders} onChange={v => setNotif(prev => ({ ...prev, emailReminders: v }))} />
                    </div>

                </div>
            </div>

            {/* ══ PROFILE MODAL ════════════════════════════════════════════════ */}
            <ProfileModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                profile={profile}
                onChangeProfile={handleChangeProfile}
                saving={saving}
                saved={saved}
                saveError={saveError}
                onSave={handleSave}
                onDiscard={handleDiscard}
                showPw={showPw}
                setShowPw={setShowPw}
                notif={notif}
                onChangeNotif={(key, val) => setNotif(prev => ({ ...prev, [key]: val }))}
            />
        </>
    )
}

export default ProfessionalAccountTab
