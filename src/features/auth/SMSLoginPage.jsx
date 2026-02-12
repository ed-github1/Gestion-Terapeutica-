import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '@services/auth'
import { showToast } from '@components'

const SMSLoginPage = () => {
  const [step, setStep] = useState('phone') // 'phone' or 'verify'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()

  const { register: registerPhone, handleSubmit: handleSubmitPhone, formState: { errors: phoneErrors } } = useForm()
  const { register: registerCode, handleSubmit: handleSubmitCode, formState: { errors: codeErrors }, watch } = useForm()

  // Format phone number for display
  const formatPhoneNumber = (value) => {
    if (!value) return value
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Step 1: Send SMS Code
  const onSubmitPhone = async (data) => {
    try {
      setLoading(true)
      const cleanPhone = data.phone.replace(/[^\d]/g, '')
      
      const response = await authAPI.loginWithSMS(cleanPhone)
      
      if (response.data.success) {
        setPhoneNumber(cleanPhone)
        setStep('verify')
        startResendTimer()
        showToast('Código enviado exitosamente', 'success')
      } else {
        showToast(response.data.message || 'Error al enviar código', 'error')
      }
    } catch (error) {
      showToast(error.message || 'Error al enviar código SMS', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Code and Login
  const onSubmitCode = async (data) => {
    try {
      setLoading(true)
      const code = data.code
      
      const response = await authAPI.verifyLoginSMS(phoneNumber, code, data.rememberMe)
      
      if (response.data.success) {
        const { token, user } = response.data.data
        
        // Store token and user data
        const storage = data.rememberMe ? localStorage : sessionStorage
        storage.setItem('authToken', token)
        storage.setItem('userData', JSON.stringify(user))
        
        showToast('¡Inicio de sesión exitoso!', 'success')
        
        // Redirect based on user role
        setTimeout(() => {
          if (user.role === 'health_professional' || user.role === 'professional') {
            navigate('/dashboard/professional')
          } else if (user.role === 'patient' || user.role === 'pacient') {
            navigate('/dashboard/patient')
          } else {
            navigate('/dashboard')
          }
        }, 500)
      } else {
        showToast(response.data.message || 'Código inválido', 'error')
      }
    } catch (error) {
      showToast(error.message || 'Error al verificar código', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    if (resendTimer > 0) return
    
    try {
      setLoading(true)
      const response = await authAPI.loginWithSMS(phoneNumber)
      
      if (response.data.success) {
        startResendTimer()
        showToast('Código reenviado', 'success')
      } else {
        showToast(response.data.message || 'Error al reenviar código', 'error')
      }
    } catch (error) {
      showToast(error.message || 'Error al reenviar código', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Back to phone input
  const handleBackToPhone = () => {
    setStep('phone')
    setPhoneNumber('')
    setResendTimer(0)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              {step === 'phone' ? 'Ingresa tu número' : 'Verifica tu código'}
            </h1>
            <p className="text-gray-500">
              {step === 'phone' 
                ? 'Te enviaremos un código de verificación' 
                : `Código enviado a ${formatPhoneNumber(phoneNumber)}`}
            </p>
          </div>

          {/* Phone Number Step */}
          {step === 'phone' && (
            <form onSubmit={handleSubmitPhone(onSubmitPhone)} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...registerPhone('phone', {
                    required: 'El número de teléfono es requerido',
                    pattern: {
                      value: /^[\d\s\(\)\-]+$/,
                      message: 'Número de teléfono inválido'
                    },
                    minLength: {
                      value: 10,
                      message: 'El número debe tener al menos 10 dígitos'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${
                    phoneErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(123) 456-7890"
                  maxLength="14"
                  onChange={(e) => {
                    e.target.value = formatPhoneNumber(e.target.value)
                  }}
                />
                {phoneErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{phoneErrors.phone.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-indigo-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Código'
                )}
              </button>
            </form>
          )}

          {/* Verification Code Step */}
          {step === 'verify' && (
            <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificación
                </label>
                <input
                  id="code"
                  type="text"
                  {...registerCode('code', {
                    required: 'El código es requerido',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'El código debe tener 6 dígitos'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none ${
                    codeErrors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                />
                {codeErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{codeErrors.code.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...registerCode('rememberMe')}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Mantener sesión iniciada
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-indigo-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  'Verificar e Iniciar Sesión'
                )}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500">
                    Reenviar código en {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                )}
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToPhone}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium transition"
              >
                ← Usar otro número
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Alternative Login Methods */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700 font-medium">Iniciar con Correo</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center text-sm">
            <span className="text-gray-600">¿No tienes cuenta? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Regístrate aquí
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Al continuar, aceptas nuestros</p>
          <div className="space-x-2">
            <button className="text-indigo-600 hover:underline">Términos de Servicio</button>
            <span>y</span>
            <button className="text-indigo-600 hover:underline">Política de Privacidad</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SMSLoginPage
