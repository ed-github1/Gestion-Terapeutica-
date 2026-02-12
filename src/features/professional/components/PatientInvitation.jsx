import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@components'

const PatientInvitation = ({ onClose, onSuccess, professionalName }) => {
  const [step, setStep] = useState(1) // 1: form, 2: sending, 3: success
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    channels: {
      sms: true,
      email: false
    },
    message: ''
  })
  const [inviteResult, setInviteResult] = useState(null)

  const formatPhoneNumber = (value) => {
    const phone = value.replace(/\D/g, '')
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast('Ingresa el nombre completo del paciente', 'warning')
      return false
    }

    if (formData.channels.sms && !formData.phone) {
      showToast('Ingresa un número de teléfono para SMS', 'warning')
      return false
    }

    if (formData.channels.email && !formData.email) {
      showToast('Ingresa un correo electrónico', 'warning')
      return false
    }

    if (!formData.channels.sms && !formData.channels.email) {
      showToast('Selecciona al menos un canal de invitación', 'warning')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setStep(2)

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/invitations/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: cleanPhone ? `+52${cleanPhone}` : null,
          email: formData.email || null,
          channels: Object.keys(formData.channels).filter(ch => formData.channels[ch]),
          customMessage: formData.message,
          professionalName: professionalName || 'tu terapeuta'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setInviteResult(data)
        setStep(3)
        showToast('🎉 Invitación enviada exitosamente', 'success')
        setTimeout(() => {
          onSuccess?.()
        }, 3000)
      } else {
        throw new Error(data.message || 'Error al enviar invitación')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      showToast(`❌ ${error.message}`, 'error')
      setStep(1)
    }
  }

  const copyInviteCode = () => {
    if (inviteResult?.inviteCode) {
      navigator.clipboard.writeText(inviteResult.inviteCode)
      showToast('📋 Código copiado', 'success')
    }
  }

  const copyRegistrationLink = () => {
    if (inviteResult?.registrationLink) {
      navigator.clipboard.writeText(inviteResult.registrationLink)
      showToast('🔗 Enlace copiado', 'success')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-purple-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 via-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between text-white rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Invitar Paciente</h2>
              <p className="text-white/90 text-sm mt-1">Envía una invitación personalizada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="p-8 space-y-6"
              >
                {/* Patient Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Información del Paciente</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                        placeholder="María"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                        placeholder="González"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Channels */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Canales de Contacto</h3>
                  </div>

                  {/* Channel Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                      formData.channels.sms 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                      onClick={() => setFormData({ 
                        ...formData, 
                        channels: { ...formData.channels, sms: !formData.channels.sms }
                      })}
                    >
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.channels.sms}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            channels: { ...formData.channels, sms: e.target.checked }
                          })}
                          className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            📱 SMS (Recomendado)
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Respuesta instantánea
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                      formData.channels.email 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                      onClick={() => setFormData({ 
                        ...formData, 
                        channels: { ...formData.channels, email: !formData.channels.email }
                      })}
                    >
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.channels.email}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            channels: { ...formData.channels, email: e.target.checked }
                          })}
                          className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            📧 Email
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Información detallada
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Phone Input */}
                  {formData.channels.sms && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono (10 dígitos) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          +52
                        </span>
                        <input
                          required={formData.channels.sms}
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength={14}
                          className="w-full pl-14 pr-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email Input */}
                  {formData.channels.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <input
                        required={formData.channels.email}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-purple-50/30"
                        placeholder="maria@ejemplo.com"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Custom Message */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Mensaje Personalizado (Opcional)</h3>
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none bg-purple-50/30"
                    placeholder="Agrega un mensaje personalizado para tu paciente..."
                  />
                  <p className="text-xs text-gray-500 text-right">{formData.message.length}/160 caracteres</p>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div
                key="sending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-pink-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-20 h-20 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Enviando Invitación...</h3>
                <p className="text-gray-600">
                  {formData.channels.sms && formData.channels.email
                    ? 'Enviando por SMS y Email'
                    : formData.channels.sms
                    ? 'Enviando mensaje SMS'
                    : 'Enviando correo electrónico'}
                </p>
              </motion.div>
            )}

            {step === 3 && inviteResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Invitación Enviada!</h3>
                  <p className="text-gray-600">
                    La invitación ha sido enviada exitosamente a {formData.firstName} {formData.lastName}
                  </p>
                </div>

                {/* Invite Details */}
                <div className="space-y-4">
                  {/* Invite Code */}
                  <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Código de Invitación</span>
                      <button
                        onClick={copyInviteCode}
                        className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
                      >
                        Copiar
                      </button>
                    </div>
                    <div className="font-mono text-2xl font-bold text-purple-600 tracking-wider">
                      {inviteResult.inviteCode}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Válido por 7 días</p>
                  </div>

                  {/* Registration Link */}
                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Enlace de Registro</span>
                      <button
                        onClick={copyRegistrationLink}
                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                      >
                        Copiar
                      </button>
                    </div>
                    <div className="text-sm text-blue-600 break-all font-medium">
                      {inviteResult.registrationLink}
                    </div>
                  </div>

                  {/* Delivery Status */}
                  {inviteResult.deliveryStatus && (
                    <div className="space-y-2">
                      {inviteResult.deliveryStatus.sms && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-gray-700">SMS enviado a {formData.phone}</span>
                        </div>
                      )}
                      {inviteResult.deliveryStatus.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">Email enviado a {formData.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">Próximos Pasos</p>
                      <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                        <li>El paciente recibirá el enlace de registro</li>
                        <li>Deberá verificar su teléfono con un código OTP</li>
                        <li>Completará su perfil y aceptará términos</li>
                        <li>Aparecerá en tu lista de pacientes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 1 && (
          <div className="bg-purple-50/50 px-8 py-5 border-t border-purple-100 flex items-center justify-end gap-3 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-purple-300 rounded-2xl text-gray-700 hover:bg-purple-50 transition font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30"
            >
              Enviar Invitación
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-purple-50/50 px-8 py-5 border-t border-purple-100 flex items-center justify-center rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg shadow-purple-500/30"
            >
              Entendido
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default PatientInvitation
