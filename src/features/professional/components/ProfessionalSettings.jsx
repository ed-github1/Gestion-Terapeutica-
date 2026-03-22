import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import {
    Bell, Shield, Building2, Check, ChevronRight,
    Key, DollarSign, Crown, Sparkles, ArrowUpRight,
} from 'lucide-react'
import { PLAN_TYPES, PLAN_LIMITS } from '@shared/constants/subscriptionPlans'

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
            checked ? 'bg-blue-600' : 'bg-gray-600'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
)

// ─── Section card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, icon: Icon, iconColor = 'text-blue-400', iconBg = 'bg-blue-900/40', children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl border border-gray-700 shadow-sm overflow-hidden"
    >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-100 leading-none">{title}</h2>
                {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="divide-y divide-gray-700/50">{children}</div>
    </motion.div>
)

// ─── Setting row ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children, danger }) => (
    <div className={`flex items-center justify-between gap-4 px-5 py-3.5 ${danger ? 'hover:bg-red-900/30' : 'hover:bg-gray-700/40'} transition-colors`}>
        <div className="min-w-0">
            <p className={`text-sm font-medium leading-none ${danger ? 'text-red-400' : 'text-gray-200'}`}>{label}</p>
            {description && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
)

// ─── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-900/40 text-blue-300 border-blue-800',
        green: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
        amber: 'bg-amber-900/40 text-amber-300 border-amber-800',
        red: 'bg-red-900/40 text-red-300 border-red-800',
    }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colors[color]}`}>
            {label}
        </span>
    )
}

// ─── Select ────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
    >
        {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
        ))}
    </select>
)

// ─── Plan & Subscription Section ──────────────────────────────────────────────
const planMeta = {
    [PLAN_TYPES.GRATUITO]: { label: 'Gratuito', color: 'amber', icon: null },
    [PLAN_TYPES.PRO]:      { label: 'Pro',       color: 'blue',  icon: Crown },
    [PLAN_TYPES.EMPRESA]:  { label: 'Empresa',   color: 'green', icon: Crown },
}

const PlanSection = ({ user, navigate }) => {
    const rawPlan = (user?.plan || user?.subscriptionPlan || user?.planType || PLAN_TYPES.GRATUITO).toUpperCase()
    const plan    = planMeta[rawPlan] ? rawPlan : PLAN_TYPES.GRATUITO
    const meta    = planMeta[plan]
    const limits  = PLAN_LIMITS[plan]
    const isFree  = plan === PLAN_TYPES.GRATUITO

    return (
        <SectionCard
            title="Plan y suscripción"
            subtitle="Gestiona tu plan y accede a funciones avanzadas"
            icon={Crown}
            iconColor="text-blue-400"
            iconBg="bg-blue-900/40"
        >
            {/* Current plan row */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-200 leading-none">Plan actual</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                        {isFree
                            ? `Hasta ${limits.maxPatients} pacientes · ${limits.videoCallMinutes} min de videollamada`
                            : `Hasta ${limits.maxPatients} pacientes · ${limits.videoCallMinutes} min de videollamada · ${limits.storageGB} GB`}
                    </p>
                </div>
                <Badge label={meta.label} color={meta.color} />
            </div>

            {/* Upgrade CTA — only for free plan */}
            {isFree && (
                <div className="px-5 py-4 border-t border-gray-700/50">
                    <div className="relative rounded-xl overflow-hidden border border-blue-800/50 bg-blue-950/40 p-4">
                        {/* gradient accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, #0075C9, #54C0E8, #AEE058)' }} />
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-900/60 border border-blue-800/50 flex items-center justify-center shrink-0">
                                <Crown className="w-4.5 h-4.5 text-blue-300" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-sm font-bold text-blue-100">Actualiza al Plan Pro</p>
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <p className="text-[11px] text-blue-300/70 leading-relaxed mb-3">
                                    Citas ilimitadas, hasta 50 pacientes, estadísticas avanzadas y soporte prioritario.
                                </p>
                                <motion.button
                                    onClick={() => navigate('/pricing')}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                >
                                    Ver planes <ArrowUpRight className="w-3.5 h-3.5" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage subscription — for paid plans */}
            {!isFree && (
                <SettingRow label="Gestionar suscripción" description="Facturación, facturas y cancelación">
                    <button
                        onClick={() => navigate('/pricing')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Gestionar <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                </SettingRow>
            )}
        </SectionCard>
    )
}

// ─── Main component ────────────────────────────────────────────────────────────
const ProfessionalSettings = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [saved, setSaved] = useState(false)

    // Notifications
    const [notif, setNotif] = useState({
        emailAppointments: true,
        emailReminders: true,
        pushAppointments: true,
        pushMessages: true,
    })

    // Security
    const [security, setSecurity] = useState({
        twoFactor: user?.twoFactorEnabled || false,
        sessionLock: true,
    })

    const [practice, setPractice] = useState(() => {
        try {
            const saved = sessionStorage.getItem('professionalSettings')
            if (saved) {
                const parsed = JSON.parse(saved)
                return { ...{
                    videoCallEnabled: true,
                    autoConfirm: false,
                    reminderHours: '24',
                    sessionDuration: '60',
                    currency: 'MXN',
                    sessionTypePrices: { consultation: 50, followup: 40, therapy: 70, emergency: 90 },
                }, ...parsed }
            }
        } catch { /* ignore */ }
        return {
            videoCallEnabled: true,
            autoConfirm: false,
            reminderHours: '24',
            sessionDuration: '60',
            currency: 'MXN',
            sessionTypePrices: { consultation: 50, followup: 40, therapy: 70, emergency: 90 },
        }
    })

    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setS = (key) => (val) => setSecurity(prev => ({ ...prev, [key]: val }))
    const setP = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    const handleSave = () => {
        // TODO: connect to API
        try { sessionStorage.setItem('professionalSettings', JSON.stringify(practice)) } catch { /* ignore */ }
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const fullName = user?.name || user?.nombre || 'Profesional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="min-h-screen bg-gray-900 p-3 md:p-6 lg:p-8">
            <div className="max-w-full space-y-5">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-base font-bold text-gray-100 leading-none">Configuración</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5">Personaliza tu experiencia en TotalMente</p>
                    </div>
                    <motion.button
                        onClick={handleSave}
                        whileTap={{ scale: 0.96 }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${
                            saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {saved ? (
                            <><Check className="w-4 h-4" />Guardado</>
                        ) : (
                            'Guardar cambios'
                        )}
                    </motion.button>
                </motion.div>

                {/* ── Account chip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="bg-gray-800 rounded-2xl border border-gray-700 shadow-sm flex items-center gap-4 px-5 py-4"
                >
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-100 leading-none truncate">{fullName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{user?.email || user?.correo || ''}</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/professional/profile')}
                        className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold hover:text-blue-300 shrink-0"
                    >
                        Editar perfil <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </motion.div>

                {/* ── Notifications ── */}
                <SectionCard
                    title="Notificaciones"
                    subtitle="Elige cómo y cuándo recibir alertas"
                    icon={Bell}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-900/40"
                >
                    <SettingRow label="Nuevas citas por correo" description="Recibe un correo cuando un paciente agende">
                        <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} />
                    </SettingRow>
                    <SettingRow label="Recordatorios por correo" description="24 h antes de cada sesión programada">
                        <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} />
                    </SettingRow>
                    <SettingRow label="Push: citas y sesiones">
                        <Toggle checked={notif.pushAppointments} onChange={setN('pushAppointments')} />
                    </SettingRow>
                    <SettingRow label="Push: mensajes de pacientes">
                        <Toggle checked={notif.pushMessages} onChange={setN('pushMessages')} />
                    </SettingRow>
                </SectionCard>

                {/* ── Security ── */}
                <SectionCard
                    title="Seguridad"
                    subtitle="Controla el acceso y la privacidad de tu cuenta"
                    icon={Shield}
                    iconColor="text-violet-400"
                    iconBg="bg-violet-900/40"
                >
                    <SettingRow
                        label="Verificación en dos pasos (2FA)"
                        description="Añade una capa extra de seguridad al iniciar sesión"
                    >
                        <div className="flex items-center gap-2">
                            <Badge label={security.twoFactor ? 'Activo' : 'Inactivo'} color={security.twoFactor ? 'green' : 'amber'} />
                            <Toggle checked={security.twoFactor} onChange={setS('twoFactor')} />
                        </div>
                    </SettingRow>
                    <SettingRow
                        label="Bloqueo de sesión automático"
                        description="Bloquea la pantalla tras 15 min de inactividad"
                    >
                        <Toggle checked={security.sessionLock} onChange={setS('sessionLock')} />
                    </SettingRow>
                    <SettingRow label="Cambiar contraseña" description="Última actualización hace 90 días">
                        <button
                            onClick={() => {/* TODO */}}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <Key className="w-3.5 h-3.5" /> Actualizar
                        </button>
                    </SettingRow>
                </SectionCard>

                {/* ── Practice ── */}
                <SectionCard
                    title="Mi consulta"
                    subtitle="Configura las opciones de tu práctica clínica"
                    icon={Building2}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-900/40"
                >
                    <SettingRow label="Videollamadas habilitadas" description="Permitir sesiones de videollamada con pacientes">
                        <Toggle checked={practice.videoCallEnabled} onChange={setP('videoCallEnabled')} />
                    </SettingRow>
                    <SettingRow label="Confirmar citas automáticamente" description="Sin requerir tu aprobación manual">
                        <Toggle checked={practice.autoConfirm} onChange={setP('autoConfirm')} />
                    </SettingRow>
                    <SettingRow label="Recordatorios antes de la cita">
                        <Select
                            value={practice.reminderHours}
                            onChange={setP('reminderHours')}
                            options={[
                                { value: '1', label: '1 hora antes' },
                                { value: '2', label: '2 horas antes' },
                                { value: '24', label: '24 horas antes' },
                                { value: '48', label: '48 horas antes' },
                            ]}
                        />
                    </SettingRow>
                    <SettingRow label="Duración de sesión por defecto">
                        <Select
                            value={practice.sessionDuration}
                            onChange={setP('sessionDuration')}
                            options={[
                                { value: '30', label: '30 min' },
                                { value: '45', label: '45 min' },
                                { value: '60', label: '60 min' },
                                { value: '90', label: '90 min' },
                            ]}
                        />
                    </SettingRow>
                    <SettingRow label="Moneda de facturación">
                        <Select
                            value={practice.currency}
                            onChange={setP('currency')}
                            options={[
                                { value: 'MXN', label: 'MXN — Peso mexicano' },
                                { value: 'USD', label: 'USD — Dólar' },
                                { value: 'EUR', label: 'EUR — Euro' },
                            ]}
                        />
                    </SettingRow>

                    {/* ── Prices per session type ── */}
                    <div className="px-5 py-4 border-t border-gray-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Precio por tipo de sesión</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-4">Estos precios se usarán como valor predeterminado al crear una nueva cita.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'consultation', label: 'Consulta general',  color: 'text-blue-400',   dot: 'bg-blue-400' },
                                { key: 'followup',     label: 'Seguimiento',        color: 'text-emerald-400', dot: 'bg-emerald-400' },
                                { key: 'therapy',      label: 'Terapia',            color: 'text-violet-400', dot: 'bg-violet-400' },
                                { key: 'emergency',    label: 'Emergencia',         color: 'text-red-400',    dot: 'bg-red-400' },
                            ].map(({ key, label, color, dot }) => (
                                <div key={key} className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/60">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                                        <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                                            {practice.currency === 'EUR' ? '€' : practice.currency === 'USD' ? '$' : '$'}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={practice.sessionTypePrices?.[key] ?? ''}
                                            onChange={(e) => setPractice(prev => ({
                                                ...prev,
                                                sessionTypePrices: {
                                                    ...prev.sessionTypePrices,
                                                    [key]: parseFloat(e.target.value) || 0,
                                                },
                                            }))}
                                            className="w-full pl-6 pr-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                {/* ── Plan & Subscription ── */}
                <PlanSection user={user} navigate={navigate} />

                {/* bottom spacer for mobile nav */}
                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalSettings
