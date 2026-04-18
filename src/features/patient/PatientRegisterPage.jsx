import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, Eye, EyeOff, ShieldCheck, ChevronDown } from 'lucide-react'
import apiClient from '@shared/api/client'
import { BrandLogo } from '@shared/ui'

const SESSION_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'couples', label: 'Pareja' },
  { value: 'family', label: 'Familia' },
]

/* ── Shared input classes ─────────────────────────────────────────── */
const inputBase =
  'w-full px-4 py-3.5 text-[15px] rounded-xl outline-none transition-all duration-200 bg-white placeholder:text-gray-400'
const inputOk =
  'border border-gray-300 hover:border-gray-400 focus:border-[#0075C9] focus:ring-4 focus:ring-sky-50'
const inputErr =
  'border-2 border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'

/* ── Section header component ─────────────────────────────────────── */
const SectionHeader = ({ step, title, description }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="shrink-0 w-9 h-9 rounded-full border border-[#0075C9]/20 bg-[#0075C9]/5 text-[#0075C9] flex items-center justify-center text-[13px] font-bold">
      {step}
    </div>
    <div>
      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">{title}</h3>
      {description && <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>}
    </div>
  </div>
)

/* ── Select wrapper with chevron ──────────────────────────────────── */
const Select = ({ hasError, children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`${inputBase} appearance-none pr-11 ${hasError ? inputErr : inputOk}`}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
)

const PatientRegisterPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [patientInfo, setPatientInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const token = searchParams.get('token')
  const inviteCode = searchParams.get('code')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      sessionType: 'individual',
      presentingConcern: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      address: '',
      previousTherapy: '',
      previousMentalHealthTreatment: '',
      previousSurgery: '',
      previousSurgeryDetail: '',
      currentIllness: '',
      currentIllnessDetail: '',
      currentMedication: '',
      currentMedicationDetail: '',
      healthSystemNumber: '',
      acceptTerms: false,
      acceptPrivacy: false,
      acceptSensitiveData: false,
    }
  })

  const password = watch('password')
  const previousSurgeryValue = watch('previousSurgery')
  const currentIllnessValue = watch('currentIllness')
  const currentMedicationValue = watch('currentMedication')

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!inviteCode && !token) {
        setError('Link de invitación inválido')
        setIsLoading(false)
        return
      }
      try {
        const code = inviteCode || token
        const response = await apiClient.get(`/invitations/verify/${code}`)
        setPatientInfo({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          invitationId: response.data.id || response.data._id,
          professionalId: response.data.professionalId
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error verifying invitation:', error)
        setError('Link de invitación inválido o expirado')
        setIsLoading(false)
      }
    }
    verifyInvitation()
  }, [token, inviteCode])

  const onSubmit = async (data) => {
    try {
      setError(null)
      const registrationData = {
        invitationId: patientInfo.invitationId,
        inviteCode: inviteCode || token,
        email: data.email,
        password: data.password,
        firstName: patientInfo.firstName,
        lastName: patientInfo.lastName,
        phone: data.phone || patientInfo.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        sessionType: data.sessionType,
        presentingConcern: data.presentingConcern,
        previousTherapy: data.previousTherapy || undefined,
        previousMentalHealthTreatment: data.previousMentalHealthTreatment || undefined,
        previousSurgery: data.previousSurgery || undefined,
        previousSurgeryDetail: data.previousSurgeryDetail || undefined,
        currentIllness: data.currentIllness || undefined,
        currentIllnessDetail: data.currentIllnessDetail || undefined,
        currentMedication: data.currentMedication || undefined,
        currentMedicationDetail: data.currentMedicationDetail || undefined,
        healthSystemNumber: data.healthSystemNumber || undefined,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
        }
      }

      await apiClient.post('/patients/complete-registration', registrationData)

      alert('✅ Registro completado exitosamente!\n\nYa puedes iniciar sesión con tu correo y contraseña.')
      navigate('/login')
    } catch (error) {
      console.error('Error completing registration:', error)
      setError(error.response?.data?.message || 'Error al completar el registro')
    }
  }

  /* ── Loading state ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#0075C9]/20 border-t-[#0075C9] mx-auto mb-4" />
          <p className="text-gray-500 text-[14px]">Verificando invitación…</p>
        </div>
      </div>
    )
  }

  /* ── Error state ───────────────────────────────────────────────── */
  if (error && !patientInfo) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight mb-2">Link inválido</h2>
          <p className="text-gray-500 text-[14px] leading-relaxed mb-7">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#0075C9] text-white py-3 rounded-xl text-[14px] font-semibold hover:bg-[#005faa] transition-colors"
          >
            Ir al inicio de sesión
          </button>
        </motion.div>
      </div>
    )
  }

  /* ── Main form ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Top bar */}
      <header className="border-b border-gray-200/70 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
          <BrandLogo symbolOnly size="h-9 w-9" />
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-[#0075C9]" />
            <span>Información protegida conforme a la LFPDPPP</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-[12px] font-semibold text-[#0075C9] uppercase tracking-[0.15em] mb-3">
            Expediente del paciente
          </p>
          <h1 className="text-[34px] sm:text-[40px] leading-[1.08] font-bold text-gray-900 tracking-tight">
            Bienvenido/a, {patientInfo?.firstName || ''} {patientInfo?.lastName || ''}.
          </h1>
          <p className="text-gray-500 text-[15px] mt-4 max-w-xl leading-relaxed">
            Tu profesional de la salud te ha invitado a TotalMente. Completa los siguientes pasos
            para acceder a tu expediente, gestionar tus citas y comenzar tu proceso terapéutico.
          </p>
        </motion.div>

        {/* API Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200/70"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 font-medium leading-snug">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-10"
        >
          {/* ── Section 1: Credenciales ────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="1"
              title="Credenciales de acceso"
              description="Estos datos te permitirán ingresar a tu portal."
            />

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Correo electrónico<span className="text-rose-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={patientInfo?.email || ''}
                  {...register('email', {
                    required: 'El correo electrónico es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo electrónico inválido'
                    }
                  })}
                  className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                  placeholder="tu@correo.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Contraseña<span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Debe incluir mayúsculas, minúsculas y números'
                        }
                      })}
                      className={`${inputBase} pr-12 ${errors.password ? inputErr : inputOk}`}
                      placeholder="Mín. 8 caracteres"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Confirmar contraseña<span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword', {
                        required: 'Confirma tu contraseña',
                        validate: value => value === password || 'Las contraseñas no coinciden'
                      })}
                      className={`${inputBase} pr-12 ${errors.confirmPassword ? inputErr : inputOk}`}
                      placeholder="Repite la contraseña"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Información personal ────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="2"
              title="Información personal"
              description="Datos básicos para tu expediente clínico."
            />

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Teléfono<span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    defaultValue={patientInfo?.phone || ''}
                    {...register('phone', { required: 'El teléfono es requerido' })}
                    className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                    placeholder="+52 123 456 7890"
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Fecha de nacimiento<span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth', { required: 'La fecha de nacimiento es requerida' })}
                    className={`${inputBase} ${errors.dateOfBirth ? inputErr : inputOk}`}
                    disabled={isSubmitting}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Dirección
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address')}
                  className={`${inputBase} ${inputOk}`}
                  placeholder="Calle, número, colonia, ciudad"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Información clínica ─────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="3"
              title="Información clínica"
              description="Ayúdanos a entender por qué buscas acompañamiento."
            />

            <div className="space-y-5">
              <div>
                <label htmlFor="sessionType" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Tipo de sesión<span className="text-rose-400">*</span>
                </label>
                <Select
                  id="sessionType"
                  hasError={errors.sessionType}
                  {...register('sessionType', { required: 'Selecciona el tipo de sesión' })}
                  disabled={isSubmitting}
                >
                  {SESSION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
                {errors.sessionType && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.sessionType.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="presentingConcern" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  ¿Por qué estás buscando un terapeuta?<span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="presentingConcern"
                  rows={4}
                  {...register('presentingConcern', { required: 'Este campo es requerido' })}
                  className={`${inputBase} resize-none ${errors.presentingConcern ? inputErr : inputOk}`}
                  placeholder="Comparte, en tus propias palabras, lo que te trae aquí…"
                  disabled={isSubmitting}
                />
                {errors.presentingConcern && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.presentingConcern.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Section 4: Historial médico ────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="4"
              title="Historial médico"
              description="Información confidencial, únicamente para tu profesional tratante."
            />

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    ¿Has recibido terapia anteriormente?
                  </label>
                  <Select {...register('previousTherapy')} disabled={isSubmitting}>
                    <option value="">Seleccionar…</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    ¿Tratamiento previo por salud mental?
                  </label>
                  <Select {...register('previousMentalHealthTreatment')} disabled={isSubmitting}>
                    <option value="">Seleccionar…</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  ¿Alguna operación o intervención quirúrgica?
                </label>
                <Select {...register('previousSurgery')} disabled={isSubmitting}>
                  <option value="">Seleccionar…</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </Select>
              </div>
              {previousSurgeryValue === 'yes' && (
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Detalle de la intervención
                  </label>
                  <input
                    type="text"
                    {...register('previousSurgeryDetail')}
                    className={`${inputBase} ${inputOk}`}
                    placeholder="Describe brevemente…"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  ¿Padeces alguna enfermedad actualmente?
                </label>
                <Select {...register('currentIllness')} disabled={isSubmitting}>
                  <option value="">Seleccionar…</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </Select>
              </div>
              {currentIllnessValue === 'yes' && (
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">¿Cuál enfermedad?</label>
                  <input
                    type="text"
                    {...register('currentIllnessDetail')}
                    className={`${inputBase} ${inputOk}`}
                    placeholder="Describe brevemente…"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  ¿Tomas algún medicamento actualmente?
                </label>
                <Select {...register('currentMedication')} disabled={isSubmitting}>
                  <option value="">Seleccionar…</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </Select>
              </div>
              {currentMedicationValue === 'yes' && (
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">¿Cuál medicamento?</label>
                  <input
                    type="text"
                    {...register('currentMedicationDetail')}
                    className={`${inputBase} ${inputOk}`}
                    placeholder="Nombre del medicamento…"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Número de registro en el sistema de salud (opcional)
                </label>
                <input
                  type="text"
                  {...register('healthSystemNumber')}
                  className={`${inputBase} ${inputOk}`}
                  placeholder="Obra social, seguro social, seguro de salud…"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* ── Section 5: Contacto de emergencia ──────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="5"
              title="Contacto de emergencia"
              description="Persona a contactar en caso de urgencia."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContactName" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Nombre<span className="text-rose-400">*</span>
                </label>
                <input
                  id="emergencyContactName"
                  type="text"
                  {...register('emergencyContactName', { required: 'El nombre del contacto de emergencia es requerido' })}
                  className={`${inputBase} ${errors.emergencyContactName ? inputErr : inputOk}`}
                  placeholder="Nombre completo"
                  disabled={isSubmitting}
                />
                {errors.emergencyContactName && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.emergencyContactName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Teléfono<span className="text-rose-400">*</span>
                </label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  {...register('emergencyContactPhone', { required: 'El teléfono del contacto de emergencia es requerido' })}
                  className={`${inputBase} ${errors.emergencyContactPhone ? inputErr : inputOk}`}
                  placeholder="+52 123 456 7890"
                  disabled={isSubmitting}
                />
                {errors.emergencyContactPhone && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.emergencyContactPhone.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Section 6: Consentimientos ─────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <SectionHeader
              step="6"
              title="Consentimientos"
              description="Tus derechos y nuestro compromiso con tu privacidad."
            />

            <div className="space-y-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('acceptTerms', { required: 'Debes aceptar los términos y condiciones' })}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0075C9] focus:ring-[#54C0E8] transition shrink-0"
                  disabled={isSubmitting}
                />
                <span className="text-[13px] text-gray-600 leading-relaxed">
                  Acepto los{' '}
                  <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                    Términos y Condiciones
                  </Link>{' '}y la{' '}
                  <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                    Política de Privacidad
                  </Link>.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-rose-600 flex items-center gap-1 ml-7">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.acceptTerms.message}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('acceptPrivacy', { required: 'Debes aceptar la política de privacidad' })}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0075C9] focus:ring-[#54C0E8] transition shrink-0"
                  disabled={isSubmitting}
                />
                <span className="text-[13px] text-gray-600 leading-relaxed">
                  He leído y acepto el{' '}
                  <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                    Aviso de Privacidad Integral
                  </Link>{' '}y el tratamiento de mis datos personales.
                </span>
              </label>
              {errors.acceptPrivacy && (
                <p className="text-xs text-rose-600 flex items-center gap-1 ml-7">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.acceptPrivacy.message}
                </p>
              )}

              {/* Sensitive data consent — Art. 9 LFPDPPP */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mt-2">
                <p className="text-[12px] font-semibold text-amber-900 uppercase tracking-wide mb-2">
                  Consentimiento expreso — Art. 9 LFPDPPP
                </p>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('acceptSensitiveData', { required: 'Debes otorgar consentimiento expreso para el tratamiento de tus datos de salud' })}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400 transition shrink-0"
                    disabled={isSubmitting}
                  />
                  <span className="text-[13px] text-amber-900 leading-relaxed">
                    Otorgo consentimiento <strong>expreso, específico e informado</strong> para el tratamiento
                    de mis datos personales sensibles de <strong>salud mental</strong> (diagnósticos, notas terapéuticas,
                    diario personal) por parte de TotalMente y mi terapeuta, conforme al{' '}
                    <Link to="/privacidad#datos-sensibles" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      Aviso de Privacidad Integral
                    </Link>.
                  </span>
                </label>
                {errors.acceptSensitiveData && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 ml-7 mt-2">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.acceptSensitiveData.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p className="text-[13px] text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#0075C9] hover:text-[#004d87] font-semibold"
              >
                Inicia sesión
              </button>
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:min-w-56 bg-[#0075C9] text-white py-3.5 px-8 rounded-xl text-[15px] font-semibold hover:bg-[#005faa] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Completando…
                </span>
              ) : (
                'Completar registro'
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 pt-4">
            © {new Date().getFullYear()} TotalMente.{' '}
            <Link to="/terminos" className="hover:text-gray-600 transition-colors">Términos</Link>
            {' · '}
            <Link to="/privacidad" className="hover:text-gray-600 transition-colors">Privacidad</Link>
          </p>
        </motion.form>
      </div>
    </div>
  )
}

export default PatientRegisterPage
