/**
 * AppointmentPaymentModal.jsx
 * Payment modal shown after the patient accepts an appointment.
 * Handles card-based payment for the session fee.
 * After successful payment, emits an `appointment-paid` socket event so the
 * professional is notified in real-time and the FullCalendar auto-refreshes.
 *
 * Design: matches the ModernProfessionalDashboard aesthetic.
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { CreditCard, X } from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { showToast } from '@shared/ui/Toast'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { toLocalDateObj } from '@shared/utils/appointments'
import PaymentForm from './PaymentForm'

const AppointmentPaymentModal = ({ appointment, onClose, onPaymentSuccess, professionalId, professionalUserId }) => {
  const [loading, setLoading] = useState(false)

  if (!appointment) return null

  const price = appointment.price ?? appointment.data?.price ?? 50
  const aptId =
    appointment._id || appointment.id ||
    appointment.appointmentId ||
    appointment.data?.appointmentId || null

  const notifyProfessional = (apt) => {
    const proId =
      professionalUserId ||
      apt.professionalUserId ||
      apt.data?.professionalUserId ||
      professionalId ||
      apt.professionalId ||
      apt.professional_id ||
      apt.professional?._id ||
      apt.data?.professionalId ||
      null
    if (!proId) return
    socketNotificationService.sendPaymentNotification(proId, {
      appointmentId: aptId,
      patientName: apt.patientName || apt.nombrePaciente || 'Paciente',
      date: apt.date,
      time: apt.time,
      duration: apt.duration,
      type: apt.type,
      amount: price,
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let checkoutUrl = null
      const res = await appointmentsService.pay(aptId, {
        amount: price,
        currency: 'EUR',
        paymentMethod: 'card',
      })
      const data = res.data?.data || res.data
      checkoutUrl = data?.checkoutUrl || null

      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }

      notifyProfessional(appointment)
      showToast('Pago procesado exitosamente. ¡Cita confirmada!', 'success')
      onPaymentSuccess?.(appointment)
      onClose()
    } catch (err) {
      console.error('Payment error:', err)
      showToast('Error al procesar el pago. Intenta nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const aptDate = appointment.date
    ? toLocalDateObj(appointment.date, appointment.time).toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : ''

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
        className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider leading-none mb-0.5">
                Pago de sesión
              </p>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                Confirma tu reserva
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600 shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Session summary ── */}
        <div className="mx-5 mt-4 bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-[13px] font-semibold text-gray-800 truncate">
              {appointment.professionalName || 'Sesión terapéutica'}
            </p>
            <span className="text-[15px] font-bold text-emerald-600 shrink-0 ml-3">€{price}</span>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[11px] text-gray-400 leading-none">
              {aptDate}{appointment.time ? ` · ${appointment.time}` : ''} · {appointment.duration || 60} min
            </p>
          </div>
        </div>

        {/* ── Payment form ── */}
        <div className="px-5 pt-4 pb-5">
          <PaymentForm
            amount={price}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={onClose}
            currency="€"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AppointmentPaymentModal
