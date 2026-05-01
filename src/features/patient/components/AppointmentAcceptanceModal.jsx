/**
 * AppointmentAcceptanceModal.jsx
 * Shown to the patient when a professional creates an appointment.
 * The patient can accept (→ goes to payment) or reject the appointment.
 *
 * Design: matches the ModernProfessionalDashboard aesthetic —
 * white card, border border-gray-200 shadow-sm, clean gray typography.
 */
import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import {
  Stethoscope, RefreshCw, Zap,
  CalendarDays, Clock, Video, Banknote,
  X, Check, FileText, Bell,
} from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { showToast } from '@shared/ui/Toast'
import { toLocalDateObj } from '@shared/utils/appointments'
import { useAuth } from '@features/auth/AuthContext'
import { socketNotificationService } from '@shared/services/socketNotificationService'

const TYPE_CONFIG = {
  primera_consulta: { label: 'Primera consulta', Icon: Stethoscope, dot: 'bg-blue-500'  },
  seguimiento:      { label: 'Seguimiento',       Icon: RefreshCw,   dot: 'bg-sky-500'   },
  extraordinaria:   { label: 'Extraordinaria',    Icon: Zap,         dot: 'bg-amber-500' },
}

const AppointmentAcceptanceModal = ({ appointment, onClose, onAccepted, onRejected, professionalUserId: professionalUserIdProp }) => {
  const { user } = useAuth()
  const [rejecting, setRejecting] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 250], [1, 0.4])

  function handleDragEnd(_, info) {
    if (info.offset.y > 120 || info.velocity.y > 400) {
      animate(y, 600, { duration: 0.2 }).then(onClose)
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  if (!appointment) return null

  // Resolve the appointment ID across all possible payload shapes:
  //   • normalized API object  → ._id or .id
  //   • socket event payload   → .appointmentId
  //   • notification data      → .data.appointmentId / .data._id / .data.id
  const resolveId = (apt) =>
    apt?._id ||
    apt?.id ||
    apt?.appointmentId ||
    apt?.data?.appointmentId ||
    apt?.data?._id ||
    apt?.data?.id ||
    null

  const type = TYPE_CONFIG[appointment.type] || TYPE_CONFIG.primera_consulta
  const aptDate = appointment.date
    ? toLocalDateObj(appointment.date, appointment.time).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'Fecha por confirmar'
  const price = appointment.price ?? appointment.data?.price ?? 50

  // Resolve the professional's user account ID for socket routing.
  // appointment.professionalId IS the user account _id (set from user._id when creating).
  const resolveProUserId = () => {
    const uid =
      appointment?.professionalUserId ||
      appointment?.data?.professionalUserId ||
      (typeof appointment?.professionalId === 'string' ? appointment.professionalId : null) ||
      (typeof appointment?.data?.professionalId === 'string' ? appointment.data.professionalId : null) ||
      // populated professionalId object (from API/polling)
      appointment?.professionalId?.userId ||
      appointment?.professionalId?.user?._id ||
      appointment?.professionalId?.user?.id ||
      professionalUserIdProp ||
      localStorage.getItem('_linkedProUserId') ||
      null
    console.log('[AcceptanceModal] resolveProUserId =>', uid, '| appointment.professionalId =>', appointment?.professionalId, '| prop =>', professionalUserIdProp, '| localStorage =>', localStorage.getItem('_linkedProUserId'))
    return uid
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const id = resolveId(appointment)
      if (!id) throw new Error('No se pudo resolver el ID de la cita')
      await appointmentsService.accept(id)
      // Also send client-side socket notification as fallback
      const proId = resolveProUserId()
      if (proId) {
        socketNotificationService.sendAcceptanceNotification(proId, {
          appointmentId: id,
          patientName: user?.name || user?.nombre || 'Paciente',
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
        })
      }
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
      const id = resolveId(appointment)
      if (!id) throw new Error('No se pudo resolver el ID de la cita')
      const reason = rejectReason || 'Rechazada por el paciente'
      await appointmentsService.reject(id, reason)
      // Also send client-side socket notification as fallback
      const proId = resolveProUserId()
      if (proId) {
        socketNotificationService.sendRejectionNotification(proId, {
          appointmentId: id,
          patientName: user?.name || user?.nombre || 'Paciente',
          date: appointment.date,
          time: appointment.time,
          reason,
        })
      }
      showToast('Cita rechazada', 'info')
      onRejected?.({ ...appointment, rejectReason: reason })
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
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.3 }}
        onDragEnd={handleDragEnd}
        style={{ y, opacity, touchAction: 'none' }}
        className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider leading-none mb-0.5">
                Nueva cita
              </p>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                Tu profesional ha agendado una sesión
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600 shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-3">

          {/* Session type + professional */}
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${type.dot} shrink-0`} />
            <p className="text-[13px] font-semibold text-gray-800">{type.label}</p>
            {appointment.professionalName && (
              <>
                <span className="text-gray-300">·</span>
                <p className="text-[13px] text-gray-500 truncate">{appointment.professionalName}</p>
              </>
            )}
          </div>

          {/* Detail rows — divider style like pro dash stat bar */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {/* Date */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 leading-none mb-0.5">Fecha</p>
                <p className="text-[13px] font-semibold text-gray-800 capitalize truncate">{aptDate}</p>
              </div>
            </div>

            {/* Time */}
            {appointment.time && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 leading-none mb-0.5">Hora · Duración</p>
                  <p className="text-[13px] font-semibold text-gray-800">
                    {appointment.time} · {appointment.duration || 60} min
                  </p>
                </div>
              </div>
            )}

            {/* Modality */}
            {appointment.isVideoCall && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Video className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 leading-none mb-0.5">Modalidad</p>
                  <p className="text-[13px] font-semibold text-gray-800">Videollamada</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 leading-none mb-0.5">Precio de la sesión</p>
                <p className="text-[15px] font-bold text-emerald-600">€{price}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notas</p>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{appointment.notes}</p>
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
                <div className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-red-700">¿Motivo del rechazo?</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] border border-red-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none bg-white"
                    placeholder="Motivo (opcional)..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="flex-1 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium border border-gray-200 bg-white"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejecting}
                      className="flex-1 px-3 py-2 text-[13px] bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold disabled:opacity-50"
                    >
                      {rejecting ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Actions ── */}
        {!showRejectForm && (
          <div className="px-5 pb-5 flex gap-2.5">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition border border-gray-200"
            >
              Rechazar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleAccept}
              disabled={accepting}
              className="flex-[2] px-4 py-2.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aceptando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Aceptar y pagar €{price}
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default AppointmentAcceptanceModal
