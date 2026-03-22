import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Link2, Copy, Check, MessageCircle, UserPlus, Loader2 } from 'lucide-react'
import { showToast } from '@shared/ui'
import { invitationsService } from '@shared/services/invitationsService'

const DEFAULT_MESSAGE =
  'Hola, bienvenido/a a este espacio de terapia. Te pido que completes estos datos para poder darte de alta en la plataforma.'


const NewPatientLinkModal = ({ onClose, professionalName }) => {
  const [linkData, setLinkData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState(
    professionalName
      ? `Hola, soy ${professionalName}. Bienvenido/a a este espacio de terapia. Te pido que completes estos datos para poder darte de alta.`
      : DEFAULT_MESSAGE,
  )

  // Create a link-only invitation on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await invitationsService.generateLink()
        if (cancelled) return

        if (!data?.registrationLink) {
          setError('No se pudo generar el enlace de registro')
          return
        }

        setLinkData({
          code: data.inviteCode,
          registrationLink: data.registrationLink,
        })
      } catch (err) {
        if (!cancelled) {
          console.error('[NewPatientLinkModal] error:', err)
          setError(err?.message || 'Error al generar el enlace')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCopy = async () => {
    if (!linkData?.registrationLink) return
    try {
      await navigator.clipboard.writeText(linkData.registrationLink)
      setCopied(true)
      showToast('Enlace copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('No se pudo copiar el enlace', 'error')
    }
  }

  const handleCopyWithMessage = async () => {
    if (!linkData?.registrationLink) return
    const fullText = `${message}\n\n${linkData.registrationLink}`
    try {
      await navigator.clipboard.writeText(fullText)
      showToast('Mensaje y enlace copiados', 'success')
    } catch {
      showToast('No se pudo copiar', 'error')
    }
  }

  const handleShareWhatsApp = () => {
    if (!linkData?.registrationLink) return
    const fullText = `${message}\n\n${linkData.registrationLink}`
    const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`
    window.open(url, '_blank', 'noopener')
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
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Nuevo Paciente
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                Genera un enlace para que el paciente se registre
              </p>
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Generando enlace...</p>
              </motion.div>
            )}

            {/* Error */}
            {!loading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-10"
              >
                <div className="w-14 h-14 bg-red-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </motion.div>
            )}

            {/* Success */}
            {!loading && !error && linkData && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Link (read-only) */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <Link2 className="w-3 h-3" />
                    Enlace de registro
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-300 break-all select-all leading-relaxed">
                      {linkData.registrationLink}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copiar enlace"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <MessageCircle className="w-3 h-3" />
                    Mensaje para el paciente
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition resize-none"
                    placeholder="Escribe un mensaje personalizado..."
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-1">
                    {message.length}/500
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-lg p-3.5">
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
                    Vista previa
                  </p>
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                  <p className="text-xs text-blue-600 break-all mt-2">
                    {linkData.registrationLink}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        {!loading && !error && linkData && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 shrink-0 flex flex-col gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Compartir por WhatsApp
            </button>
            <button
              onClick={handleCopyWithMessage}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar mensaje y enlace
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default NewPatientLinkModal
