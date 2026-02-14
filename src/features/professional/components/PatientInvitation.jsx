import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Send, Check, Copy, UserPlus } from 'lucide-react'
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-5 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invitar Paciente</h2>
              <p className="text-xs text-gray-500 mt-0.5">Envía una invitación personalizada</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="p-6 space-y-5"
              >
                {/* Patient Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Información del Paciente</h3>
                  <div className="space-y-3">
                    <input
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Nombre"
                    />
                    <input
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Apellidos"
                    />
                  </div>
                </div>

                {/* Contact Channels */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Canal de Envío</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, channels: { sms: true, email: false }})}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        formData.channels.sms && !formData.channels.email
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📱 SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, channels: { sms: false, email: true }})}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        formData.channels.email && !formData.channels.sms
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📧 Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, channels: { sms: true, email: true }})}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        formData.channels.sms && formData.channels.email
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Ambos
                    </button>
                  </div>

                  {/* Phone Input */}
                  {formData.channels.sms && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                        +52
                      </span>
                      <input
                        required={formData.channels.sms}
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        maxLength={14}
                        className="w-full pl-12 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="(555) 123-4567"
                      />
                    </motion.div>
                  )}

                  {/* Email Input */}
                  {formData.channels.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        required={formData.channels.email}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="correo@ejemplo.com"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mensaje (Opcional)</h3>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={2}
                    maxLength={160}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                    placeholder="Agrega un mensaje personalizado..."
                  />
                  <p className="text-xs text-gray-400 text-right">{formData.message.length}/160</p>
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
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Send className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Enviando...</h3>
                <p className="text-sm text-gray-500">
                  {formData.channels.sms && formData.channels.email
                    ? 'Por SMS y Email'
                    : formData.channels.sms
                    ? 'Por SMS'
                    : 'Por Email'}
                </p>
              </motion.div>
            )}

            {step === 3 && inviteResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">¡Invitación Enviada!</h3>
                  <p className="text-sm text-gray-600">
                    {formData.firstName} {formData.lastName}
                  </p>
                </div>

                {/* Invite Code */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Código</span>
                    <button
                      onClick={copyInviteCode}
                      className="text-indigo-600 hover:text-indigo-700 p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-mono text-xl font-bold text-indigo-600 tracking-wider">
                    {inviteResult.inviteCode}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Válido 7 días</p>
                </div>

                {/* Registration Link */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Enlace</span>
                    <button
                      onClick={copyRegistrationLink}
                      className="text-gray-600 hover:text-gray-700 p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 break-all">
                    {inviteResult.registrationLink}
                  </div>
                </div>

                {/* Delivery Status */}
                {inviteResult.deliveryStatus && (
                  <div className="space-y-1.5 pt-2">
                    {inviteResult.deliveryStatus.sms && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        SMS enviado a {formData.phone}
                      </div>
                    )}
                    {inviteResult.deliveryStatus.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        Email enviado a {formData.email}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 1 && (
          <div className="p-6 pt-4 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default PatientInvitation
