import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import apiClient, { setAuthToken } from '@shared/api/client'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'

/* ── Constants ─────────────────────────────────────────────────────────────── */

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

const THERAPY_REASONS = [
  'Ansiedad', 'Depresión', 'Estrés', 'Duelo', 'Autoestima',
  'Problemas de pareja', 'Problemas familiares', 'Trauma / TEPT',
  'Adicciones', 'Trastorno alimentario',
]

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Masculino' },
  { value: 'female',            label: 'Femenino' },
  { value: 'non-binary',        label: 'No binario' },
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

/**
 * Invitation statuses that render the form entirely unusable.
 * Any status NOT in this set is treated as valid (including undefined for
 * backends that do not return a status field yet).
 */
const BLOCKED_STATUSES = new Set([
  'expired', 'accepted', 'completed', 'registered', 'cancelled', 'revoked',
])

/**
 * Required fields validated per step.
 * goNext() triggers ONLY these fields so step N errors never block step 1.
 */
const STEP_REQUIRED_FIELDS = {
  1: ['firstName', 'lastName', 'email', 'dateOfBirth'],
  2: ['password', 'confirmPassword', 'presentingConcern', 'presentingConcernOther'],
  3: ['acceptTerms', 'acceptPrivacy'],
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

const inputCls = (hasError) =>
  `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
    hasError
      ? 'border-red-300 bg-red-50'
      : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
  }`

const Field = ({ label, error, children, optional }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600">
      {label}
      {optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[11px] text-red-500 font-medium"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
)

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <img src={logoSymbol} alt="" className="h-9 w-9 object-contain shrink-0" />
    <span className="text-[17px] text-[#4A5568] tracking-tight">
      <span className="font-normal">Total</span><span className="font-bold">Mente</span>
    </span>
  </div>
)

/* ── Steps indicator ──────────────────────────────────────────────────────── */

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }, (_, i) => {
      const step = i + 1
      return (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step < current
                ? 'bg-emerald-500 text-white'
                : step === current
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step < current ? '✓' : step}
          </div>
          {step < total && (
            <div
              className={`w-8 h-1 mx-1 rounded transition-colors ${
                step < current ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
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

  // ── Invitation verification state ────────────────────────────────────────
  const [verifying,      setVerifying]      = useState(!!token)
  const [invitation,     setInvitation]     = useState(null)   // verified invitation data
  const [hardBlockError, setHardBlockError] = useState(null)   // expired / used → blocks form
  const [softWarnError,  setSoftWarnError]  = useState(null)   // network error → show form with warning

  // ── Multi-step form ───────────────────────────────────────────────────────
  const TOTAL_STEPS = 3
  const [step,        setStep]        = useState(1)
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName:             '',
      lastName:              '',
      email:                 '',
      phone:                 '',
      password:              '',
      confirmPassword:       '',
      dateOfBirth:           '',
      gender:                '',
      address:               '',
      sessionType:           'individual',
      presentingConcern:     '',
      referralSource:        'self',
      emergencyContactName:  '',
      emergencyContactPhone: '',
      acceptTerms:           false,
      acceptPrivacy:         false,
      acceptSensitiveData:   false,
    },
    mode: 'onTouched', // show errors only after user touches a field
  })

  const password = watch('password')
  const presentingConcernValue = watch('presentingConcern')

  /* ── Verify invitation on mount ─────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return

    const verify = async () => {
      try {
        const res = await apiClient.get(`/invitations/verify/${token}`)
        const inv = res?.data?.data ?? res?.data ?? res

        // Hard-block if invitation is no longer usable
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

        // Pre-fill any data the professional provided when creating the invite
        const fill = (field, value) => { if (value) setValue(field, value) }
        fill('firstName', inv?.firstName ?? inv?.name?.split(' ')?.[0])
        fill('lastName',  inv?.lastName  ?? inv?.name?.split(' ')?.[1])
        fill('email',     inv?.email)
        fill('phone',     inv?.phone)
      } catch (err) {
        // 404 / 410 → invitation definitively not found
        if (err?.status === 404 || err?.status === 410) {
          setHardBlockError('Este enlace de invitación es inválido o ya expiró.')
          return
        }
        // Network / server error → non-fatal: let user fill the form and let the
        // backend do final validation on submit.
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
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      // Prefer the verified MongoDB ObjectId; fall back to the raw URL token
      // so the backend can still resolve via the invite code lookup.
      const invitationId = invitation?._id ?? invitation?.id ?? null

      const payload = {
        role:       'patient',
        code:       token,   // always send the opaque token
        inviteCode: token,   // also send as inviteCode for compatibility
        ...(invitationId && { invitationId }),

        firstName:             data.firstName,
        lastName:              data.lastName,
        email:                 data.email,
        password:              data.password,
        phone:                 data.phone                || undefined,
        dateOfBirth:           data.dateOfBirth          || undefined,
        gender:                data.gender               || undefined,
        address:               data.address              || undefined,
        sessionType:           data.sessionType,
        presentingConcern:     data.presentingConcern === 'Otro' ? (data.presentingConcernOther || undefined) : (data.presentingConcern || undefined),
        referralSource:        data.referralSource,
        emergencyContactName:  data.emergencyContactName  || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
      }

      const res    = await apiClient.post('/auth/register/patient', payload)
      const result = res?.data ?? res

      // Store JWT using the shared setter (identical to what AuthContext.login does)
      const jwt =
        result?.token ??
        result?.data?.token ??
        result?.accessToken ??
        result?.data?.accessToken ??
        null

      if (jwt) {
        // Do NOT store user object / PHI in localStorage — only the JWT
        setAuthToken(jwt)
      }

      setStep(TOTAL_STEPS + 1)   // advance to success screen
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  // ── Hard block (no token / expired / already used) ─────────────────────────
  if (!token || hardBlockError) {
    const message = hardBlockError ?? 'No se encontró un token de registro en este enlace.'
    const isUsed  = hardBlockError?.includes('ya fue utilizado')

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6"><Logo /></div>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isUsed ? 'bg-amber-100' : 'bg-red-100'}`}>
            {isUsed ? (
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isUsed ? 'Enlace ya utilizado' : 'Enlace Inválido'}
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step > TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6"><Logo /></div>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro completado!</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Tu perfil ha sido creado exitosamente. Ya puedes acceder a tu portal de paciente.
          </p>
          {/*
            Full page assignment (not client-side navigate) so the AuthProvider
            re-mounts and calls /auth/me with the newly stored JWT, properly
            hydrating the user state before ProtectedRoute renders.
          */}
          <button
            onClick={() => window.location.assign('/patient/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold"
          >
            Ir a mi portal
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo / header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-6"
        >
          <Logo />
          <h1 className="text-xl font-bold text-gray-800 mt-3 mb-1">Completa tu perfil</h1>
          <p className="text-sm text-gray-500 text-center">
            {professionalName ? (
              <>Tu terapeuta <span className="font-semibold text-blue-600">{professionalName}</span> te ha invitado a crear tu cuenta</>
            ) : (
              'Tu terapeuta te ha invitado a crear tu cuenta'
            )}
          </p>
        </motion.div>

        {/* Soft (non-blocking) verification warning */}
        <AnimatePresence>
          {softWarnError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="flex-1">{softWarnError}</span>
              <button onClick={() => setSoftWarnError(null)} className="text-amber-400 hover:text-amber-600" aria-label="Cerrar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">

              {/* ─── Step 1: Personal data ─────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-4"
                >
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Datos personales</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre" error={errors.firstName?.message}>
                      <input
                        {...register('firstName', { required: 'Requerido' })}
                        className={inputCls(!!errors.firstName)}
                        placeholder="Juan"
                      />
                    </Field>
                    <Field label="Apellido" error={errors.lastName?.message}>
                      <input
                        {...register('lastName', { required: 'Requerido' })}
                        className={inputCls(!!errors.lastName)}
                        placeholder="García"
                      />
                    </Field>
                  </div>

                  <Field label="Correo electrónico" error={errors.email?.message}>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                      })}
                      className={inputCls(!!errors.email)}
                      placeholder="paciente@ejemplo.com"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teléfono" optional>
                      <input
                        {...register('phone')}
                        className={inputCls(false)}
                        placeholder="+52 555 123 4567"
                      />
                    </Field>
                    <Field label="Fecha de nacimiento" error={errors.dateOfBirth?.message}>
                      <input
                        type="date"
                        {...register('dateOfBirth', { required: 'Requerida' })}
                        className={inputCls(!!errors.dateOfBirth)}
                      />
                    </Field>
                  </div>

                  <Field label="Género" optional>
                    <select {...register('gender')} className={inputCls(false)}>
                      <option value="">Seleccionar...</option>
                      {GENDER_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Dirección" optional>
                    <input {...register('address')} className={inputCls(false)} placeholder="Ciudad, Estado" />
                  </Field>

                  <Field label="País" optional>
                    <select {...register('country')} className={inputCls(false)}>
                      <option value="">Seleccionar...</option>
                      {LATAM_COUNTRIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>
                </motion.div>
              )}

              {/* ─── Step 2: Credentials + clinical info ──────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-4"
                >
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Credenciales y consulta</h3>

                  <Field label="Contraseña" error={errors.password?.message}>
                    <input
                      type="password"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      })}
                      className={inputCls(!!errors.password)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Confirmar contraseña" error={errors.confirmPassword?.message}>
                    <input
                      type="password"
                      {...register('confirmPassword', {
                        required: 'Confirma tu contraseña',
                        validate: (v) => v === password || 'Las contraseñas no coinciden',
                      })}
                      className={inputCls(!!errors.confirmPassword)}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Tipo de sesión">
                    <select {...register('sessionType')} className={inputCls(false)}>
                      {SESSION_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Motivo de consulta" error={errors.presentingConcern?.message}>
                    <select
                      {...register('presentingConcern', { required: 'El motivo de consulta es obligatorio' })}
                      className={inputCls(!!errors.presentingConcern)}
                    >
                      <option value="">Selecciona un motivo</option>
                      {THERAPY_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Otro">Otro</option>
                    </select>
                  </Field>
                  {presentingConcernValue === 'Otro' && (
                    <Field label="Especifica el motivo" error={errors.presentingConcernOther?.message}>
                      <input
                        type="text"
                        {...register('presentingConcernOther', { required: presentingConcernValue === 'Otro' ? 'Especifica el motivo' : false })}
                        className={inputCls(!!errors.presentingConcernOther)}
                        placeholder="Describe tu motivo de consulta"
                      />
                    </Field>
                  )}

                  <Field label="¿Cómo nos conociste?">
                    <select {...register('referralSource')} className={inputCls(false)}>
                      {REFERRAL_SOURCES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>
                </motion.div>
              )}

              {/* ─── Step 3: Emergency contact + consent ──────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-4"
                >
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Contacto de emergencia y consentimiento</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre del contacto" optional>
                      <input
                        {...register('emergencyContactName')}
                        className={inputCls(false)}
                        placeholder="Nombre completo"
                      />
                    </Field>
                    <Field label="Teléfono del contacto" optional>
                      <input
                        {...register('emergencyContactPhone')}
                        className={inputCls(false)}
                        placeholder="+52 555 000 0000"
                      />
                    </Field>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Al registrarte, tu terapeuta podrá ver tu información para gestionar tus citas y llevar tu expediente clínico de forma segura.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('acceptTerms', { required: 'Debes aceptar los términos' })}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        Acepto los{' '}
                        <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Términos y Condiciones</Link>{' '}
                        del servicio.
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-[11px] text-red-500 font-medium ml-7">{errors.acceptTerms.message}</p>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('acceptPrivacy', { required: 'Debes aceptar la política de privacidad' })}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        He leído y acepto la{' '}
                        <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Política de Privacidad</Link>{' '}
                        y el tratamiento de mis datos.
                      </span>
                    </label>
                    {errors.acceptPrivacy && (
                      <p className="text-[11px] text-red-500 font-medium ml-7">{errors.acceptPrivacy.message}</p>
                    )}

                    {/* Consentimiento expreso datos sensibles — Art. 9 LFPDPPP */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] text-amber-800 font-semibold mb-2">Consentimiento expreso — Datos de salud mental (Art. 9 LFPDPPP)</p>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('acceptSensitiveData', { required: 'Debes otorgar consentimiento expreso para datos de salud' })}
                          className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-800 leading-relaxed">
                          Otorgo consentimiento <strong>expreso, específico e informado</strong> para el tratamiento
                          de mis datos personales sensibles de{' '}
                          <strong>salud mental</strong> (diagnósticos, notas terapéuticas, diario) por parte de
                          TotalMente y mi terapeuta asignado, conforme al{' '}
                          <Link to="/privacidad#datos-sensibles" target="_blank" rel="noopener noreferrer" className="underline font-medium">Aviso de Privacidad Integral</Link>.
                        </span>
                      </label>
                      {errors.acceptSensitiveData && (
                        <p className="text-[11px] text-red-500 font-medium ml-7 mt-1">{errors.acceptSensitiveData.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submit error ──────────────────────────────────────────────── */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-6 mb-2 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Footer navigation ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
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
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Completar registro'
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  )
}

export default PatientOnboardingPage
