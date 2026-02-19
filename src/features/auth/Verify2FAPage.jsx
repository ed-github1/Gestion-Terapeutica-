import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'
import apiClient from '@shared/api/client'
import { useAuth } from './AuthContext'

const Verify2FAPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { completeLogin } = useAuth()

  const tempTokenRef = useRef(state?.tempToken ?? null)
  const [tempToken, setTempToken] = useState(state?.tempToken ?? null)
  const email = state?.email ?? null
  const password = state?.password ?? null

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // Guard: no tempToken → back to login
  useEffect(() => {
    if (!tempToken) {
      navigate('/login', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect after fatal errors
  const scheduleLoginRedirect = (msg) => {
    setError(msg)
    setTimeout(() => navigate('/login', { replace: true }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Ingresá un código de 6 dígitos.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const response = await apiClient.post(
        '/auth/verify-2fa',
        { tempToken, code },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      )
      const data = response.data

      if (data.success === true) {
        // Try every known response envelope shape
        const realToken =
          data.data?.token ??
          data.data?.accessToken ??
          data.token ??
          data.accessToken ??
          data.access_token ??
          null
        console.debug('[Verify2FA] verify-2fa response:', JSON.stringify(data))
        if (!realToken) {
          setError('El servidor no devolvió un token válido. Contactá soporte.')
          return
        }
        const userData = await completeLogin(realToken)
        // Role-based navigation
        const role = userData?.role || userData?.rol
        if (role === 'health_professional' || role === 'professional') {
          navigate('/dashboard/professional', { replace: true })
        } else if (role === 'patient' || role === 'pacient') {
          navigate('/dashboard/patient', { replace: true })
        } else {
          // Unknown role — fall back to patient dashboard as safe default
          // (avoids the wildcard route redirecting to home)
          navigate('/dashboard/patient', { replace: true })
        }
      } else {
        setError('Verificación fallida. Intentá de nuevo.')
      }
    } catch (err) {
      const errorCode = err.data?.code || err.data?.errorCode
      const apiMessage = err.message || 'Error de verificación'

      switch (errorCode) {
        case 'INVALID_OTP':
          setError(apiMessage)
          break
        case 'OTP_EXPIRED':
          scheduleLoginRedirect('El código expiró. Redirigiendo al inicio de sesión...')
          break
        case 'OTP_MAX_ATTEMPTS':
          scheduleLoginRedirect('Demasiados intentos. Redirigiendo al inicio de sesión...')
          break
        case 'INVALID_TEMP_TOKEN':
          scheduleLoginRedirect('Sesión expirada. Redirigiendo al inicio de sesión...')
          break
        default:
          setError(apiMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || !password) {
      setError('No se pueden reenviar las credenciales. Volvé al inicio de sesión.')
      return
    }
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const data = response.data
      const newTempToken = data.data?.tempToken
      if (newTempToken) {
        tempTokenRef.current = newTempToken
        setTempToken(newTempToken)
        setCode('')
        setInfo('Código reenviado. Revisá tu correo.')
      } else {
        setError('No se pudo reenviar el código.')
      }
    } catch (err) {
      setError(err.message || 'Error al reenviar el código.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-indigo-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verificación en dos pasos</h1>
              <p className="text-sm text-gray-500 mt-1">
                Revisá tu correo, te enviamos un código de 6 dígitos. Expira en 10 minutos.
              </p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Info banner */}
          {info && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium leading-snug">{info}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="otp-code"
                className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
              >
                Código de verificación
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setError(null)
                  setInfo(null)
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }}
                className="w-full text-center text-2xl font-bold tracking-[0.5em] px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="······"
                disabled={submitting}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Verificar'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">¿No recibiste el código?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default Verify2FAPage
