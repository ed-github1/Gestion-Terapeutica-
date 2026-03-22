import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { X, Copy, UserPlus, MessageCircle, Loader2, Link } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { invitationsService } from '@shared/services/invitationsService'

const MAX_MESSAGE_LENGTH = 500

const PatientInvitation = ({ onClose, onSuccess, professionalName }) => {
  const name = professionalName || 'tu terapeuta'
  const defaultMessage = `Hola, soy ${name}. Bienvenido/a a este espacio de terapia. Te pido que completes estos datos para poder darte de alta.`

  const [isLoading, setIsLoading] = useState(true)
  const [registrationLink, setRegistrationLink] = useState('')
  const [message, setMessage] = useState(defaultMessage)

  useEffect(() => {
    generateLink()
  }, [])

  const generateLink = async () => {
    setIsLoading(true)
    try {
      const data = await invitationsService.generateLink()
      setRegistrationLink(data.registrationLink)
    } catch (error) {
      console.error('Error generating link:', error)
      showToast('Error al generar el enlace de registro', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fullShareText = `${message}\n${registrationLink}`

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink)
    showToast('Enlace copiado', 'success')
  }

  const copyMessageAndLink = () => {
    navigator.clipboard.writeText(fullShareText)
    showToast('Mensaje y enlace copiados', 'success')
  }

  const shareWhatsApp = () => {
    const encoded = encodeURIComponent(fullShareText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Nuevo Paciente</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Genera un enlace para que el paciente se registre</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">

          {/* Registration Link */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Link className="w-3 h-3" /> Enlace de registro
            </p>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
              {isLoading ? (
                <div className="flex items-center gap-2 flex-1">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">Generando enlace...</span>
                </div>
              ) : (
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono">{registrationLink}</span>
              )}
              <button
                onClick={copyLink}
                disabled={isLoading}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> Mensaje para el paciente
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:border-blue-500 transition resize-none"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right">{message.length}/{MAX_MESSAGE_LENGTH}</p>
          </div>

          {/* Preview */}
          <div className="border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Vista previa</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{message}</p>
            {registrationLink && (
              <p className="text-sm text-blue-600 break-all">{registrationLink}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={shareWhatsApp}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </button>
          <button
            onClick={copyMessageAndLink}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            Copiar mensaje y enlace
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientInvitation
