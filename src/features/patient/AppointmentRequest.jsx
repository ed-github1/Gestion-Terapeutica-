import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CreditCard, X, CheckCircle2 } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { useAuth } from '@features/auth/AuthContext'
import { appointmentsService } from '@shared/services/appointmentsService'
import { resolveLinkedProfessional } from '@shared/services/patientsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import PaymentForm from './components/PaymentForm'

const AppointmentRequest = ({ onClose, onSuccess, onPatientCreated, professionalId = null, professionalUserId: professionalUserIdProp = null }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: select slot, 2: payment, 3: success
  const [appointmentData, setAppointmentData] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [professionalUserId, setProfessionalUserId] = useState(
    professionalUserIdProp || localStorage.getItem('_linkedProUserId') || null
  )

  // Resolve professionalUserId via the centralised helper if not already known
  useEffect(() => {
    if (professionalUserId) return
    let cancelled = false
    resolveLinkedProfessional(user).then(({ professionalUserId: uid }) => {
      if (!cancelled && uid) setProfessionalUserId(uid)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [user, professionalUserId])

  // Ensure the socket is connected so notifications can be sent to the professional
  useEffect(() => {
    const userId = user?._id || user?.id
    if (!userId) return
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    socketNotificationService.connect(userId, token)
  }, [user])

  const toLocalDateStr = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr())
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  const [formData, setFormData] = useState({
    type: 'consultation',
    mode: 'consultorio',
    reason: '',
    notes: ''
  })

  const [paymentData, setPaymentData] = useState({ amount: 500 })
  const [paymentOption, setPaymentOption] = useState('full') // 'full' or 'half'

  const appointmentTypes = [
    { value: 'consultation', label: 'Consulta General', price: 500, duration: 60 },
    { value: 'followup', label: 'Seguimiento', price: 400, duration: 45 },
    { value: 'therapy', label: 'Sesión de Terapia', price: 600, duration: 90 },
    { value: 'emergency', label: 'Urgencia', price: 800, duration: 60 }
  ]

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate, professionalId])

  /**
   * Derive time-slot objects from a weekly availability map.
   * @param {object} availability  e.g. { 1: ["09:00","09:30"], 2: [...] }
   * @param {string} date          ISO date string e.g. "2026-03-02"
   */
  const slotsFromAvailabilityMap = (availability, date) => {
    try {
      if (!availability || typeof availability !== 'object') return []
      const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
      const times = availability[dayOfWeek] || availability[String(dayOfWeek)] || []
      return times.map(time => ({ time, available: true }))
    } catch {
      return []
    }
  }

  const fetchAvailableSlots = async (date) => {
    setLoading(true)
    try {
      console.log('[AppointmentRequest] fetching slots — date:', date, '| professionalId:', professionalId)

      // ── Strategy 1: dedicated available-slots endpoint ──
      try {
        const response = await appointmentsService.getAvailableSlots(date, professionalId)
        console.log('✅ Slots from API raw:', response.data)

        const slots = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : []

        const normalisedSlots = slots.map(s => ({
          ...s,
          available: s.available !== false,
        }))

        if (normalisedSlots.length > 0) {
          console.log('✅ Slots resolved from available-slots endpoint:', normalisedSlots)
          setAvailableSlots(normalisedSlots)
          return
        }
      } catch (err) {
        console.warn('⚠️ available-slots endpoint failed:', err.message)
      }

      // ── Strategy 2: fetch the professional's weekly availability map ──
      try {
        const res = await appointmentsService.getAvailability(professionalId || null)
        const raw = res.data?.data || res.data
        console.log('✅ Professional availability map:', raw)
        const derived = slotsFromAvailabilityMap(raw, date)
        if (derived.length > 0) {
          console.log('✅ Slots derived from availability map:', derived)
          setAvailableSlots(derived)
          return
        }
      } catch (err) {
        console.warn('⚠️ getAvailability endpoint failed:', err.message)
      }

      // Nothing found
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  // Removed generateSlotsFromAvailability. Only backend data is used for available slots.

  // Removed generateMockSlots. Only real data is used.

  const handleReserveSlot = async () => {
    if (!selectedSlot) {
      showToast('Por favor selecciona un horario', 'warning')
      return
    }

    if (!formData.reason) {
      showToast('Por favor indica el motivo de tu consulta', 'warning')
      return
    }

    setLoading(true)
    try {
      const selectedType = appointmentTypes.find(t => t.value === formData.type)
      
      let appointmentId
      try {
        // Reserve with backend
        const response = await appointmentsService.reserve({
          date: selectedDate,
          time: selectedSlot.time,
          type: formData.type,
          mode: formData.mode,
          reason: formData.reason,
          notes: formData.notes,
          duration: selectedType?.duration || 60,
          professionalId,
        })
        const apptData = response.data?.data || response.data
        setAppointmentData(apptData)
        appointmentId = apptData?._id || apptData?.id
      } catch (error) {
        // Surface real business errors (4xx) directly to the user.
        const httpStatus = error?.status ?? error?.response?.status
        const msg = error.data?.message || error.response?.data?.message || error.message
        throw new Error(httpStatus >= 400 && httpStatus < 500 ? msg : 'No se pudo conectar con el servidor. Intenta nuevamente.')
      }

      // Notify parent immediately so it can dismiss this ID from polling —
      // prevents the AppointmentAcceptanceModal from opening for patient-created appointments.
      if (appointmentId) onPatientCreated?.(String(appointmentId))
      setPaymentData(prev => ({ ...prev, amount: selectedType?.price || 500 }))
      setStep(2) // Move to payment
      showToast('Horario reservado, procede con el pago', 'success')
    } catch (error) {
      console.error('Error reserving slot:', error)
      showToast(`${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (cardFields) => {
    setPaymentData(prev => ({ ...prev, ...cardFields }))

    setLoading(true)
    try {
      const aptId = appointmentData?._id || appointmentData?.id || null
      await appointmentsService.pay(aptId, {
        amount: chargeAmount,
        totalAmount: paymentData.amount,
        currency: 'MXN',
        paymentMethod: 'card',
        cardLast4: (cardFields.cardNumber || paymentData.cardNumber || '').replace(/\s/g, '').slice(-4),
        splitPayment: paymentOption === 'half',
        remainingAmount: paymentOption === 'half' ? Math.floor(paymentData.amount / 2) : 0,
      })

      setStep(3) // Success
      showToast('Pago procesado exitosamente', 'success')
      setTimeout(() => {
        onSuccess?.(appointmentData)
        onClose()
      }, 3000)
    } catch (error) {
      console.error('Error processing payment:', error)
      showToast(`${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white placeholder:text-gray-300'
  const labelCls =
    'block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

  const selectedType = appointmentTypes.find(t => t.value === formData.type)
  const chargeAmount = paymentOption === 'half'
    ? Math.ceil(paymentData.amount / 2)
    : paymentData.amount

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
        className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              {step === 1 && <Calendar className="w-4 h-4 text-blue-600" />}
              {step === 2 && <CreditCard className="w-4 h-4 text-blue-600" />}
              {step === 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider leading-none mb-0.5">
                {step === 1 && 'Paso 1 de 2'}
                {step === 2 && 'Paso 2 de 2'}
                {step === 3 && 'Confirmada'}
              </p>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                {step === 1 && 'Reservar cita'}
                {step === 2 && 'Confirmar pago'}
                {step === 3 && '¡Reserva exitosa!'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {/* Step dots */}
            <div className="flex gap-1">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step > s ? 'w-3 bg-blue-500' : step === s ? 'w-4 bg-blue-500' : 'w-1.5 bg-gray-200'}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ─── Step 1: Select slot ─── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="px-5 pt-4 pb-5 space-y-4"
              >
                {/* Type pills */}
                <div>
                  <label className={labelCls}>Tipo de cita</label>
                  <div className="grid grid-cols-2 gap-2">
                    {appointmentTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, type: type.value }))}
                        className={`px-3 py-2.5 rounded-xl text-left border transition text-[13px] ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="font-semibold leading-tight">{type.label}</p>
                        <p className="text-[11px] opacity-60 mt-0.5">${type.price} · {type.duration} min</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode selector */}
                <div>
                  <label className={labelCls}>Modalidad</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, mode: 'consultorio' }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition ${
                        formData.mode === 'consultorio'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Consultorio
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, mode: 'videollamada' }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition ${
                        formData.mode === 'videollamada'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Videollamada
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className={labelCls}>Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputCls}
                  />
                </div>

                {/* Time slots */}
                <div>
                  <label className={labelCls}>Horario disponible</label>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-gray-400">
                      <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Cargando horarios...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-5 text-center">
                      <Clock className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-[13px] text-gray-500 font-medium">Sin disponibilidad</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">El profesional no tiene horarios para este día.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                      {availableSlots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-xl text-[12px] font-semibold transition border ${
                            selectedSlot?.time === slot.time
                              ? 'bg-blue-500 text-white border-blue-500'
                              : slot.available
                              ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                              : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reason — appears after slot selection */}
                <AnimatePresence>
                {selectedSlot && (
                  <motion.div
                    key="reason"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className={labelCls}>Motivo de la consulta *</label>
                      <textarea
                        value={formData.reason}
                        onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Describe brevemente el motivo..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Notas adicionales <span className="normal-case font-normal">(opcional)</span></label>
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                        rows={1}
                        className={`${inputCls} resize-none`}
                        placeholder="Información adicional..."
                      />
                    </div>

                    {/* Summary pill */}
                    <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">
                          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}{selectedSlot.time}
                        </p>
                        <p className="text-[11px] text-gray-500">{selectedType?.label} · {selectedType?.duration} min</p>
                      </div>
                      <p className="text-[15px] font-bold text-blue-600">${selectedType?.price}</p>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleReserveSlot}
                    disabled={loading || !selectedSlot || !formData.reason}
                    className="flex-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Reservando...
                      </>
                    ) : 'Continuar al pago'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Payment ─── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="px-5 pt-4 pb-5 space-y-3"
              >
                {/* Session summary */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-gray-800">{selectedType?.label}</p>
                    <span className="text-[15px] font-bold text-blue-600">${paymentData.amount}</span>
                  </div>
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{selectedSlot?.time}{' · '}{selectedType?.duration} min
                  </div>
                </div>

                {/* Payment option toggle */}
                <div>
                  <p className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">¿Cómo deseas pagar?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`px-3 py-2.5 rounded-xl text-left border transition text-[13px] ${
                        paymentOption === 'full'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="font-semibold leading-tight">Pago completo</p>
                      <p className="text-[11px] opacity-60 mt-0.5">${paymentData.amount} ahora</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('half')}
                      className={`px-3 py-2.5 rounded-xl text-left border transition text-[13px] ${
                        paymentOption === 'half'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="font-semibold leading-tight">Mitad ahora</p>
                      <p className="text-[11px] opacity-60 mt-0.5">${Math.ceil(paymentData.amount / 2)} + ${Math.floor(paymentData.amount / 2)} en sesión</p>
                    </button>
                  </div>
                  {paymentOption === 'half' && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-2">
                      Pagarás <strong>${Math.ceil(paymentData.amount / 2)}</strong> ahora para reservar. El saldo restante de <strong>${Math.floor(paymentData.amount / 2)}</strong> se abonará al iniciar la sesión.
                    </p>
                  )}
                </div>

                <PaymentForm
                  amount={chargeAmount}
                  loading={loading}
                  onSubmit={handlePayment}
                  onCancel={() => setStep(1)}
                  cancelLabel="Atrás"
                  currency="$"
                />
              </motion.div>
            )}

            {/* ─── Step 3: Success ─── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-5 pt-6 pb-6 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-1">¡Reserva confirmada!</h3>
                <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
                  {paymentOption === 'half'
                    ? `Pago parcial procesado. El saldo restante se abonará al iniciar la sesión.`
                    : 'Tu pago fue procesado y la cita queda confirmada.'}
                </p>
                <div className="w-full bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 mb-5 text-left overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-gray-800">{selectedType?.label}</p>
                    <span className="text-[13px] font-bold text-emerald-600">${chargeAmount} pagado</span>
                  </div>
                  {paymentOption === 'half' && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50">
                      <p className="text-[12px] text-amber-700 font-medium">Saldo pendiente en sesión</p>
                      <span className="text-[13px] font-bold text-amber-600">${Math.floor(paymentData.amount / 2)}</span>
                    </div>
                  )}
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                    {' · '}{selectedSlot?.time}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  Volver al dashboard
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AppointmentRequest
