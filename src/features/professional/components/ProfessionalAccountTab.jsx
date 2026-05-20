import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { getCurrencyForCountry, PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'
import { statsService } from '@shared/services/statsService'
import { professionalsService } from '@shared/services/professionalsService'
import { showToast } from '@shared/ui/Toast'
import apiClient from '@shared/api/client'

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


// ─── Main component ─────────────────────────────────────────────────────────────
const ProfessionalAccountTab = () => {
    const { user, updateProfile } = useAuth()
    const location = useLocation()
    const originalProfessional = useRef({ especialidad: '', cedula: '' })
    const [saving, setSaving]     = useState(false)
    const [saved, setSaved]       = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [mpConnected, setMpConnected] = useState(false)
    const [mpConnecting, setMpConnecting] = useState(false)

    // Handle OAuth callback: ?mp=connected or ?mp=error
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const mp = params.get('mp')
        if (!mp) return
        if (mp === 'connected') {
            setMpConnected(true)
            showToast('MercadoPago conectado correctamente.', 'success')
        } else if (mp === 'error') {
            showToast('No se pudo conectar MercadoPago. Intenta de nuevo.', 'error')
        }
        window.history.replaceState({}, '', location.pathname)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const [profile, setProfile] = useState({
        nombre:       user?.nombre   || user?.name  || '',
        apellido:     user?.apellido || '',
        email:        user?.email    || user?.correo || '',
        country:      user?.country  || '',
        genero:       user?.gender   || user?.genero || '',
        especialidad: '',
        cedula:       '',
    })

    // Sync all fields from user (getMe / getProfile returns user + professional data merged)
    useEffect(() => {
        if (!user) return
        const dp = user.datosPersonales ?? {}
        const especialidad = dp.especialidad      || user.especialidad  || ''
        const cedula       = dp.cedulaProfesional || user.cedula        || ''
        originalProfessional.current = { especialidad, cedula }
        setProfile({
            nombre:       user.nombre   || user.name   || '',
            apellido:     user.apellido || '',
            email:        user.email    || user.correo  || '',
            country:      user.country  || '',
            genero:       (user.gender || user.genero || '').toLowerCase(),
            especialidad,
            cedula,
        })
        setMpConnected(user.mpConnected ?? false)
    }, [user])

    const [notif, setNotif] = useState({ emailReminders: true })

    const [practice] = useState({ reminderHours: '24' })

    const setP = (key) => (e) => setProfile(prev => ({ ...prev, [key]: typeof e === 'string' ? e : e.target.value }))
    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))

    const countryInfo = getCurrencyForCountry(profile.country) ?? getCurrencyForCountry(user?.country)

    const handleSave = async (e) => {
        e.preventDefault()
        setSaveError(null)
        setSaving(true)

        const emailChanged = profile.email !== (user?.email || user?.correo || '')

        const profileDiff = {}
        if (profile.nombre       !== (user?.nombre   || user?.name   || '')) profileDiff.nombre       = profile.nombre
        if (profile.apellido     !== (user?.apellido || ''))                  profileDiff.apellido     = profile.apellido
        if (profile.country      !== (user?.country  || ''))                  profileDiff.country      = profile.country.toUpperCase()
        if (profile.genero       !== (user?.gender   || user?.genero || '').toLowerCase()) profileDiff.gender           = profile.genero
        if (profile.especialidad !== originalProfessional.current.especialidad)           profileDiff.especialidad     = profile.especialidad
        if (profile.cedula       !== originalProfessional.current.cedula)                 profileDiff.cedulaProfesional = profile.cedula

        localStorage.setItem('professionalSettings', JSON.stringify({ currency: countryInfo?.currency }))

        const tasks = [
            statsService.updateProfessionalSettings({
                notifications: { emailReminders: notif.emailReminders },
                reminderHours: practice.reminderHours,
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

    const handleConnectMP = async () => {
        setMpConnecting(true)
        try {
            const { url } = await apiClient.get('/auth/mercadopago/connect')
            window.location.href = url
        } catch {
            showToast('No se pudo iniciar la conexión con MercadoPago.', 'error')
            setMpConnecting(false)
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
            <Section title="Notificaciones" subtitle="Elige cuándo recibir recordatorios">
                <Row label="Recordatorio 24 h antes" description="Recibe un aviso un día antes de cada sesión">
                    <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} disabled={saving} />
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
                <Row label="Moneda">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {countryInfo?.symbol} {countryInfo?.currency}
                    </span>
                </Row>
            </Section>

            {/* ── Payments ── */}
            <Section title="Cobros" subtitle="Conecta tu cuenta de MercadoPago para recibir pagos de tus pacientes">
                <Row
                    label="MercadoPago"
                    description={mpConnected ? 'Cuenta conectada. Los pagos se depositan directamente.' : 'Conecta tu cuenta para aceptar pagos en línea.'}
                >
                    {mpConnected ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Conectado
                        </span>
                    ) : (
                        <button
                            type="button"
                            disabled={mpConnecting}
                            onClick={handleConnectMP}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {mpConnecting ? 'Redirigiendo...' : 'Conectar cuenta'}
                        </button>
                    )}
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
