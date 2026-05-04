import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import {
    Bell, Shield, Building2, Check, ChevronRight,
    Key, DollarSign,
} from 'lucide-react'
import { getCurrencyForCountry } from '@shared/constants/subscriptionPlans'
import { professionalsService } from '@shared/services/professionalsService'

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'
                }`}
        />
    </button>
)

// ─── Section card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, icon: Icon, iconColor = 'text-blue-600 dark:text-blue-400', iconBg = 'bg-blue-50 dark:bg-blue-900/40', children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
    >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">{title}</h2>
                {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700/50">{children}</div>
    </motion.div>
)

// ─── Setting row ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children, danger }) => (
    <div className={`flex items-center justify-between gap-4 px-5 py-3.5 ${danger ? 'hover:bg-red-50 dark:hover:bg-red-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'} transition-colors`}>
        <div className="min-w-0">
            <p className={`text-sm font-medium leading-none ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>{label}</p>
            {description && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1 leading-snug">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
)

// ─── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
        amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
        red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
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
        className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
    >
        {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
        ))}
    </select>
)

// ─── Main component ────────────────────────────────────────────────────────────
const ProfessionalSettings = ({ embedded = false }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [saved, setSaved] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    const countryInfo = getCurrencyForCountry(user?.country)

    // Notifications
    const [notif, setNotif] = useState({
        emailAppointments: true,
        emailReminders: true,
        push: true,
    })

    const [practice, setPractice] = useState(() => {
        try {
            const saved = sessionStorage.getItem('professionalSettings')
            if (saved) {
                const parsed = JSON.parse(saved)
                return {
                    ...{
                        videoCallEnabled: true,
                        autoConfirm: false,
                        reminderHours: '24',
                        sessionDuration: '60',
                        currency: 'MXN',
                        sessionTypePrices: { primeraSesion: 50, seguimiento: 40, extraordinaria: 70 },
                    }, ...parsed
                }
            }
        } catch { /* ignore */ }
        const defaultCurrency = getCurrencyForCountry(user?.country).currency
        return {
            videoCallEnabled: true,
            autoConfirm: false,
            reminderHours: '24',
            sessionDuration: '60',
            currency: defaultCurrency,
            sessionTypePrices: { primeraSesion: 50, seguimiento: 40, extraordinaria: 70 },
        }
    })


    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setP = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    const handleSave = async () => {
        // Always cache locally
        sessionStorage.setItem('professionalSettings', JSON.stringify(practice))
        localStorage.setItem('professionalSettings', JSON.stringify({
            currency: practice.currency,
            sessionTypePrices: practice.sessionTypePrices,
        }))
        try {
            await professionalsService.updateMyTarifas(practice.sessionTypePrices)
        } catch { /* API not available yet — saved locally */ }
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const fullName = user?.name || user?.nombre || 'Profesional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className={embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6 lg:p-8'}>
            <div className={embedded ? 'space-y-5' : 'max-w-full space-y-5'}>
            
                {/* ── Header ── */}
                {/* {!embedded ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-none">Configuración</h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Personaliza tu experiencia en TotalMente</p>
                        </div>
                        <motion.button
                            onClick={handleSave}
                            whileTap={{ scale: 0.96 }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${saved
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
                ) : (
                    <div className="flex items-center justify-end">
                        <motion.button
                            onClick={handleSave}
                            whileTap={{ scale: 0.96 }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${saved
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
                    </div>
                )} */}

                {/* ── Account chip ── */}
                {!embedded && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 px-5 py-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none truncate">{fullName}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user?.email || user?.correo || ''}</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/professional/profile')}
                            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 shrink-0"
                        >
                            Editar perfil <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}

                {/* ── Notifications ── */}
                <SectionCard
                    title="Notificaciones"
                    subtitle="Elige cómo y cuándo recibir alertas"
                    icon={Bell}
                    iconColor="text-sky-600 dark:text-sky-400"
                    iconBg="bg-sky-50 dark:bg-sky-900/40"
                >
                    <SettingRow label="Nuevas citas por correo" description="Recibe un correo cuando un paciente agende">
                        <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} />
                    </SettingRow>
                    <SettingRow label="Recordatorios por correo" description="24 h antes de cada sesión programada">
                        <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} />
                    </SettingRow>
                    <SettingRow label="Notificaciones push" description="Citas, sesiones y mensajes de pacientes">
                        <Toggle checked={notif.push} onChange={setN('push')} />
                    </SettingRow>
                </SectionCard>

                {/* ── Security ── */}
                <SectionCard
                    title="Seguridad"
                    subtitle="Controla el acceso y la privacidad de tu cuenta"
                    icon={Shield}
                    iconColor="text-violet-600 dark:text-violet-400"
                    iconBg="bg-violet-50 dark:bg-violet-900/40"
                >
                    <SettingRow label="Cambiar contraseña" description="Actualiza tu contraseña regularmente">
                        <button
                            onClick={() => setShowPasswordForm(s => !s)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            <Key className="w-3.5 h-3.5" /> {showPasswordForm ? 'Cancelar' : 'Actualizar'}
                        </button>
                    </SettingRow>
                    <AnimatePresence>
                        {showPasswordForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-4 pt-1">
                                    <ChangePasswordForm />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SectionCard>

                {/* ── Practice ── */}
                <SectionCard
                    title="Mi consulta"
                    subtitle="Configura las opciones de tu práctica clínica"
                    icon={Building2}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    iconBg="bg-emerald-50 dark:bg-emerald-900/40"
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
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/60 rounded-xl">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{countryInfo.symbol} {countryInfo.currency}</span>
                            <span className="text-[11px] text-gray-500">— {countryInfo.currencyLabel}</span>
                        </div>
                    </SettingRow>

                    {/* ── Prices per session type ── */}
                    <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Precio por tipo de sesión</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-4">Estos precios se usarán como valor predeterminado al crear una nueva cita.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'primeraSesion', label: 'Primera consulta', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 dark:bg-blue-400' },
                                { key: 'seguimiento', label: 'Seguimiento', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
                                { key: 'extraordinaria', label: 'Extraordinaria', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500 dark:bg-amber-400' },
                            ].map(({ key, label, color, dot }) => (
                                <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600/60">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                                        <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 dark:text-gray-400 pointer-events-none">
                                            {practice.currency === 'EUR' ? '€' : practice.currency === 'USD' ? '$' : '$'}
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={String(practice.sessionTypePrices?.[key] ?? '')}
                                            onChange={(e) => {
                                              const val = e.target.value
                                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                setPractice(prev => ({
                                                  ...prev,
                                                  sessionTypePrices: {
                                                    ...prev.sessionTypePrices,
                                                    [key]: val === '' ? 0 : parseFloat(val) || 0,
                                                  },
                                                }))
                                              }
                                            }}
                                            className="w-full pl-6 pr-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>


                {/* bottom spacer for mobile nav */}
                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalSettings
