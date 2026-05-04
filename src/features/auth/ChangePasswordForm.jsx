import { useState } from 'react'
import { motion } from 'motion/react'
import { Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthContext'

const PasswordField = ({ label, value, onChange, disabled }) => {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-3 py-2 pr-9 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/60"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'La contraseña actual es incorrecta.',
  WEAK_PASSWORD:       'La contraseña debe tener al menos 8 caracteres.',
  MISSING_FIELDS:      'Completá todos los campos.',
}

const EMPTY = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

const ChangePasswordForm = () => {
  const { changePassword } = useAuth()

  const [form, setForm]   = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)

  const set = (key) => (e) => {
    setSuccess(false)
    setError(null)
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (form.newPassword !== form.confirmNewPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setSuccess(true)
      setForm(EMPTY)
    } catch (err) {
      const code = err.data?.code
      setError(ERROR_MESSAGES[code] || err.message || 'Error al cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Cambiar contraseña</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Actualizá tu contraseña de acceso</p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 mb-5" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField label="Contraseña actual"          value={form.currentPassword}    onChange={set('currentPassword')}    disabled={loading} />
        <PasswordField label="Nueva contraseña"           value={form.newPassword}        onChange={set('newPassword')}        disabled={loading} />
        <PasswordField label="Confirmar nueva contraseña" value={form.confirmNewPassword} onChange={set('confirmNewPassword')} disabled={loading} />

        {success && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Contraseña actualizada correctamente.</p>
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
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Key className="w-4 h-4" />
            )}
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default ChangePasswordForm
