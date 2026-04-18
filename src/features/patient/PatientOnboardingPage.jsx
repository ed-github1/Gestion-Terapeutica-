import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle, Check, ChevronDown, Eye, EyeOff, ShieldCheck, WifiOff, X,
} from 'lucide-react'
import apiClient, { setAuthToken } from '@shared/api/client'
import { BrandLogo } from '@shared/ui'

/* ── Constants ─────────────────────────────────────────────────────────────── */

const SESSION_TYPES = [
  { value: 'Primera Sesión', label: 'Primera Sesión' },
  { value: 'Seguimiento',    label: 'Seguimiento' },
  { value: 'Extraordinaria',     label: 'Extraordinaria' },
]

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Masculino' },
  { value: 'female',            label: 'Femenino' },
  { value: 'other',             label: 'Otro' },
  { value: 'prefer-not-to-say', label: 'Prefiero no decirlo' },
]

const LATAM_COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'CU', label: 'Cuba' },
  { value: 'DO', label: 'República Dominicana' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HN', label: 'Honduras' },
  { value: 'MX', label: 'México' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'PA', label: 'Panamá' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Perú' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
]

const BLOCKED_STATUSES = new Set([
  'expired', 'accepted', 'completed', 'registered', 'cancelled', 'revoked',
])

const STEP_REQUIRED_FIELDS = {
  1: ['firstName', 'lastName', 'email', 'dateOfBirth'],
  2: ['password', 'confirmPassword', 'presentingConcern'],
  3: ['previousTherapy', 'previousMentalHealthTreatment', 'previousSurgery', 'currentIllness', 'currentMedication', 'healthSystemNumber'],
  4: ['emergencyContactName', 'emergencyContactPhone', 'acceptTerms', 'acceptPrivacy', 'acceptSensitiveData'],
}

const STEP_META = [
  { n: 1, title: 'Datos personales',  subtitle: 'Cuéntanos quién eres.' },
  { n: 2, title: 'Acceso y consulta', subtitle: 'Credenciales y motivo de consulta.' },
  { n: 3, title: 'Historial médico',  subtitle: 'Información confidencial para tu terapeuta.' },
  { n: 4, title: 'Contacto y consentimiento', subtitle: 'Últimos detalles para activar tu cuenta.' },
]

/* ── Shared input tokens (match Login / Register) ─────────────────────────── */
const inputBase =
  'w-full px-4 py-3.5 text-[15px] rounded-xl outline-none transition-all duration-200 bg-white placeholder:text-gray-400'
const inputOk =
  'border border-gray-300 hover:border-gray-400 focus:border-[#0075C9] focus:ring-4 focus:ring-sky-50'
const inputErr =
  'border-2 border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'

/* ── Sub-components ───────────────────────────────────────────────────────── */

const Field = ({ label, error, children, optional, htmlFor }) => (
  <div className="flex flex-col">
    <label htmlFor={htmlFor} className="text-[13px] font-semibold text-gray-700 mb-1.5">
      {label}
      {optional
        ? <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        : <span className="text-rose-400">*</span>}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 text-xs text-rose-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
)

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

/* ── Step indicator (clean, brand-aligned) ────────────────────────────────── */
const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }, (_, i) => {
      const step     = i + 1
      const done     = step < current
      const active   = step === current
      return (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
              done
                ? 'bg-[#0075C9] text-white'
                : active
                  ? 'bg-[#0075C9] text-white ring-4 ring-sky-100'
                  : 'bg-white text-gray-400 border border-gray-200'
            }`}
          >
            {done ? <Check className="w-4 h-4" strokeWidth={2.6} /> : step}
          </div>
          {step < total && (
            <div className={`h-0.5 flex-1 rounded-full transition-colors ${done ? 'bg-[#0075C9]' : 'bg-gray-200'}`} />
          )}
        </div>
      )
    })}
  </div>
)

/* ══════════════════════════════════════════════════════════════════════════════
   PatientOnboardingPage
   ══════════════════════════════════════════════════════════════════════════════ */

const PatientOnboardingPage = () => {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [verifying,      setVerifying]      = useState(!!token)
  const [invitation,     setInvitation]     = useState(null)
  const [hardBlockError, setHardBlockError] = useState(null)
  const [softWarnError,  setSoftWarnError]  = useState(null)

  const TOTAL_STEPS = 4
  const [step,        setStep]        = useState(1)
  const [submitError, setSubmitError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      password: '', confirmPassword: '',
      dateOfBirth: '', gender: '', genderOther: '',
      address: '', country: '',
      sessionType: 'individual',
      presentingConcern: '',
      emergencyContactName: '', emergencyContactPhone: '',
      previousTherapy: '',
      previousMentalHealthTreatment: '',
      previousSurgery: '', previousSurgeryDetail: '',
      currentIllness: '', currentIllnessDetail: '',
      currentMedication: '', currentMedicationDetail: '',
      healthSystemNumber: '',
      acceptTerms: false, acceptPrivacy: false, acceptSensitiveData: false,
    },
    mode: 'onTouched',
  })

  const password = watch('password')
  const genderValue = watch('gender')
  const previousSurgeryValue = watch('previousSurgery')
  const currentIllnessValue = watch('currentIllness')
  const currentMedicationValue = watch('currentMedication')

  /* ── Verify invitation on mount ─────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return

    const verify = async () => {
      try {
        const res = await apiClient.get(`/invitations/verify/${token}`)
        const inv = res?.data?.data ?? res?.data ?? res

        if (inv?.status && BLOCKED_STATUSES.has(inv.status)) {
          const statusMessages = {
            expired:    'Este enlace de invitación ha expirado. Pide a tu terapeuta que te envíe uno nuevo.',
            accepted:   'Este enlace ya fue utilizado para crear una cuenta. Por favor inicia sesión.',
            completed:  'Este enlace ya fue utilizado para crear una cuenta. Por favor inicia sesión.',
            registered: 'Este enlace ya fue utilizado para crear una cuenta. Por favor inicia sesión.',
            cancelled:  'Esta invitación fue cancelada por el profesional.',
            revoked:    'Esta invitación fue cancelada por el profesional.',
          }
          setHardBlockError(statusMessages[inv.status] ?? 'Este enlace de invitación no es válido.')
          return
        }

        setInvitation(inv)

        const fill = (field, value) => { if (value) setValue(field, value) }
        fill('firstName', inv?.firstName ?? inv?.name?.split(' ')?.[0])
        fill('lastName',  inv?.lastName  ?? inv?.name?.split(' ')?.[1])
        fill('email',     inv?.email)
        fill('phone',     inv?.phone)
      } catch (err) {
        if (err?.status === 404 || err?.status === 410) {
          setHardBlockError('Este enlace de invitación es inválido o ya expiró.')
          return
        }
        console.warn('[PatientOnboarding] verify failed (non-fatal):', err.message)
        setSoftWarnError(
          'No se pudo verificar la invitación en este momento, pero puedes continuar con el registro.'
        )
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [token, setValue])

  /* ── Per-step field validation before advancing ─────────────────────────── */
  const goNext = async () => {
    const fields = STEP_REQUIRED_FIELDS[step] ?? []
    const valid  = await trigger(fields)
    if (valid) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      const invitationId = invitation?._id ?? invitation?.id ?? null

      const payload = {
        role:       'patient',
        code:       token,
        inviteCode: token,
        ...(invitationId && { invitationId }),

        firstName:             data.firstName,
        lastName:              data.lastName,
        email:                 data.email,
        password:              data.password,
        phone:                 data.phone                || undefined,
        dateOfBirth:           data.dateOfBirth          || undefined,
        gender:                data.gender               || undefined,
        address:               data.address              || undefined,
        country:               data.country              || undefined,
        sessionType:           data.sessionType,
        presentingConcern:     data.presentingConcern     || undefined,
        genderOther:           data.genderOther           || undefined,
        previousTherapy:       data.previousTherapy       || undefined,
        previousMentalHealthTreatment: data.previousMentalHealthTreatment || undefined,
        previousSurgery:       data.previousSurgery       || undefined,
        previousSurgeryDetail: data.previousSurgeryDetail || undefined,
        currentIllness:        data.currentIllness        || undefined,
        currentIllnessDetail:  data.currentIllnessDetail  || undefined,
        currentMedication:     data.currentMedication     || undefined,
        currentMedicationDetail: data.currentMedicationDetail || undefined,
        healthSystemNumber:    data.healthSystemNumber    || undefined,
        emergencyContactName:  data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
      }

      const res = await apiClient.post('/auth/register/patient', payload)

      if (res.data?.token) setAuthToken(res.data.token)

      setStep(TOTAL_STEPS + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.data?.message ??
        err?.message ??
        'Error al completar el registro'
      console.error('[PatientOnboarding] register error:', err?.response?.data ?? err)
      setSubmitError(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /* ── Derived values ─────────────────────────────────────────────────────── */
  const professionalName =
    invitation?.professionalName ??
    invitation?.professional?.name ??
    ([invitation?.professional?.firstName, invitation?.professional?.lastName]
      .filter(Boolean).join(' ') || null)

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#0075C9]/20 border-t-[#0075C9] mx-auto mb-4" />
          <p className="text-gray-500 text-[14px]">Verificando invitación…</p>
        </div>
      </div>
    )
  }

  // ── Hard block ────────────────────────────────────────────────────────────
  if (!token || hardBlockError) {
    const message = hardBlockError ?? 'No se encontró un token de registro en este enlace.'
    const isUsed  = hardBlockError?.includes('ya fue utilizado')

    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6"><BrandLogo symbolOnly size="h-10 w-10" /></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isUsed ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100'
          }`}>
            {isUsed
              ? <AlertCircle className="w-5 h-5 text-amber-500" />
              : <X className="w-5 h-5 text-rose-500" strokeWidth={2.4} />}
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight mb-2">
            {isUsed ? 'Enlace ya utilizado' : 'Enlace inválido'}
          </h2>
          <p className="text-gray-500 text-[14px] leading-relaxed mb-7">{message}</p>
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

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step > TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6"><BrandLogo symbolOnly size="h-10 w-10" /></div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-6 h-6 text-emerald-500" strokeWidth={2.6} />
          </div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">¡Registro completado!</h2>
          <p className="text-gray-500 text-[14px] leading-relaxed mb-7">
            Tu perfil ha sido creado exitosamente. Ya puedes acceder a tu portal de paciente.
          </p>
          <button
            onClick={() => window.location.assign('/patient/dashboard')}
            className="w-full bg-[#0075C9] text-white py-3 rounded-xl text-[14px] font-semibold hover:bg-[#005faa] transition-colors"
          >
            Ir a mi portal
          </button>
        </motion.div>
      </div>
    )
  }

  const currentMeta = STEP_META[step - 1]

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Top bar */}
      <header className="border-b border-gray-200/70 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
          <BrandLogo symbolOnly size="h-9 w-9" />
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-[#0075C9]" />
            <span>Información protegida conforme a la LFPDPPP</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-[12px] font-semibold text-[#0075C9] uppercase tracking-[0.15em] mb-3">
            Activación de cuenta
          </p>
          <h1 className="text-[32px] sm:text-[38px] leading-[1.08] font-bold text-gray-900 tracking-tight">
            Completa tu perfil.
          </h1>
          <p className="text-gray-500 text-[15px] mt-4 max-w-xl leading-relaxed">
            {professionalName ? (
              <>Tu terapeuta <span className="font-semibold text-gray-800">{professionalName}</span> te ha invitado a TotalMente.
              Completa la información para activar tu expediente.</>
            ) : (
              'Tu terapeuta te ha invitado a TotalMente. Completa la información para activar tu expediente.'
            )}
          </p>
        </motion.div>

        {/* Soft warning */}
        <AnimatePresence>
          {softWarnError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
            >
              <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span className="flex-1 leading-snug">{softWarnError}</span>
              <button onClick={() => setSoftWarnError(null)} className="text-amber-400 hover:text-amber-600 transition-colors" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200/70"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 font-medium leading-snug">{submitError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <p className="text-[12px] text-gray-500 mt-3">
            Paso <span className="font-semibold text-gray-700">{step}</span> de {TOTAL_STEPS}
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.section
              key={`step-${step}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">{currentMeta.title}</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">{currentMeta.subtitle}</p>
              </div>

              {/* ─── Step 1: Datos personales ──────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nombre" error={errors.firstName?.message} htmlFor="firstName">
                      <input
                        id="firstName"
                        {...register('firstName', { required: 'El nombre es requerido' })}
                        className={`${inputBase} ${errors.firstName ? inputErr : inputOk}`}
                        placeholder="Juan"
                      />
                    </Field>
                    <Field label="Apellido" error={errors.lastName?.message} htmlFor="lastName">
                      <input
                        id="lastName"
                        {...register('lastName', { required: 'El apellido es requerido' })}
                        className={`${inputBase} ${errors.lastName ? inputErr : inputOk}`}
                        placeholder="García"
                      />
                    </Field>
                  </div>

                  <Field label="Correo electrónico" error={errors.email?.message} htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                      })}
                      className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                      placeholder="paciente@ejemplo.com"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Teléfono" optional htmlFor="phone">
                      <input
                        id="phone"
                        {...register('phone')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="+52 555 123 4567"
                      />
                    </Field>
                    <Field label="Fecha de nacimiento" error={errors.dateOfBirth?.message} htmlFor="dateOfBirth">
                      <input
                        id="dateOfBirth"
                        type="date"
                        {...register('dateOfBirth', { required: 'La fecha de nacimiento es requerida' })}
                        className={`${inputBase} ${errors.dateOfBirth ? inputErr : inputOk}`}
                      />
                    </Field>
                  </div>

                  <Field label="Género" optional htmlFor="gender">
                    <Select id="gender" {...register('gender')}>
                      <option value="">Seleccionar…</option>
                      {GENDER_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </Field>

                  {genderValue === 'other' && (
                    <Field label="Especifica tu género" optional htmlFor="genderOther">
                      <input
                        id="genderOther"
                        {...register('genderOther')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="Escribe tu género"
                      />
                    </Field>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Dirección" optional htmlFor="address">
                      <input
                        id="address"
                        {...register('address')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="Ciudad, Estado"
                      />
                    </Field>
                    <Field label="País" optional htmlFor="country">
                      <Select id="country" {...register('country')}>
                        <option value="">Seleccionar…</option>
                        {LATAM_COUNTRIES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ─── Step 2: Credenciales + consulta ───────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <Field label="Contraseña" error={errors.password?.message} htmlFor="password">
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('password', {
                          required: 'La contraseña es requerida',
                          minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        })}
                        className={`${inputBase} pr-12 ${errors.password ? inputErr : inputOk}`}
                        placeholder="Mín. 8 caracteres"
                      />
                      <button
                        type="button" tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirmar contraseña" error={errors.confirmPassword?.message} htmlFor="confirmPassword">
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirmPassword', {
                          required: 'Confirma tu contraseña',
                          validate: (v) => v === password || 'Las contraseñas no coinciden',
                        })}
                        className={`${inputBase} pr-12 ${errors.confirmPassword ? inputErr : inputOk}`}
                        placeholder="Repite tu contraseña"
                      />
                      <button
                        type="button" tabIndex={-1}
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Tipo de sesión" htmlFor="sessionType">
                    <Select id="sessionType" {...register('sessionType')}>
                      {SESSION_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="¿Por qué estás buscando un terapeuta?"
                    error={errors.presentingConcern?.message}
                    htmlFor="presentingConcern"
                  >
                    <textarea
                      id="presentingConcern"
                      rows={4}
                      {...register('presentingConcern', { required: 'Este campo es requerido' })}
                      className={`${inputBase} resize-none ${errors.presentingConcern ? inputErr : inputOk}`}
                      placeholder="Comparte, en tus propias palabras, lo que te trae aquí…"
                    />
                  </Field>
                </div>
              )}

              {/* ─── Step 3: Historial médico ──────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="¿Has recibido terapia anteriormente?" error={errors.previousTherapy?.message}>
                      <Select hasError={!!errors.previousTherapy} {...register('previousTherapy', { required: 'Selecciona una opción' })}>
                        <option value="">Seleccionar…</option>
                        <option value="yes">Sí</option>
                        <option value="no">No</option>
                      </Select>
                    </Field>

                    <Field label="¿Tratamiento previo por salud mental?" error={errors.previousMentalHealthTreatment?.message}>
                      <Select hasError={!!errors.previousMentalHealthTreatment} {...register('previousMentalHealthTreatment', { required: 'Selecciona una opción' })}>
                        <option value="">Seleccionar…</option>
                        <option value="yes">Sí</option>
                        <option value="no">No</option>
                      </Select>
                    </Field>
                  </div>

                  <Field label="¿Alguna operación o intervención quirúrgica?" error={errors.previousSurgery?.message}>
                    <Select hasError={!!errors.previousSurgery} {...register('previousSurgery', { required: 'Selecciona una opción' })}>
                      <option value="">Seleccionar…</option>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </Field>
                  {previousSurgeryValue === 'yes' && (
                    <Field label="Detalle de la intervención" optional>
                      <input
                        {...register('previousSurgeryDetail')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="Describe brevemente…"
                      />
                    </Field>
                  )}

                  <Field label="¿Padeces alguna enfermedad actualmente?" error={errors.currentIllness?.message}>
                    <Select hasError={!!errors.currentIllness} {...register('currentIllness', { required: 'Selecciona una opción' })}>
                      <option value="">Seleccionar…</option>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </Field>
                  {currentIllnessValue === 'yes' && (
                    <Field label="¿Cuál enfermedad?" optional>
                      <input
                        {...register('currentIllnessDetail')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="Describe brevemente…"
                      />
                    </Field>
                  )}

                  <Field label="¿Tomas algún medicamento actualmente?" error={errors.currentMedication?.message}>
                    <Select hasError={!!errors.currentMedication} {...register('currentMedication', { required: 'Selecciona una opción' })}>
                      <option value="">Seleccionar…</option>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </Field>
                  {currentMedicationValue === 'yes' && (
                    <Field label="¿Cuál medicamento?" optional>
                      <input
                        {...register('currentMedicationDetail')}
                        className={`${inputBase} ${inputOk}`}
                        placeholder="Nombre del medicamento…"
                      />
                    </Field>
                  )}

                  <Field
                    label="Número de registro en el sistema de salud"
                    error={errors.healthSystemNumber?.message}
                  >
                    <input
                      {...register('healthSystemNumber', { required: 'Este campo es requerido' })}
                      className={`${inputBase} ${errors.healthSystemNumber ? inputErr : inputOk}`}
                      placeholder="Obra social, seguro social, seguro de salud…"
                    />
                  </Field>
                </div>
              )}

              {/* ─── Step 4: Contacto + consentimientos ────────────────────── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nombre del contacto" error={errors.emergencyContactName?.message} htmlFor="emergencyContactName">
                      <input
                        id="emergencyContactName"
                        {...register('emergencyContactName', { required: 'El nombre del contacto es requerido' })}
                        className={`${inputBase} ${errors.emergencyContactName ? inputErr : inputOk}`}
                        placeholder="Nombre completo"
                      />
                    </Field>
                    <Field label="Teléfono del contacto" error={errors.emergencyContactPhone?.message} htmlFor="emergencyContactPhone">
                      <input
                        id="emergencyContactPhone"
                        {...register('emergencyContactPhone', { required: 'El teléfono del contacto es requerido' })}
                        className={`${inputBase} ${errors.emergencyContactPhone ? inputErr : inputOk}`}
                        placeholder="+52 555 000 0000"
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                    <p className="text-[13px] text-[#0a4f8a] leading-relaxed">
                      Al registrarte, tu terapeuta podrá acceder a tu información para gestionar tus citas y llevar tu expediente clínico de forma segura y confidencial.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        {...register('acceptTerms', { required: 'Debes aceptar los términos' })}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0075C9] focus:ring-[#54C0E8] transition shrink-0"
                      />
                      <span className="text-[13px] text-gray-600 leading-relaxed">
                        Acepto los{' '}
                        <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                          Términos y Condiciones
                        </Link>{' '}del servicio.
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

                    {/* Consentimiento expreso — Art. 9 LFPDPPP */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mt-2">
                      <p className="text-[12px] font-semibold text-amber-900 uppercase tracking-wide mb-2">
                        Consentimiento expreso — Art. 9 LFPDPPP
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          {...register('acceptSensitiveData', { required: 'Debes otorgar consentimiento expreso para datos de salud' })}
                          className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400 transition shrink-0"
                        />
                        <span className="text-[13px] text-amber-900 leading-relaxed">
                          Otorgo consentimiento <strong>expreso, específico e informado</strong> para el tratamiento
                          de mis datos personales sensibles de <strong>salud mental</strong> (diagnósticos, notas terapéuticas,
                          diario personal) por parte de TotalMente y mi terapeuta asignado, conforme al{' '}
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
                </div>
              )}
            </motion.section>
          </AnimatePresence>

          {/* ── Footer navigation ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all"
              >
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="px-7 py-3 bg-[#0075C9] text-white rounded-xl text-[14px] font-semibold hover:bg-[#005faa] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-3 bg-[#0075C9] text-white rounded-xl text-[14px] font-semibold hover:bg-[#005faa] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando…
                  </>
                ) : (
                  'Completar registro'
                )}
              </button>
            )}
          </div>
        </motion.form>

        <p className="text-center text-[13px] text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#0075C9] hover:text-[#004d87] font-semibold transition-colors">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} TotalMente.{' '}
          <Link to="/terminos" className="hover:text-gray-600 transition-colors">Términos</Link>
          {' · '}
          <Link to="/privacidad" className="hover:text-gray-600 transition-colors">Privacidad</Link>
        </p>
      </div>
    </div>
  )
}

export default PatientOnboardingPage
