import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '../../components'

const PatientRegister = () => {
  const navigate = useNavigate()
  const { inviteCode: urlInviteCode } = useParams()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)
  const [inviteData, setInviteData] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [formData, setFormData] = useState({
    inviteCode: urlInviteCode || searchParams.get('code') || '',
    phone: '',
    otp: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    acceptTerms: false,
    acceptPrivacy: false
  })

  useEffect(() => {
    if (formData.inviteCode) {
      verifyInviteCode()
    }
  }, [])

  const verifyInviteCode = async () => {
    if (!formData.inviteCode) {
      console.error('❌ No invite code provided')
      showToast('Ingresa un código de invitación', 'warning')
      return
    }

    console.log('🔍 Verifying invitation code:', formData.inviteCode)
    setLoading(true)
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/invitations/verify/${formData.inviteCode}`
      console.log('📡 Calling:', url)
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      console.log('📥 Response status:', response.status)
      const data = await response.json()
      console.log('📥 Response data:', data)
      console.log('📥 data.valid:', data.valid)
      console.log('📥 data.success:', data.success)
      console.log('📥 data.invitation:', data.invitation)
      console.log('📥 data.data:', data.data)
      console.log('📥 Full structure:', JSON.stringify(data, null, 2))

      // Backend returns {success: true, data: {...}} or {valid: true, invitation: {...}}
      const isValid = response.ok && (data.valid || data.success)
      const invitationData = data.invitation || data.data || data
      
      if (isValid && invitationData) {
        console.log('✅ Invitation valid:', invitationData)
        setInviteData(invitationData)
        
        const updatedFormData = {
          ...formData,
          firstName: invitationData.firstName || invitationData.nombre || '',
          lastName: invitationData.lastName || invitationData.apellido || '',
          phone: invitationData.phone || invitationData.telefono || '',
          email: invitationData.email || invitationData.patientEmail || ''
        }
        
        console.log('📝 Updated form data:', updatedFormData)
        setFormData(updatedFormData)
        setStep(2) // Move directly to registration form
        showToast('✅ Código válido', 'success')
      } else {
        console.error('❌ Invalid invitation:', data)
        throw new Error(data.message || 'Código de invitación inválido')
      }
    } catch (error) {
      console.error('❌ Error verifying code:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const sendOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      showToast('Ingresa un número de teléfono válido', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formData.phone })
        }
      )

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        showToast('📱 Código enviado a tu teléfono', 'success')
      } else {
        throw new Error(data.message || 'Error al enviar código')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      showToast('Ingresa el código de 6 dígitos', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.phone,
            code: formData.otp
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        setStep(3) // Move to registration form
        showToast('✅ Teléfono verificado', 'success')
      } else {
        throw new Error(data.message || 'Código incorrecto')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validations
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error')
      return
    }

    if (formData.password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'warning')
      return
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      showToast('Debes aceptar los términos y condiciones', 'warning')
      return
    }

    setLoading(true)
    try {
      // Send minimal data - backend will populate from invitation
      const registrationPayload = {
        inviteCode: formData.inviteCode,
        password: formData.password,
        consentimientos: {
          tratamientoDatos: {
            aceptado: formData.acceptPrivacy,
            fecha: new Date()
          },
          terminosCondiciones: {
            aceptado: formData.acceptTerms,
            fecha: new Date()
          }
        }
      }
      
      console.log('═══════════════════════════════════════')
      console.log('📤 PATIENT REGISTRATION PAYLOAD')
      console.log('═══════════════════════════════════════')
      console.log('Form Data:', formData)
      console.log('Email from form:', formData.email)
      console.log('─────────────────────────────────────')
      console.log('Registration Payload:', JSON.stringify(registrationPayload, null, 2))
      console.log('═══════════════════════════════════════')
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/register/patient`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationPayload)
        }
      )

      const data = await response.json()
      console.log('📥 Registration response:', data)

      if (response.ok) {
        setStep(3) // Success
        showToast('🎉 ¡Registro exitoso!', 'success')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        throw new Error(data.message || 'Error en el registro')
      }
    } catch (error) {
      console.error('Error registering:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-linear-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido a GestionTerapéutica</h1>
          <p className="text-gray-600">Completa tu registro para comenzar</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  s < step ? 'bg-emerald-500 text-white' :
                  s === step ? 'bg-purple-500 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-1 mx-1 transition ${
                    s < step ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-4 text-xs text-gray-600 font-medium">
            <span>Código</span>
            <span>Teléfono</span>
            <span>Datos</span>
            <span>Listo</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Verify Invite Code */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Código de Invitación</h2>
                  <p className="text-gray-600">Ingresa el código que recibiste de tu terapeuta</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full px-6 py-4 text-center text-2xl font-mono font-bold tracking-wider border-2 border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30 uppercase"
                    placeholder="ABCD1234"
                    maxLength={8}
                  />

                  <button
                    onClick={verifyInviteCode}
                    disabled={loading || !formData.inviteCode}
                    className="w-full px-6 py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Registration Form */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister}
                className="p-8 space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Crea tu Cuenta</h2>
                  <p className="text-gray-600">Solo necesitas crear una contraseña para acceder</p>
                </div>

                {/* Show invitation info */}
                {inviteData && (
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📋 Invitación de tu terapeuta:</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Código:</span> {inviteData.code}</p>
                      {inviteData.patientName && <p><span className="font-medium">Nombre:</span> {inviteData.patientName}</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Tu terapeuta ya registró tu información</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>

                {/* Terms and Privacy */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      required
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      Acepto los <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">términos y condiciones</a> del servicio
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      required
                      type="checkbox"
                      checked={formData.acceptPrivacy}
                      onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      He leído y acepto el <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">aviso de privacidad</a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Completar Registro'}
                </button>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <div className="w-24 h-24 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">¡Registro Completado!</h2>
                <p className="text-gray-600 mb-2">Tu cuenta ha sido creada exitosamente</p>
                <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Back to Login */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6"
          >
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Volver al inicio de sesión
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PatientRegister
