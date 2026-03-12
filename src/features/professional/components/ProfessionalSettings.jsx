import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import {
    Bell, Shield, Palette, Building2, Globe, Moon, Sun,
    Mail, Smartphone, MessageSquare, Video, Lock,
    Key, Trash2, AlertTriangle, Check, ChevronRight,
    Volume2, VolumeX, Eye, EyeOff,
} from 'lucide-react'

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

// ─── Main component ────────────────────────────────────────────────────────────
const ProfessionalSettings = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [saved, setSaved] = useState(false)

    // Notifications
    const [notif, setNotif] = useState({
        emailAppointments: true,
        emailReminders: true,
        emailMarketing: false,
        pushAppointments: true,
        pushMessages: true,
        pushPayments: true,
        smsReminders: false,
        soundEnabled: true,
    })

    // Security
    const [security, setSecurity] = useState({
        twoFactor: user?.twoFactorEnabled || false,
        sessionLock: true,
        showActivity: true,
    })

    // Appearance
    const [appearance, setAppearance] = useState({
        theme: 'light',
        language: 'es',
        compactMode: false,
    })

    // Practice
    const [practice, setPractice] = useState({
        videoCallEnabled: true,
        autoConfirm: false,
        reminderHours: '24',
        sessionDuration: '60',
        currency: 'MXN',
    })

    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setS = (key) => (val) => setSecurity(prev => ({ ...prev, [key]: val }))
    const setA = (key) => (val) => setAppearance(prev => ({ ...prev, [key]: val }))
    const setP = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    const handleSave = () => {
        // TODO: connect to API
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
                    <div className="px-5 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> Correo electrónico
                        </p>
                    </div>
                    <SettingRow label="Nuevas citas" description="Recibe un correo cuando un paciente agende">
                        <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} />
                    </SettingRow>
                    <SettingRow label="Recordatorios" description="24 h antes de cada sesión programada">
                        <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} />
                    </SettingRow>
                    <SettingRow label="Novedades y promociones" description="Actualizaciones de producto y ofertas">
                        <Toggle checked={notif.emailMarketing} onChange={setN('emailMarketing')} />
                    </SettingRow>

                    <div className="px-5 pt-4 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Smartphone className="w-3 h-3" /> Notificaciones push
                        </p>
                    </div>
                    <SettingRow label="Citas y sesiones">
                        <Toggle checked={notif.pushAppointments} onChange={setN('pushAppointments')} />
                    </SettingRow>
                    <SettingRow label="Mensajes de pacientes">
                        <Toggle checked={notif.pushMessages} onChange={setN('pushMessages')} />
                    </SettingRow>
                    <SettingRow label="Confirmaciones de pago">
                        <Toggle checked={notif.pushPayments} onChange={setN('pushPayments')} />
                    </SettingRow>

                    <div className="px-5 pt-4 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                            <Volume2 className="w-3 h-3" /> Sonido
                        </p>
                    </div>
                    <SettingRow label="Sonidos de notificación" description="Reproducir audio al recibir alertas">
                        <Toggle checked={notif.soundEnabled} onChange={setN('soundEnabled')} />
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
                    <SettingRow
                        label="Registro de actividad"
                        description="Mostrar historial de inicios de sesión y dispositivos"
                    >
                        <Toggle checked={security.showActivity} onChange={setS('showActivity')} />
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

                {/* ── Appearance ── */}
                <SectionCard
                    title="Apariencia"
                    subtitle="Adapta la interfaz a tu gusto"
                    icon={Palette}
                    iconColor="text-pink-400"
                    iconBg="bg-pink-900/40"
                >
                    <SettingRow label="Tema" description="Elige entre claro u oscuro">
                        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                            {[
                                { value: 'light', icon: Sun, label: 'Claro' },
                                { value: 'dark', icon: Moon, label: 'Oscuro' },
                            ].map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setA('theme')(value)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        appearance.theme === value
                                            ? 'bg-gray-600 shadow-sm text-gray-100'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                    <SettingRow label="Idioma">
                        <Select
                            value={appearance.language}
                            onChange={setA('language')}
                            options={[
                                { value: 'es', label: 'Español' },
                                { value: 'en', label: 'English' },
                            ]}
                        />
                    </SettingRow>
                    <SettingRow label="Modo compacto" description="Reduce el espaciado para ver más contenido">
                        <Toggle checked={appearance.compactMode} onChange={setA('compactMode')} />
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
                </SectionCard>

                {/* ── Danger zone ── */}
                <SectionCard
                    title="Zona de peligro"
                    subtitle="Acciones irreversibles para tu cuenta"
                    icon={AlertTriangle}
                    iconColor="text-red-400"
                    iconBg="bg-red-900/40"
                >
                    <SettingRow
                        label="Exportar mis datos"
                        description="Descarga una copia de toda tu información"
                        danger
                    >
                        <button className="text-xs font-semibold text-gray-300 hover:text-gray-100 border border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-all">
                            Exportar
                        </button>
                    </SettingRow>
                    <SettingRow
                        label="Eliminar cuenta"
                        description="Borra permanentemente tu cuenta y todos tus datos"
                        danger
                    >
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-700 rounded-lg px-3 py-1.5 hover:bg-red-900/40 transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                    </SettingRow>
                </SectionCard>

                {/* bottom spacer for mobile nav */}
                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalSettings
