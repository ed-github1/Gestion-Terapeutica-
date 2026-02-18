import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { invitationsService } from '@shared/services/invitationsService'
import { showToast } from '@shared/ui'
import { X, Send, User, Mail, Phone, Calendar, MessageSquare, Stethoscope } from 'lucide-react'

const SESSION_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'couples',    label: 'Pareja' },
  { value: 'family',     label: 'Familia' },
  { value: 'group',      label: 'Grupo' },
]

const REFERRAL_SOURCES = [
  { value: 'self',      label: 'Propia iniciativa' },
  { value: 'gp',        label: 'Médico de cabecera' },
  { value: 'insurance', label: 'Seguro médico' },
  { value: 'referral',  label: 'Derivación profesional' },
  { value: 'social',    label: 'Redes sociales' },
  { value: 'other',     label: 'Otro' },
]

const Field = ({ label, icon: Icon, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-[11px] text-rose-500 font-medium">
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
)

const inputCls = (hasError) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 ${
    hasError ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-gray-50 hover:bg-white'
  }`

const PatientForm = ({ onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '', apellido: '', email: '', phone: '',
      dateOfBirth: '', sessionType: 'individual',
      presentingConcern: '', referralSource: 'self',
    }
  })

  const onSubmit = async (data) => {
    try {
      const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData')
      const user = JSON.parse(userDataStr || '{}')
      const professionalId = user.id || user._id || user.userId || user.professionalId
      if (!professionalId) {
        showToast('No se encontró el ID del profesional. Vuelve a iniciar sesión.', 'error')
        return
      }
      await invitationsService.send({
        patientEmail:      data.email,
        patientName:       `${data.nombre} ${data.apellido}`.trim(),
        firstName:         data.nombre,
        lastName:          data.apellido,
        phone:             data.phone || null,
        dateOfBirth:       data.dateOfBirth || null,
        sessionType:       data.sessionType,
        presentingConcern: data.presentingConcern || null,
        referralSource:    data.referralSource,
        professionalId,
        channels:          ['EMAIL'],
      })
      showToast(`Invitación enviada a ${data.email}`, 'success')
      onClose()
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error
      if (err?.response?.status === 409) {
        showToast(serverMsg || 'Ya existe una invitación pendiente para este correo electrónico.', 'warning')
      } else {
        showToast(serverMsg || err.message || 'Error al enviar la invitación', 'error')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full rounded-2xl shadow-xl max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 5.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Invitar paciente</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">El paciente completará el resto en su formulario de incorporación</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" icon={User} error={errors.nombre?.message}>
              <input {...register('nombre', { required: 'Requerido' })}
                className={inputCls(!!errors.nombre)} placeholder="Juan" />
            </Field>
            <Field label="Apellido" error={errors.apellido?.message}>
              <input {...register('apellido', { required: 'Requerido' })}
                className={inputCls(!!errors.apellido)} placeholder="García" />
            </Field>
          </div>

          <Field label="Correo electrónico" icon={Mail} error={errors.email?.message}>
            <input type="email"
              {...register('email', {
                required: 'El correo es requerido',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })}
              className={inputCls(!!errors.email)} placeholder="paciente@ejemplo.com" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono (opcional)" icon={Phone}>
              <input {...register('phone')} className={inputCls(false)} placeholder="+34 600 000 000" />
            </Field>
            <Field label="Fecha de nacimiento" icon={Calendar} error={errors.dateOfBirth?.message}>
              <input type="date" {...register('dateOfBirth', { required: 'Requerida' })}
                className={inputCls(!!errors.dateOfBirth)} />
            </Field>
          </div>

          <Field label="Tipo de sesión" icon={Stethoscope}>
            <select {...register('sessionType')} className={inputCls(false)}>
              {SESSION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Motivo de consulta (opcional)" icon={MessageSquare}>
            <textarea {...register('presentingConcern')} rows={2}
              className={`${inputCls(false)} resize-none`}
              placeholder="Breve descripción del motivo de derivación o consulta" />
          </Field>

          <Field label="Fuente de derivación">
            <select {...register('referralSource')} className={inputCls(false)}>
              {REFERRAL_SOURCES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <div className="flex items-start gap-2.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Mail className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Se enviará un enlace de registro seguro. El paciente creará su contraseña y completará su historial médico, consentimientos y datos de seguro de forma independiente.
            </p>
          </div>
        </form>

        {/* Footer  always visible */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-200">
            {isSubmitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            {isSubmitting ? 'Enviando' : 'Enviar invitación'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientForm
