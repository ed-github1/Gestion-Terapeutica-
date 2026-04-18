import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { authService } from '@shared/services/authService'
import { showToast } from '@shared/ui/Toast'
import { AlertCircle, Eye, EyeOff, WifiOff, ShieldCheck, HeartPulse, Stethoscope, ChevronDown } from 'lucide-react'
import { BrandLogo } from '@shared/ui'
import { PROFESSIONAL_COUNTRIES } from '@shared/constants/subscriptionPlans'

/* ── Hero Pattern – subtle topographic (matches Login) ─────────────── */
const topographySvg = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><path d='M5.5 220c8-10 20-14 34-12s27 14 28 30c0 8-3 15-10 21-14 11-32 12-44 1-12-12-16-29-8-40zm530-115c6-8 16-12 28-10s22 12 23 25c0 7-3 13-8 17-11 9-26 10-36 1-10-10-13-24-7-33zm-370 345c5-7 13-10 23-8s18 10 19 21c0 6-2 11-7 14-9 8-21 8-29 1-8-8-11-20-6-28z' fill='none' stroke='%23ffffff' stroke-opacity='0.06' stroke-width='1.5'/><path d='M291 75c46 0 84 38 84 84s-38 84-84 84-84-38-84-84 38-84 84-84zm0 14c38.7 0 70 31.3 70 70s-31.3 70-70 70-70-31.3-70-70 31.3-70 70-70z' fill='none' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1'/></svg>`
)}")`

// Password strength: returns { score 0-4, label, color }
const getPasswordStrength = (pwd = '') => {
    let score = 0
    if (pwd.length >= 8)           score++
    if (/[A-Z]/.test(pwd))         score++
    if (/[0-9]/.test(pwd))         score++
    if (/[^A-Za-z0-9]/.test(pwd))  score++
    const levels = [
        { label: '',        color: 'bg-gray-200'    },
        { label: 'Débil',   color: 'bg-rose-500'    },
        { label: 'Regular', color: 'bg-amber-400'   },
        { label: 'Buena',   color: 'bg-yellow-400'  },
        { label: 'Fuerte',  color: 'bg-emerald-500' },
    ]
    return { score, ...levels[score] }
}

/* ── Shared input classes (big, clean, iconless) ─────────────────── */
const inputBase =
    'w-full px-4 py-3.5 text-[15px] rounded-xl outline-none transition-all duration-200 bg-white placeholder:text-gray-400'
const inputOk =
    'border border-gray-300 hover:border-gray-400 focus:border-[#0075C9] focus:ring-4 focus:ring-sky-50'
const inputErr =
    'border-2 border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'

const RegisterPage = () => {
    const [apiError, setApiError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const { register, handleSubmit, watch, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            firstName: '', lastName: '', email: '',
            password: '', confirmPassword: '',
            role: 'health_professional', country: '', terms: false, sensitiveConsent: false,
        }
    })

    const navigate = useNavigate()
    const password = watch('password')
    const passwordStrength = getPasswordStrength(password)

    const onSubmit = async (data) => {
        setApiError(null)
        clearErrors(['email', 'password'])
        try {
            await authService.register({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role,
                country: data.country,
            })
            showToast('Cuenta creada exitosamente', 'success')
            navigate('/login')
        } catch (err) {
            const message = err?.message || 'Error al registrar'
            const status  = err?.status
            if (status === 409) {
                setError('email', { type: 'server', message })
            } else if (status === 400) {
                setApiError({ message })
            } else if (status === 0) {
                setApiError({ message, icon: 'wifi' })
            } else {
                setApiError({ message })
            }
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               LEFT — Form side
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="w-full lg:w-[52%] xl:w-[48%] bg-white flex flex-col min-h-screen">
                <div className="flex-1 flex flex-col px-8 sm:px-12 lg:px-14 xl:px-20 py-10">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <BrandLogo symbolOnly size="h-10 w-10" />
                    </motion.div>

                    {/* Form container */}
                    <div className="w-full max-w-md mx-auto lg:mx-0 mt-10 lg:mt-16">
                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.08 }}
                            className="mb-8"
                        >
                            <p className="text-[12px] font-semibold text-[#0075C9] uppercase tracking-[0.15em] mb-2">
                                Registro profesional
                            </p>
                            <h1 className="text-[32px] leading-tight font-bold text-gray-900 tracking-tight">
                                Crea tu cuenta clínica
                            </h1>
                            <p className="text-gray-500 mt-2 text-[15px]">
                                Gestiona pacientes, sesiones y tratamientos en una plataforma diseñada para profesionales de la salud mental.
                            </p>
                        </motion.div>

                        {/* API Error banner */}
                        <AnimatePresence>
                            {apiError && (
                                <motion.div
                                    key="api-err"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-6 flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200/70"
                                >
                                    {apiError.icon === 'wifi'
                                        ? <WifiOff className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                        : <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
                                    <p className="text-sm text-rose-700 font-medium leading-snug">{apiError.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Form ── */}
                        <motion.form
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.16 }}
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="space-y-5"
                        >
                            <input type="hidden" {...register('role')} value="health_professional" />

                            {/* Name row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                        Nombre<span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        {...register('firstName', {
                                            required: 'El nombre es requerido',
                                            minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                                        })}
                                        className={`${inputBase} ${errors.firstName ? inputErr : inputOk}`}
                                        placeholder="Juan"
                                        disabled={isSubmitting}
                                    />
                                    <AnimatePresence>
                                        {errors.firstName && (
                                            <motion.p key="fn-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.firstName.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                        Apellido<span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        {...register('lastName', {
                                            required: 'El apellido es requerido',
                                            minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                                        })}
                                        className={`${inputBase} ${errors.lastName ? inputErr : inputOk}`}
                                        placeholder="Pérez"
                                        disabled={isSubmitting}
                                    />
                                    <AnimatePresence>
                                        {errors.lastName && (
                                            <motion.p key="ln-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.lastName.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label htmlFor="country" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                    País de ejercicio<span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="country"
                                        {...register('country', { required: 'Selecciona tu país' })}
                                        className={`${inputBase} appearance-none pr-11 ${errors.country ? inputErr : inputOk}`}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Selecciona tu país…</option>
                                        {PROFESSIONAL_COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <AnimatePresence>
                                    {errors.country && (
                                        <motion.p key="country-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 shrink-0" /> {errors.country.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                    Correo electrónico profesional<span className="text-rose-400">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    {...register('email', {
                                        required: 'El correo electrónico es requerido',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Formato de correo inválido'
                                        },
                                        onChange: () => { clearErrors('email'); setApiError(null) }
                                    })}
                                    className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                                    placeholder="dr.perez@clinica.com"
                                    disabled={isSubmitting}
                                />
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.p key="em-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Password */}
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
                                            onChange: () => clearErrors('password')
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
                                {/* Strength meter */}
                                {password && (
                                    <div className="mt-2.5 space-y-1.5">
                                        <div className="flex gap-1">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                                    i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                                                }`} />
                                            ))}
                                        </div>
                                        {passwordStrength.label && (
                                            <p className={`text-[11px] font-medium ${
                                                passwordStrength.score <= 1 ? 'text-rose-500' :
                                                passwordStrength.score === 2 ? 'text-amber-500' :
                                                passwordStrength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'
                                            }`}>Contraseña {passwordStrength.label.toLowerCase()}</p>
                                        )}
                                    </div>
                                )}
                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.p key="pw-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 shrink-0" /> {errors.password.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Confirm Password */}
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
                                            required: 'Debes confirmar la contraseña',
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
                                <AnimatePresence>
                                    {errors.confirmPassword && (
                                        <motion.p key="cpw-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 shrink-0" /> {errors.confirmPassword.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Consents */}
                            <div className="pt-2 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        {...register('terms', {
                                            validate: value => value === true || 'Debes aceptar los términos y condiciones'
                                        })}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0075C9] focus:ring-[#54C0E8] transition shrink-0"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-[13px] text-gray-600 leading-relaxed">
                                        Acepto los{' '}
                                        <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                                            Términos y Condiciones
                                        </Link>{' '}
                                        y la{' '}
                                        <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[#0075C9] hover:text-[#004d87] font-semibold underline-offset-2 hover:underline">
                                            Política de Privacidad
                                        </Link>.
                                    </span>
                                </label>
                                {errors.terms && (
                                    <p className="text-xs text-rose-600 flex items-center gap-1 ml-7">
                                        <AlertCircle className="w-3 h-3 shrink-0" /> {errors.terms.message}
                                    </p>
                                )}

                                {/* Sensitive data consent — Art. 9 LFPDPPP */}
                                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                                    <p className="text-[12px] font-semibold text-amber-900 uppercase tracking-wide mb-2">
                                        Consentimiento — Art. 9 LFPDPPP
                                    </p>
                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            id="sensitiveConsent"
                                            type="checkbox"
                                            {...register('sensitiveConsent', {
                                                validate: value => value === true || 'Debes otorgar consentimiento expreso para datos de salud'
                                            })}
                                            className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400 transition shrink-0"
                                            disabled={isSubmitting}
                                        />
                                        <span className="text-[13px] text-amber-900 leading-relaxed">
                                            Otorgo consentimiento <strong>expreso, específico e informado</strong> para el tratamiento
                                            de datos personales sensibles relativos a la salud mental de mis pacientes, conforme al{' '}
                                            <Link to="/privacidad#datos-sensibles" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                                                Aviso de Privacidad Integral
                                            </Link>.
                                        </span>
                                    </label>
                                    {errors.sensitiveConsent && (
                                        <p className="text-xs text-rose-600 flex items-center gap-1 mt-2 ml-7">
                                            <AlertCircle className="w-3 h-3 shrink-0" /> {errors.sensitiveConsent.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#0075C9] text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-[#005faa] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creando cuenta…
                                    </span>
                                ) : (
                                    'Crear cuenta profesional'
                                )}
                            </button>
                        </motion.form>

                        {/* Sign in link */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                            className="mt-7 text-sm text-gray-500"
                        >
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-[#0075C9] hover:text-[#004d87] font-semibold transition-colors">
                                Iniciar sesión
                            </Link>
                        </motion.p>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="text-xs text-gray-400 mt-10"
                        >
                            © {new Date().getFullYear()} TotalMente.{' '}
                            <Link to="/terminos" className="hover:text-gray-600 transition-colors">Términos</Link>
                            {' · '}
                            <Link to="/privacidad" className="hover:text-gray-600 transition-colors">Privacidad</Link>
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               RIGHT — Branded showcase panel
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="hidden lg:block lg:flex-1 relative overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-[#0075C9] via-[#0068b8] to-[#004080]" />

                {/* Hero pattern overlay */}
                <div
                    className="absolute inset-0 opacity-100"
                    style={{ backgroundImage: topographySvg }}
                />

                {/* Accent orbs */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#54C0E8]/25 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#AEE058]/12 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-[#54C0E8]/10 rounded-full blur-2xl" />

                {/* Content */}
                <div className="relative z-10 h-full w-full flex flex-col justify-between p-12 xl:p-16">
                    {/* Top tagline */}
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-2 text-white/70 text-[13px] font-medium tracking-wide"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#AEE058]" />
                        Plataforma clínica · Telemedicina segura
                    </motion.div>

                    {/* Center — feature cards */}
                    <div className="space-y-5 max-w-md">
                        {[
                            {
                                icon: <Stethoscope className="w-5 h-5 text-[#0075C9]" strokeWidth={2.2} />,
                                title: 'Expedientes clínicos completos',
                                desc: 'Historia, notas terapéuticas y evolución en un solo lugar.'
                            },
                            {
                                icon: <HeartPulse className="w-5 h-5 text-[#0075C9]" strokeWidth={2.2} />,
                                title: 'Teleconsulta integrada',
                                desc: 'Video llamadas encriptadas con grabación y transcripción opcional.'
                            },
                            {
                                icon: <ShieldCheck className="w-5 h-5 text-[#0075C9]" strokeWidth={2.2} />,
                                title: 'Cumplimiento regulatorio',
                                desc: 'Diseñado bajo lineamientos de la LFPDPPP y estándares de privacidad clínica.'
                            },
                        ].map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 + i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
                            >
                                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                                    {f.icon}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-[15px] leading-snug">{f.title}</p>
                                    <p className="text-white/65 text-[13px] leading-relaxed mt-1">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom hero text */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.6 }}
                    >
                        <h2 className="text-3xl xl:text-[38px] font-extrabold text-white leading-[1.1] tracking-tight">
                            Atiende con<br />
                            <span className="text-[#AEE058]">claridad clínica.</span>
                        </h2>
                        <p className="text-white/55 text-sm mt-3 max-w-sm leading-relaxed">
                            Diseñado con y para profesionales de la salud mental. Simple, seguro y soberano.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage
