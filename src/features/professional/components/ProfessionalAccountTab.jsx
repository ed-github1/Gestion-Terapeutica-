import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import {
    Bell, Shield, Building2, Check, Key,
    User, Mail, Briefcase, Hash, Globe, AlertCircle, Save,
} from 'lucide-react'
import { getCurrencyForCountry, PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'
import { statsService } from '@shared/services/statsService'
import { professionalsService } from '@shared/services/professionalsService'

// ─── Field helpers ─────────────────────────────────────────────────────────────
const inputClass = `w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
  text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
  disabled:opacity-60 disabled:cursor-not-allowed`

const FieldLabel = ({ icon: Icon, children }) => (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-1.5">
        {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
        {children}
    </label>
)

const Field = ({ label, icon, type = 'text', value, onChange, disabled }) => (
    <div>
        <FieldLabel icon={icon}>{label}</FieldLabel>
        <input type={type} value={value} onChange={onChange} disabled={disabled} className={inputClass} />
    </div>
)

const SelectField = ({ label, icon, value, onChange, disabled, options }) => (
    <div>
        <FieldLabel icon={icon}>{label}</FieldLabel>
        <select value={value} onChange={onChange} disabled={disabled} className={`${inputClass} appearance-none`}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
)

const GENDER_OPTIONS = [
    { value: '',                  label: 'Seleccionar...' },
    { value: 'masculino',         label: 'Masculino' },
    { value: 'femenino',          label: 'Femenino' },
    { value: 'no_binario',        label: 'No binario' },
    { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

const COUNTRY_OPTIONS = [
    { value: '', label: 'Seleccionar país...' },
    ...PROFESSIONAL_COUNTRIES.map(c => ({ value: c.code, label: c.name })),
]

// ─── Layout helpers ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
)

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">{title}</h2>
                {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700/50">{children}</div>
    </div>
)

const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div className="min-w-0">
            <p className="text-sm font-medium leading-none text-gray-800 dark:text-gray-200">{label}</p>
            {description && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
)

const SelectRow = ({ label, value, onChange, options }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
    >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
)

// ─── Main component ─────────────────────────────────────────────────────────────
const ProfessionalAccountTab = () => {
    const { user, updateProfile } = useAuth()
    const [saving, setSaving]           = useState(false)
    const [saved, setSaved]             = useState(false)
    const [saveError, setSaveError]     = useState(null)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    // ── Profile state ──
    const [profile, setProfile] = useState({
        nombre:       user?.nombre      || user?.name          || '',
        apellido:     user?.apellido    || '',
        email:        user?.email       || user?.correo        || '',
        country:      user?.country     || '',
        genero:       user?.gender      || user?.genero        || '',
        especialidad: user?.specialty   || user?.especialidad  || '',
        cedula:       user?.licenseNumber || user?.numeroLicencia || '',
    })

    // ── Settings state ──
    const [notif, setNotif] = useState({
        emailAppointments: true,
        emailReminders:    true,
        push:              true,
    })

    const [practice, setPractice] = useState(() => {
        try {
            const stored = sessionStorage.getItem('professionalSettings')
            if (stored) return { videoCallEnabled: true, autoConfirm: false, reminderHours: '24', sessionDuration: '60', ...JSON.parse(stored) }
        } catch { /* ignore */ }
        return { videoCallEnabled: true, autoConfirm: false, reminderHours: '24', sessionDuration: '60' }
    })

    const setP = (key) => (e) => setProfile(prev => ({ ...prev, [key]: typeof e === 'string' ? e : e.target.value }))
    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setPr = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    // Currency follows the country currently selected in the form
    const countryInfo = getCurrencyForCountry(profile.country) ?? getCurrencyForCountry(user?.country)

    const handleSave = async (e) => {
        e.preventDefault()
        setSaveError(null)
        setSaving(true)

        // Email → PATCH /api/auth/me (separate endpoint per backend spec)
        const emailChanged = profile.email !== (user?.email || user?.correo || '')

        // All other profile fields → PATCH /api/professional/profile
        const profileDiff = {}
        if (profile.nombre       !== (user?.nombre        || user?.name           || '')) profileDiff.nombre       = profile.nombre
        if (profile.apellido     !== (user?.apellido       || ''))                         profileDiff.apellido     = profile.apellido
        if (profile.country      !== (user?.country        || ''))                         profileDiff.country      = profile.country.toUpperCase()
        if (profile.genero       !== (user?.gender         || user?.genero         || '')) profileDiff.genero       = profile.genero
        if (profile.especialidad !== (user?.specialty      || user?.especialidad   || '')) profileDiff.especialidad = profile.especialidad
        if (profile.cedula       !== (user?.licenseNumber  || user?.numeroLicencia || '')) profileDiff.cedula       = profile.cedula

        sessionStorage.setItem('professionalSettings', JSON.stringify(practice))
        localStorage.setItem('professionalSettings', JSON.stringify({ currency: countryInfo?.currency }))

        const tasks = [
            statsService.updateProfessionalSettings({
                notifications:    notif,
                videoCallEnabled: practice.videoCallEnabled,
                autoConfirm:      practice.autoConfirm,
                reminderHours:    practice.reminderHours,
                sessionDuration:  practice.sessionDuration,
            }),
        ]
        if (Object.keys(profileDiff).length > 0) tasks.push(professionalsService.updateProfile(profileDiff))
        if (emailChanged) tasks.push(updateProfile({ email: profile.email }))

        const results = await Promise.allSettled(tasks)
        const failed  = results.find(r => r.status === 'rejected')

        setSaving(false)
        if (failed) {
            setSaveError(failed.reason?.message || 'Error al guardar. Intenta de nuevo.')
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-5">

            {/* ── Personal info ── */}
            <SectionCard title="Información personal" subtitle="Tu nombre, correo y datos de identificación" icon={User}>
                <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre"   icon={User} value={profile.nombre}   onChange={setP('nombre')}   disabled={saving} />
                        <Field label="Apellido" icon={User} value={profile.apellido} onChange={setP('apellido')} disabled={saving} />
                    </div>
                    <Field label="Correo electrónico" icon={Mail} type="email" value={profile.email} onChange={setP('email')} disabled={saving} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField label="País" icon={Globe} value={profile.country} onChange={setP('country')} disabled={saving} options={COUNTRY_OPTIONS} />
                        <SelectField label="Género" icon={User} value={profile.genero} onChange={setP('genero')} disabled={saving} options={GENDER_OPTIONS} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Especialidad"      icon={Briefcase} value={profile.especialidad} onChange={setP('especialidad')} disabled={saving} />
                        <Field label="Cédula / Licencia" icon={Hash}      value={profile.cedula}       onChange={setP('cedula')}       disabled={saving} />
                    </div>
                </div>
            </SectionCard>

            {/* ── Notifications ── */}
            <SectionCard title="Notificaciones" subtitle="Elige cómo y cuándo recibir alertas" icon={Bell}>
                <SettingRow label="Nuevas citas por correo" description="Recibe un correo cuando un paciente agende">
                    <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} disabled={saving} />
                </SettingRow>
                <SettingRow label="Recordatorios por correo" description="24 h antes de cada sesión programada">
                    <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} disabled={saving} />
                </SettingRow>
                <SettingRow label="Notificaciones push" description="Citas, sesiones y mensajes de pacientes">
                    <Toggle checked={notif.push} onChange={setN('push')} disabled={saving} />
                </SettingRow>
            </SectionCard>

            {/* ── Security (intentionally separate — different API flow) ── */}
            <SectionCard title="Seguridad" subtitle="Controla el acceso y la privacidad de tu cuenta" icon={Shield}>
                <SettingRow label="Cambiar contraseña" description="Actualiza tu contraseña regularmente">
                    <button
                        type="button"
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
            <SectionCard title="Mi consulta" subtitle="Configura las opciones de tu práctica clínica" icon={Building2}>
                <SettingRow label="Videollamadas habilitadas" description="Permitir sesiones de videollamada con pacientes">
                    <Toggle checked={practice.videoCallEnabled} onChange={setPr('videoCallEnabled')} disabled={saving} />
                </SettingRow>
                <SettingRow label="Confirmar citas automáticamente" description="Sin requerir tu aprobación manual">
                    <Toggle checked={practice.autoConfirm} onChange={setPr('autoConfirm')} disabled={saving} />
                </SettingRow>
                <SettingRow label="Recordatorios antes de la cita">
                    <SelectRow
                        value={practice.reminderHours}
                        onChange={setPr('reminderHours')}
                        options={[
                            { value: '1',  label: '1 hora antes' },
                            { value: '2',  label: '2 horas antes' },
                            { value: '24', label: '24 horas antes' },
                            { value: '48', label: '48 horas antes' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Duración de sesión por defecto">
                    <SelectRow
                        value={practice.sessionDuration}
                        onChange={setPr('sessionDuration')}
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
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{countryInfo?.symbol} {countryInfo?.currency}</span>
                        <span className="text-[11px] text-gray-500">— {countryInfo?.currencyLabel}</span>
                    </div>
                </SettingRow>
            </SectionCard>

            {/* ── Save ── */}
            <div className="flex items-center justify-end gap-3 pt-1">
                {saveError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {saving ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
            </div>

            <div className="h-4" />
        </form>
    )
}

export default ProfessionalAccountTab
