/**
 * AppointmentAcceptanceModal.jsx
 * Shown to the patient when a professional creates an appointment.
 * The patient can accept (→ goes to payment) or reject the appointment.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Stethoscope, RefreshCw, Heart, Zap,
  CalendarDays, Clock, Video, Banknote,
  Mail, X, Check, FileText, ChevronLeft,
} from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { showToast } from '@shared/ui/Toast'

const TYPE_CONFIG = {
  consultation: { label: 'Consulta General', Icon: Stethoscope, iconColor: 'text-blue-500',  bg: 'bg-blue-50'  },
  followup:     { label: 'Seguimiento',       Icon: RefreshCw,   iconColor: 'text-sky-500',   bg: 'bg-sky-50'   },
  therapy:      { label: 'Terapia',           Icon: Heart,       iconColor: 'text-rose-500',  bg: 'bg-rose-50'  },
  emergency:    { label: 'Urgencia',          Icon: Zap,         iconColor: 'text-red-500',   bg: 'bg-red-50'   },
}

const AppointmentAcceptanceModal = ({ appointment, onClose, onAccepted, onRejected }) => {
  const [rejecting, setRejecting] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!appointment) return null

  const type = TYPE_CONFIG[appointment.type] || TYPE_CONFIG.consultation
  const TypeIcon = type.Icon
  const aptDate = appointment.date
    ? new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'Fecha por confirmar'
  const price = appointment.price ?? appointment.data?.price ?? 50

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const id = appointment._id || appointment.id || appointment.data?.appointmentId
      await appointmentsService.accept(id)
      showToast('Cita aceptada. Procede al pago.', 'success')
      onAccepted?.(appointment)
    } catch (err) {
      console.error('Error accepting appointment:', err)
      showToast('No se pudo aceptar la cita', 'error')
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const id = appointment._id || appointment.id || appointment.data?.appointmentId
      await appointmentsService.reject(id, rejectReason || 'Rechazada por el paciente')
      showToast('Cita rechazada', 'info')
      onRejected?.(appointment)
      onClose()
    } catch (err) {
      console.error('Error rejecting appointment:', err)
      showToast('No se pudo rechazar la cita', 'error')
    } finally {
      setRejecting(false)
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
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-br from-amber-400 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nueva cita pendiente</h2>
              <p className="text-sm text-white/80 mt-0.5">Tu profesional ha programado una sesión</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Type */}
          <div className="flex items-center gap-3 bg-stone-50 rounded-2xl p-4">
            <div className={`w-10 h-10 ${type.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <TypeIcon className={`w-5 h-5 ${type.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800">{type.label}</p>
              {appointment.professionalName && (
                <p className="text-xs text-stone-500 mt-0.5">Con {appointment.professionalName}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Fecha</p>
                <p className="text-sm font-semibold text-stone-800 capitalize">{aptDate}</p>
              </div>
            </div>

            {appointment.time && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Hora · Duración</p>
                  <p className="text-sm font-semibold text-stone-800">
                    {appointment.time} · {appointment.duration || 60} min
                  </p>
                </div>
              </div>
            )}

            {appointment.isVideoCall && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Modalidad</p>
                  <p className="text-sm font-semibold text-stone-800">Videollamada</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-emerald-600 font-medium">Precio de la sesión</p>
                <p className="text-xl font-bold text-emerald-700">€{price}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <p className="text-xs text-stone-400 font-medium">Notas del profesional</p>
              </div>
              <p className="text-sm text-stone-700">{appointment.notes}</p>
            </div>
          )}

          {/* Reject reason form */}
          <AnimatePresence>
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-3">
                  <p className="text-sm font-semibold text-red-700">¿Por qué rechazas la cita?</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                    placeholder="Motivo (opcional)..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="flex-1 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition font-medium"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejecting}
                      className="flex-1 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium disabled:opacity-50"
                    >
                      {rejecting ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        {!showRejectForm && (
          <div className="px-6 pb-6 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition border border-red-100"
            >
              Rechazar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={accepting}
              className="flex-2 px-4 py-3 text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl transition shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Aceptando...</>
              ) : (
                <><Check className="w-4 h-4" /> Aceptar y pagar €{price}</>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default AppointmentAcceptanceModal
