import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { AlertCircle, Eye, EyeOff, TrendingUp, Calendar, Smile, Brain, ArrowRight } from 'lucide-react'
import { useAuth } from './AuthContext'
import { getTrustToken } from '@shared/utils/deviceTrust'
import { BrandLogo } from '@shared/ui'

/* ── Hero Pattern – "Topography" from heropatterns.com ───────────────── */
const topographySvg = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><path d='M5.5 220c8-10 20-14 34-12s27 14 28 30c0 8-3 15-10 21-14 11-32 12-44 1-12-12-16-29-8-40zm530-115c6-8 16-12 28-10s22 12 23 25c0 7-3 13-8 17-11 9-26 10-36 1-10-10-13-24-7-33zm-370 345c5-7 13-10 23-8s18 10 19 21c0 6-2 11-7 14-9 8-21 8-29 1-8-8-11-20-6-28z' fill='none' stroke='%23ffffff' stroke-opacity='0.06' stroke-width='1.5'/><path d='M291 75c46 0 84 38 84 84s-38 84-84 84-84-38-84-84 38-84 84-84zm0 14c38.7 0 70 31.3 70 70s-31.3 70-70 70-70-31.3-70-70 31.3-70 70-70z' fill='none' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1'/></svg>`
)}")`

/* ── Floating card component ─────────────────────────────────────────── */
const FloatingCard = ({ children, className = '', delay = 0, rotate = 0, x = 0, y = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.92, rotate: rotate * 0.5 }}
    animate={{ opacity: 1, y: 0, scale: 1, rotate }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute bg-white rounded-2xl shadow-2xl ${className}`}
    style={{ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)` }}
  >
    {children}
  </motion.div>
)

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '', rememberMe: false } })

  const { login } = useAuth()
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const idleExpired    = locationState?.reason === 'idle'
  const sessionExpired = locationState?.reason === 'session_expired'

  const onSubmit = async (data) => {
    setLoginError(null)
    clearErrors(['email', 'password'])
    try {
      const deviceToken = getTrustToken(data.email)
      const result = await login(data.email, data.password, data.rememberMe, deviceToken)

      if (result?.requires2FA === true) {
        navigate('/verify-2fa', {
          state: { tempToken: result.tempToken, email: data.email, password: data.password },
        })
        return
      }

      const userData = result
      if (userData.role === 'health_professional' || userData.role === 'professional') {
        navigate('/dashboard/professional')
      } else if (userData.role === 'patient' || userData.role === 'pacient') {
        navigate('/dashboard/patient')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const message = err?.message || 'Error al iniciar sesión'
      const status  = err?.status
      setLoginError(message)
      if (status === 404) {
        setError('email', { type: 'server', message })
      } else {
        setError('password', { type: 'server', message })
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         LEFT — Pure white form side
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full lg:w-[48%] xl:w-[45%] bg-white flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col justify-between px-8 sm:px-12 lg:px-16 xl:px-20 py-10">
          {/* Logo top-left */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <BrandLogo symbolOnly size="h-10 w-10" />
          </motion.div>

          {/* Form container — vertically centered */}
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Iniciar Sesión</h1>
              <p className="text-gray-500 mt-2 text-[15px]">
                Gestiona tu bienestar de forma integral
              </p>
            </motion.div>

            {/* Notices */}
            {(idleExpired || sessionExpired || loginError) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="mb-6 space-y-2.5"
              >
                {idleExpired && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium leading-snug">
                      Tu sesión se cerró por inactividad. Por favor, iniciá sesión nuevamente.
                    </p>
                  </div>
                )}
                {sessionExpired && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium leading-snug">
                      Tu sesión expiró. Por favor, iniciá sesión nuevamente.
                    </p>
                  </div>
                )}
                {loginError && (
                  <div className="flex items-start gap-2.5 p-3 bg-rose-50 rounded-xl border border-rose-200/70">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-700 font-medium leading-snug">{loginError}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Form ── */}
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Email */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Email<span className="text-rose-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'El correo electrónico es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Formato de correo inválido',
                    },
                    onChange: () => { clearErrors('email'); setLoginError(null) },
                  })}
                  className={`w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-200 ${
                    errors.email
                      ? 'border-2 border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                      : 'border border-gray-300 bg-white hover:border-gray-400 focus:border-[#0075C9] focus:ring-4 focus:ring-sky-50'
                  }`}
                  placeholder="correo@ejemplo.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-5">
                <label htmlFor="password" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Contraseña<span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'La contraseña es requerida',
                      onChange: () => { clearErrors('password'); setLoginError(null) },
                    })}
                    className={`w-full px-4 py-3 pr-11 text-sm rounded-xl outline-none transition-all duration-200 ${
                      errors.password
                        ? 'border-2 border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                        : 'border border-gray-300 bg-white hover:border-gray-400 focus:border-[#0075C9] focus:ring-4 focus:ring-sky-50'
                    }`}
                    placeholder="Mín. 8 caracteres"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between mb-7">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0075C9] focus:ring-[#54C0E8] transition"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-600">Recordarme</span>
                </label>
                <a href="#" className="text-sm text-[#0075C9] hover:text-[#004d87] font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0075C9] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#005faa] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ingresando…
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </motion.form>

            {/* Register link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-7 text-sm text-gray-500"
            >
              ¿Aún no tienes cuenta?{' '}
              <Link to="/register" className="text-[#0075C9] hover:text-[#004d87] font-semibold transition-colors">
                Crear una cuenta
              </Link>
            </motion.p>
          </div>

          {/* Copyright bottom-left */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-xs text-gray-400 mt-8"
          >
            © {new Date().getFullYear()} TotalMente.{' '}
            <Link to="/terminos" className="hover:text-gray-600 transition-colors">Términos</Link>
            {' · '}
            <Link to="/privacidad" className="hover:text-gray-600 transition-colors">Privacidad</Link>
          </motion.p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         RIGHT — Bold branded showcase panel
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#AEE058]/12 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-[#54C0E8]/10 rounded-full blur-2xl" />

        {/* ── Floating UI Cards ── */}
        <div className="relative z-10 w-full h-full p-8">
          {/* Sesiones card — top center */}
          <FloatingCard
            className="top-[10%] left-[8%] w-56 p-4"
            delay={0.3}
            rotate={-3}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0075C9]/10 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-[#0075C9]" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sesiones</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">247</p>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">+18% este mes</span>
            </div>
          </FloatingCard>

          {/* Mood tracker card — center-right */}
          <FloatingCard
            className="top-[13%] right-[6%] w-52 p-5"
            delay={0.5}
            rotate={4}
          >
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Estado de ánimo</p>
            <div className="flex items-end gap-1.5 h-16">
              {[40, 55, 35, 65, 50, 75, 68].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all"
                  style={{
                    height: `${h}%`,
                    background: i === 5
                      ? 'linear-gradient(to top, #0075C9, #54C0E8)'
                      : '#e5e7eb',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-400">Lun</span>
              <span className="text-[10px] text-gray-400">Dom</span>
            </div>
          </FloatingCard>

          {/* Bienestar score — mid-left */}
          <FloatingCard
            className="top-[48%] left-[12%] w-48 p-4"
            delay={0.7}
            rotate={2}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#AEE058] to-[#8bc34a] flex items-center justify-center shadow-md">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Bienestar</p>
                <p className="text-xl font-extrabold text-gray-900">8.4<span className="text-sm font-normal text-gray-400">/10</span></p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-[84%] bg-linear-to-r from-[#AEE058] to-[#8bc34a] rounded-full" />
            </div>
          </FloatingCard>

          {/* Progreso card — bottom-right */}
          <FloatingCard
            className="bottom-[22%] right-[10%] w-60 p-5"
            delay={0.6}
            rotate={-2}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#54C0E8]/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#0075C9]" />
                </div>
                <span className="text-xs font-bold text-gray-700">Progreso terapéutico</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Ansiedad', pct: 72, color: 'from-[#54C0E8] to-[#0075C9]' },
                { label: 'Objetivos', pct: 85, color: 'from-[#AEE058] to-[#8bc34a]' },
                { label: 'Hábitos', pct: 60, color: 'from-[#f59e0b] to-[#f97316]' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-900 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-linear-to-r ${color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FloatingCard>

          {/* Small floating accent — green dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
            className="absolute top-[38%] right-[30%] w-12 h-12 rounded-2xl bg-[#AEE058] shadow-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.div>

          {/* Small floating accent — sky circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, type: 'spring', stiffness: 200 }}
            className="absolute bottom-[38%] left-[5%] w-10 h-10 rounded-full bg-[#54C0E8] shadow-lg flex items-center justify-center"
          >
            <Smile className="w-4.5 h-4.5 text-white" />
          </motion.div>

          {/* Bottom hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute bottom-10 left-8 right-8"
          >
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
              Transforma tu práctica<br />
              <span className="text-[#AEE058]">terapéutica.</span>
            </h2>
            <p className="text-white/50 text-sm mt-3 max-w-sm leading-relaxed">
              Herramientas integrales para profesionales y pacientes en un solo lugar.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
