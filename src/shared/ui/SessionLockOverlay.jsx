/**
 * shared/ui/SessionLockOverlay.jsx
 *
 * HIPAA §164.312(a)(2)(iii) — automatic session lock after inactivity.
 *
 * Replaces the old "log the user out + redirect to /login" pattern.
 * The JWT remains valid on the server; the overlay simply prevents access
 * until the user proves they know their password.  Because the token is
 * already trusted (2FA was completed at initial login), 2FA is NOT repeated.
 *
 * Security properties
 * ───────────────────
 * • MAX_ATTEMPTS failed password tries → full logout + /login redirect.
 * • Each failed attempt triggers a 2 s exponential back-off before the next
 *   attempt is allowed, making brute-force impractical.
 * • "Use a different account" performs a full logout.
 * • The overlay sits at z-[10000] so nothing behind it is reachable via tab.
 * • focus is trapped inside the overlay while it is open.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png'
import { useDarkModeContext } from '@shared/DarkModeContext'

const MAX_ATTEMPTS  = 5     // after this → full logout
const BASE_DELAY_MS = 2_000 // base back-off per attempt

const SessionLockOverlay = ({
  user,
  onUnlock,      // async (password) => void — throws on wrong password
  onFullLogout,  // () => void — signs out completely
}) => {
  const { dark } = useDarkModeContext()
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [attempts,   setAttempts]   = useState(0)
  const [cooldown,   setCooldown]   = useState(0) // seconds remaining in back-off

  const inputRef    = useRef(null)
  const cooldownRef = useRef(null)

  // Auto-focus the password field when overlay mounts
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  // Countdown timer during back-off
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown(s => {
        if (s <= 1) { clearInterval(id); return 0 }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(id)
  }, [cooldown])

  const getInitials = () => {
    if (!user) return '?'
    if (user.nombre && user.apellido)
      return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    if (user.name) {
      const parts = user.name.trim().split(' ')
      return parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : user.name.substring(0, 2).toUpperCase()
    }
    return user.email ? user.email[0].toUpperCase() : '?'
  }

  const getDisplayName = () => {
    if (!user) return ''
    if (user.nombre && user.apellido) return `${user.nombre} ${user.apellido}`
    if (user.name) return user.name
    return user.email ?? ''
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!password.trim() || loading || cooldown > 0) return

    setError(null)
    setLoading(true)
    try {
      await onUnlock(password)
      // On success the parent will unmount this overlay; no state cleanup needed.
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)

      if (next >= MAX_ATTEMPTS) {
        setError(`Demasiados intentos fallidos. Cerrando sesión…`)
        setTimeout(() => onFullLogout(), 1_500)
        return
      }

      const delaySec = Math.round((BASE_DELAY_MS * Math.pow(1.5, next - 1)) / 1_000)
      setError(
        err?.status === 401 || err?.message?.toLowerCase().includes('credencial')
          ? `Contraseña incorrecta. ${MAX_ATTEMPTS - next} intento(s) restante(s).`
          : err?.message || 'Error al verificar la contraseña.',
      )
      setCooldown(delaySec)
      setPassword('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }, [password, loading, cooldown, attempts, onUnlock, onFullLogout])

  // Trap Tab key inside the overlay
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      const focusable = Array.from(
        document.getElementById('session-lock-overlay')
          ?.querySelectorAll('button, input, a, [tabindex]:not([tabindex="-1"])') ?? []
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
  }

  return (
    <div
      id="session-lock-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sesión bloqueada"
      onKeyDown={handleKeyDown}
      className={`${dark ? 'dark' : ''} fixed inset-0 z-10000 flex items-end sm:items-center justify-center
                 bg-[#07101F]/75 dark:bg-[#030810]/88 backdrop-blur-lg`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-xs sm:mx-4
                   bg-white dark:bg-[#111c2e]
                   rounded-t-3xl sm:rounded-2xl overflow-hidden
                   shadow-2xl shadow-black/30 dark:shadow-black/60
                   border-t border-x sm:border border-gray-100 dark:border-[#1e2d45]"
      >
        {/* ── Drag handle — mobile only ─────────────────────────────── */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-[#1e2d45]" />
        </div>

        {/* ── Top accent line — desktop only ───────────────────────────── */}
        <div className="hidden sm:block h-0.5 bg-linear-to-r from-[#0075C9] via-[#54C0E8] to-[#AEE058]" />

        <div className="px-6 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:pt-8 sm:pb-7 space-y-5">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center space-y-4">

            {/* Logo as avatar — clean circle */}
            <div className="relative inline-flex">
              <div
                className="w-16 h-16 rounded-full
                            bg-gray-50 dark:bg-[#0d1829]
                            border border-gray-100 dark:border-gray-900
                            flex items-center justify-center
                            shadow-sm"
              >
                <img src={logoSymbol} alt="Totalmente" className="w-10 h-10 object-contain" />
              </div>
              {/* Lock badge */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5
                           bg-[#0075C9] rounded-full
                           flex items-center justify-center
                           ring-2 ring-white dark:ring-[#111c2e]"
              >
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-semibold tracking-tight
                             text-gray-900 dark:text-gray-50">
                Sesión bloqueada
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400
                            truncate max-w-55 mx-auto">
                {getDisplayName()}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed pt-0.5">
                Ingresá tu contraseña para continuar.
              </p>
            </div>
          </div>

          {/* ── Error banner ────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 px-3 py-2
                           bg-rose-50 dark:bg-rose-950/30
                           rounded-xl border border-rose-100 dark:border-rose-900/50
                           overflow-hidden"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Password form ────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setError(null); setPassword(e.target.value) }}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                disabled={loading || cooldown > 0}
                className="w-full pl-4 pr-11 py-3 text-base sm:text-sm rounded-xl outline-none transition
                           bg-gray-50 dark:bg-[#0d1829]
                           border border-gray-200 dark:border-[#1e2d45]
                           text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           focus:ring-2 focus:ring-[#54C0E8]/60 dark:focus:ring-[#0075C9]/60 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                           text-gray-300 hover:text-[#0075C9] dark:text-gray-600 dark:hover:text-[#54C0E8]
                           transition-colors"
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!password.trim() || loading || cooldown > 0}
              className="w-full
                         bg-[#0075C9] active:bg-[#004f8a] hover:bg-[#005fa3]
                         text-white py-3.5 sm:py-3 rounded-xl text-base sm:text-sm font-medium
                         focus:outline-none focus:ring-2 focus:ring-[#54C0E8]/60
                         focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111c2e]
                         transition
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando…
                </span>
              ) : cooldown > 0 ? (
                `Esperar ${cooldown}s…`
              ) : (
                'Desbloquear'
              )}
            </button>
          </form>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div className="text-center">
            <button
              type="button"
              onClick={onFullLogout}
              className="inline-flex items-center gap-1.5 text-[11px]
                         py-2 px-3 -mx-3
                         text-gray-400 dark:text-gray-600
                         hover:text-rose-400 dark:hover:text-rose-500 active:text-rose-500 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Iniciar sesión con otra cuenta
            </button>
          </div>

        </div>
      </motion.div>

      {/* ── Attempt dots ───────────────────────────────────────────── */}
      {attempts > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < attempts ? 'bg-rose-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionLockOverlay
