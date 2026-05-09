import { useState } from 'react'
import { motion } from 'motion/react'
import { User, Mail, Save, Check, AlertCircle, Briefcase, Hash, Globe } from 'lucide-react'
import { useAuth } from './AuthContext'
import { PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'

const GENDER_OPTIONS = [
  { value: '',           label: 'Seleccionar...' },
  { value: 'masculino',  label: 'Masculino' },
  { value: 'femenino',   label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

const inputClass = `w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
  text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
  disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/60`

const Label = ({ icon: Icon, children }) => (
  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-1.5">
    {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
    {children}
  </label>
)

const Field = ({ label, icon, type = 'text', value, onChange, disabled }) => (
  <div>
    <Label icon={icon}>{label}</Label>
    <input type={type} value={value} onChange={onChange} disabled={disabled} className={inputClass} />
  </div>
)

const SelectField = ({ label, icon, value, onChange, disabled, options }) => (
  <div>
    <Label icon={icon}>{label}</Label>
    <select value={value} onChange={onChange} disabled={disabled}
      className={`${inputClass} appearance-none`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const ERROR_MESSAGES = {
  EMAIL_IN_USE: 'Ese correo ya está en uso.',
}

const EditProfileForm = () => {
  const { user, updateProfile } = useAuth()

  const [form, setForm] = useState({
    nombre:      user?.nombre      || user?.name          || '',
    apellido:    user?.apellido    || '',
    email:       user?.email       || user?.correo        || '',
    country:     user?.country     || '',
    genero:      user?.gender      || user?.genero        || '',
    especialidad: user?.specialty  || user?.especialidad  || '',
    cedula:      user?.licenseNumber || user?.numeroLicencia || '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)

  const set = (key) => (e) => {
    setSuccess(false)
    setError(null)
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const diff = {}
    if (form.nombre       !== (user?.nombre      || user?.name          || '')) diff.nombre       = form.nombre
    if (form.apellido     !== (user?.apellido    || ''))                         diff.apellido     = form.apellido
    if (form.email        !== (user?.email       || user?.correo        || '')) diff.email        = form.email
    if (form.country      !== (user?.country     || ''))                         diff.country      = form.country
    if (form.genero       !== (user?.gender      || user?.genero        || '')) diff.genero       = form.genero
    if (form.especialidad !== (user?.specialty   || user?.especialidad  || '')) diff.especialidad = form.especialidad
    if (form.cedula       !== (user?.licenseNumber || user?.numeroLicencia || '')) diff.cedula    = form.cedula

    if (Object.keys(diff).length === 0) {
      setError('No hay cambios para guardar.')
      return
    }

    setLoading(true)
    try {
      await updateProfile(diff)
      setSuccess(true)
    } catch (err) {
      const code = err.data?.code
      setError(ERROR_MESSAGES[code] || err.message || 'Error al actualizar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  const countryOptions = [
    { value: '', label: 'Seleccionar país...' },
    ...PROFESSIONAL_COUNTRIES.map(c => ({ value: c.code, label: c.name })),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <User className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Editar perfil</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Actualiza tu información personal y profesional</p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 mb-5" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre"   icon={User} value={form.nombre}   onChange={set('nombre')}   disabled={loading} />
          <Field label="Apellido" icon={User} value={form.apellido} onChange={set('apellido')} disabled={loading} />
        </div>

        {/* Email */}
        <Field label="Correo electrónico" icon={Mail} type="email" value={form.email} onChange={set('email')} disabled={loading} />

        {/* Country + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="País" icon={Globe} value={form.country} onChange={set('country')} disabled={loading} options={countryOptions} />
          <SelectField label="Género" icon={User} value={form.genero} onChange={set('genero')} disabled={loading} options={GENDER_OPTIONS} />
        </div>

        {/* Specialty + License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Especialidad" icon={Briefcase} value={form.especialidad} onChange={set('especialidad')} disabled={loading} />
          <Field label="Cédula / Licencia" icon={Hash} value={form.cedula} onChange={set('cedula')} disabled={loading} />
        </div>

        {success && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Perfil actualizado correctamente.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default EditProfileForm
