import { useState } from 'react'
import { motion } from 'motion/react'
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

const Label = ({ children }) => (
  <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
    {children}
  </label>
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
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Editar perfil</h2>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Actualiza tu información personal y profesional</p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 mb-5" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre"   value={form.nombre}   onChange={set('nombre')}   disabled={loading} />
          <Field label="Apellido" value={form.apellido} onChange={set('apellido')} disabled={loading} />
        </div>

        {/* Email */}
        <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} disabled={loading} />

        {/* Country + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="País"    value={form.country} onChange={set('country')} disabled={loading} options={countryOptions} />
          <SelectField label="Género"  value={form.genero}  onChange={set('genero')}  disabled={loading} options={GENDER_OPTIONS} />
        </div>

        {/* Specialty + License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Especialidad"     value={form.especialidad} onChange={set('especialidad')} disabled={loading} />
          <Field label="Cédula / Licencia" value={form.cedula}      onChange={set('cedula')}       disabled={loading} />
        </div>

        {success && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Perfil actualizado correctamente.</p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default EditProfileForm
