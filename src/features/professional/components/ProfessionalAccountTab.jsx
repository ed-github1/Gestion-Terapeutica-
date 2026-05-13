import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { getCurrencyForCountry, PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'
import { statsService } from '@shared/services/statsService'
import { professionalsService } from '@shared/services/professionalsService'

const inputClass = `w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
  text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
  disabled:opacity-60 disabled:cursor-not-allowed`

const Label = ({ children }) => (
    <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">{children}</label>
)

const Field = ({ label, type = 'text', value, onChange, disabled }) => (
    <div>
        <Label>{label}</Label>
        <input type={type} value={value} onChange={onChange} disabled={disabled} className={inputClass} />
    </div>
)

const SelectField = ({ label, value, onChange, disabled, options }) => (
    <div>
        <Label>{label}</Label>
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

const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
)

const Section = ({ title, subtitle, children }) => (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
)

const Row = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
        <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {description && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
)

const Select = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
    >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
)

// ─── Main component ─────────────────────────────────────────────────────────────
const ProfessionalAccountTab = () => {
    const { user, updateProfile } = useAuth()
    const [saving, setSaving]     = useState(false)
    const [saved, setSaved]       = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    const [profile, setProfile] = useState({
        nombre:       user?.nombre        || user?.name          || '',
        apellido:     user?.apellido      || '',
        email:        user?.email         || user?.correo        || '',
        country:      user?.country       || '',
        genero:       user?.gender        || user?.genero        || '',
        especialidad: user?.specialty     || user?.especialidad  || '',
        cedula:       user?.licenseNumber || user?.numeroLicencia || '',
    })

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

    const setP   = (key) => (e) => setProfile(prev => ({ ...prev, [key]: typeof e === 'string' ? e : e.target.value }))
    const setN   = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setPr  = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    const countryInfo = getCurrencyForCountry(profile.country) ?? getCurrencyForCountry(user?.country)

    const handleSave = async (e) => {
        e.preventDefault()
        setSaveError(null)
        setSaving(true)

        const emailChanged = profile.email !== (user?.email || user?.correo || '')

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
        <form onSubmit={handleSave} className="space-y-4">

            {/* ── Personal info ── */}
            <Section title="Información personal" subtitle="Tu nombre, correo y datos de identificación">
                <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre"   value={profile.nombre}   onChange={setP('nombre')}   disabled={saving} />
                        <Field label="Apellido" value={profile.apellido} onChange={setP('apellido')} disabled={saving} />
                    </div>
                    <Field label="Correo electrónico" type="email" value={profile.email} onChange={setP('email')} disabled={saving} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField label="País"    value={profile.country} onChange={setP('country')} disabled={saving} options={COUNTRY_OPTIONS} />
                        <SelectField label="Género"  value={profile.genero}  onChange={setP('genero')}  disabled={saving} options={GENDER_OPTIONS} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Especialidad"      value={profile.especialidad} onChange={setP('especialidad')} disabled={saving} />
                        <Field label="Cédula / Licencia" value={profile.cedula}       onChange={setP('cedula')}       disabled={saving} />
                    </div>
                </div>
            </Section>

            {/* ── Notifications ── */}
            <Section title="Notificaciones" subtitle="Elige cómo y cuándo recibir alertas">
                <Row label="Nuevas citas por correo" description="Recibe un correo cuando un paciente agende">
                    <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} disabled={saving} />
                </Row>
                <Row label="Recordatorios por correo" description="24 h antes de cada sesión programada">
                    <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} disabled={saving} />
                </Row>
                <Row label="Notificaciones push" description="Citas, sesiones y mensajes de pacientes">
                    <Toggle checked={notif.push} onChange={setN('push')} disabled={saving} />
                </Row>
            </Section>

            {/* ── Security ── */}
            <Section title="Seguridad" subtitle="Controla el acceso y la privacidad de tu cuenta">
                <Row label="Contraseña" description="Actualiza tu contraseña regularmente">
                    <button
                        type="button"
                        onClick={() => setShowPasswordForm(s => !s)}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        {showPasswordForm ? 'Cancelar' : 'Cambiar'}
                    </button>
                </Row>
                <AnimatePresence>
                    {showPasswordForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-5 pt-1">
                                <ChangePasswordForm />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Section>

            {/* ── Practice ── */}
            <Section title="Mi consulta" subtitle="Opciones de tu práctica clínica">
                <Row label="Videollamadas" description="Permitir sesiones de videollamada con pacientes">
                    <Toggle checked={practice.videoCallEnabled} onChange={setPr('videoCallEnabled')} disabled={saving} />
                </Row>
                <Row label="Confirmar citas automáticamente" description="Sin requerir tu aprobación manual">
                    <Toggle checked={practice.autoConfirm} onChange={setPr('autoConfirm')} disabled={saving} />
                </Row>
                <Row label="Recordatorio antes de la cita">
                    <Select
                        value={practice.reminderHours}
                        onChange={setPr('reminderHours')}
                        options={[
                            { value: '1',  label: '1 hora antes' },
                            { value: '2',  label: '2 horas antes' },
                            { value: '24', label: '24 horas antes' },
                            { value: '48', label: '48 horas antes' },
                        ]}
                    />
                </Row>
                <Row label="Duración de sesión">
                    <Select
                        value={practice.sessionDuration}
                        onChange={setPr('sessionDuration')}
                        options={[
                            { value: '30', label: '30 min' },
                            { value: '45', label: '45 min' },
                            { value: '60', label: '60 min' },
                            { value: '90', label: '90 min' },
                        ]}
                    />
                </Row>
                <Row label="Moneda">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {countryInfo?.symbol} {countryInfo?.currency}
                    </span>
                </Row>
            </Section>

            {/* ── Save ── */}
            <div className="flex items-center justify-end gap-3 pt-1">
                {saveError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                </button>
            </div>

            <div className="h-4" />
        </form>
    )
}

export default ProfessionalAccountTab
