/**
 * components/common/SessionLockOverlay.jsx
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
import { Lock, Eye, EyeOff, AlertCircle, LogOut, Brain } from 'lucide-react'

const MAX_ATTEMPTS  = 5     // after this → full logout
const BASE_DELAY_MS = 2_000 // base back-off per attempt

const SessionLockOverlay = ({
  user,
  onUnlock,      // async (password) => void — throws on wrong password
  onFullLogout,  // () => void — signs out completely
}) => {
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
      className="fixed inset-0 z-10000 flex items-center justify-center
                 bg-slate-900/80 backdrop-blur-md"
    >
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Top accent bar ─────────────────────────────────────── */}
        <div className="h-1 bg-linear-to-r from-indigo-500 to-purple-600" />

        <div className="p-8 space-y-6">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center space-y-3">
            {/* Branding mark */}
            <div className="flex justify-center mb-1">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* User avatar */}
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-400 to-purple-500
                              flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {getInitials()}
              </div>
              {/* Lock badge */}
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full
                               flex items-center justify-center shadow-md">
                <Lock className="w-3 h-3 text-white" />
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Sesión bloqueada</h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-65 mx-auto">
                {getDisplayName()}
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-snug">
              Tu sesión fue bloqueada por inactividad.<br />
              Ingresá tu contraseña para continuar.
            </p>
          </div>

          {/* ── Error banner ────────────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-700 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* ── Password form ────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setError(null); setPassword(e.target.value) }}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                disabled={loading || cooldown > 0}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           outline-none transition disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!password.trim() || loading || cooldown > 0}
              className="w-full bg-linear-to-r from-indigo-600 to-blue-600 text-white
                         py-2.5 rounded-lg text-sm font-semibold
                         hover:from-indigo-700 hover:to-blue-700
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         transition shadow-md hover:shadow-lg
                         disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="pt-2 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={onFullLogout}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400
                         hover:text-rose-500 transition font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Iniciar sesión con otra cuenta
            </button>
          </div>

        </div>
      </div>

      {/* Attempt progress bar */}
      {attempts > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < attempts ? 'bg-rose-400' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionLockOverlay
