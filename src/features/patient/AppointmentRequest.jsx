import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CreditCard, X, CheckCircle2 } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { useAuth } from '@features/auth/AuthContext'
import { appointmentsService } from '@shared/services/appointmentsService'
import { patientsService, resolveLinkedProfessional } from '@shared/services/patientsService'
import { professionalsService } from '@shared/services/professionalsService'
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
    socketNotificationService.connect(userId)
  }, [user])

  const toLocalDateStr = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr())
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  const [formData, setFormData] = useState({
    type: 'Primera Sesión',
    mode: 'consultorio',
    reason: '',
  })

  const [paymentData, setPaymentData] = useState({ amount: 0 })
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [tarifasLoaded, setTarifasLoaded] = useState(false)

  // Default fallback — will be replaced once tarifas load
  const [appointmentTypes, setAppointmentTypes] = useState([
    { value: 'Primera Sesión',  label: 'Primera Sesión',  price: null, duration: 60, backendKey: 'primeraSesion' },
    { value: 'Seguimiento',     label: 'Seguimiento',     price: null, duration: 45, backendKey: 'seguimiento' },
    { value: 'Extraordinaria',  label: 'Extraordinaria',  price: null, duration: 60, backendKey: 'extraordinaria' },
  ])

  // Fetch the linked professional's tarifas
  useEffect(() => {
    let cancelled = false
    const applyTarifas = (t, cur) => {
      if (cancelled) return false
      // Need at least one non-zero tarifa to consider it valid
      if (!t || (!t.primeraSesion && !t.seguimiento && !t.extraordinaria)) return false
      setCurrencySymbol(cur === 'MXN' ? '$' : cur === 'EUR' ? '€' : cur.length <= 3 ? '$' : cur)
      setAppointmentTypes([
        { value: 'Primera Sesión',  label: 'Primera Sesión',  price: t.primeraSesion ?? null, duration: 60, backendKey: 'primeraSesion' },
        { value: 'Seguimiento',     label: 'Seguimiento',     price: t.seguimiento ?? null, duration: 45, backendKey: 'seguimiento' },
        { value: 'Extraordinaria',  label: 'Extraordinaria',  price: t.extraordinaria ?? null, duration: 60, backendKey: 'extraordinaria' },
      ])
      setTarifasLoaded(true)
      return true
    }

    const fetchTarifas = async () => {
      // Resolve which professional ID to query
      const candidates = [...new Set([professionalUserId, professionalId].filter(Boolean))]
      if (candidates.length === 0) {
        try {
          const { professionalId: pid, professionalUserId: puid } = await resolveLinkedProfessional(user)
          if (puid) candidates.push(puid)
          if (pid && pid !== puid) candidates.push(pid)
        } catch { /* no linked pro */ }
      }

      // Strategy 1: dedicated tarifas endpoint
      for (const id of candidates) {
        try {
          const res = await professionalsService.getTarifas(id)
          const data = res.data?.data || res.data || {}
          const t = data.tarifas || data
          const cur = data.currency || data.currencySymbol || '$'
          if (applyTarifas(t, cur)) return
        } catch { /* try next */ }
      }

      // Strategy 2: full professional profile (tarifas field on the model)
      for (const id of candidates) {
        try {
          const res = await patientsService.getProfessionalInfo(id)
          if (res.status !== 200) continue
          const pro = res.data?.data || res.data || {}
          const t = pro.tarifas
          const cur = pro.currency || pro.defaultCurrency || '$'
          if (applyTarifas(t, cur)) return
        } catch { /* try next */ }
      }

      // Strategy 3: patient's linked professional endpoint
      try {
        const res = await patientsService.getMyProfessional()
        const pro = res.data?.data || res.data || {}
        const t = pro.tarifas
        const cur = pro.currency || pro.defaultCurrency || '$'
        if (applyTarifas(t, cur)) return
      } catch { /* ignore */ }

      // All strategies failed
      if (!cancelled) setTarifasLoaded(true)
    }
    fetchTarifas()
    return () => { cancelled = true }
  }, [professionalId, professionalUserId, user])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate, professionalId, professionalUserId])

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
      // Build candidate IDs (userId first — that's how backend stores availability)
      const candidates = [...new Set([professionalUserId, professionalId].filter(Boolean))]

      // If no IDs are known yet, fetch the linked professional directly
      if (candidates.length === 0) {
        try {
          const res = await patientsService.getMyProfessional()
          const pro = res.data?.data || res.data
          const rawUid = pro?.userId || pro?.user?._id || pro?.user?.id || null
          const uid = rawUid && typeof rawUid === 'object' ? (rawUid._id || rawUid.id) : rawUid
          const pid = pro?._id || pro?.id || null
          if (uid) candidates.push(uid)
          if (pid && pid !== uid) candidates.push(pid)
        } catch { /* no professional linked */ }
      }

      // ── Strategy A: full weekly availability map ──
      let allSlots = []
      let resolvedId = null
      for (const id of candidates) {
        try {
          const res = await appointmentsService.getAvailability(id)
          const raw = res.data?.data || res.data
          const derived = slotsFromAvailabilityMap(raw, date)
          if (derived.length > 0) {
            allSlots = derived
            resolvedId = id
            break
          }
        } catch { /* try next */ }
      }

      // ── Strategy B: available-slots endpoint (which slots are still free) ──
      let openTimes = null // null = unknown (show all as available)
      const slotQueryId = resolvedId || candidates[0] || null
      if (slotQueryId) {
        try {
          const res = await appointmentsService.getAvailableSlots(date, slotQueryId)
          const raw = res.data
          const rawSlots = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
          if (rawSlots.length > 0) {
            openTimes = new Set(rawSlots.filter(s => s.available !== false).map(s => s.time).filter(Boolean))
          }
        } catch { /* ignore — show all as available */ }
      }

      // Grey out slots that are already in the past (for today)
      const isToday = date === toLocalDateStr()
      const nowMins = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1

      const markSlots = (slots) => slots.map(slot => {
        const [h, m] = slot.time.split(':').map(Number)
        const isPast = isToday && (h * 60 + m) <= nowMins
        return {
          ...slot,
          available: !isPast && (openTimes === null || openTimes.has(slot.time)),
        }
      })

      if (allSlots.length > 0) {
        setAvailableSlots(markSlots(allSlots))
        return
      }

      // Fallback: no availability map — use open slots directly
      if (slotQueryId) {
        try {
          const res = await appointmentsService.getAvailableSlots(date, slotQueryId)
          const raw = res.data
          const rawSlots = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
          if (rawSlots.length > 0) {
            setAvailableSlots(markSlots(rawSlots.map(s => ({ ...s, available: s.available !== false }))))
            return
          }
        } catch { /* silent */ }
      }

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
      let apptData
      try {
        // Reserve with backend — sessionType must match the backend enum
        // (['Primera Sesión', 'Seguimiento', 'Extraordinaria']), which is what
        // formData.type already holds. backendKey is only used for tarifa lookup.
        const response = await appointmentsService.reserve({
          date: selectedDate,
          time: selectedSlot.time,
          type: formData.type,
          sessionType: formData.type,
          mode: formData.mode,
          reason: formData.reason,
          duration: selectedType?.duration || 60,
          professionalId,
          patientId: user?._id || user?.id,
          patientName: user?.name || user?.nombre || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
        })
        apptData = response.data?.data || response.data
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
      // Use the local apptData (state hasn't updated yet) — prefer backend-resolved amount
      const resolvedAmount = apptData?.amount || selectedType?.price || 0
      setPaymentData(prev => ({ ...prev, amount: resolvedAmount }))
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
        splitPayment: false,
        remainingAmount: 0,
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
  const chargeAmount = paymentData.amount

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4 z-60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

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
        <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
                      <div
                        key={type.value}
                        onClick={() => setFormData(p => ({ ...p, type: type.value }))}
                        className={`px-3 py-2.5 rounded-xl text-left border transition text-[13px] cursor-pointer ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="font-semibold leading-tight">{type.label}</p>
                        <p className="text-[11px] opacity-60 mt-0.5">{type.price != null ? `${currencySymbol}${type.price}` : 'Precio pendiente'} · {type.duration} min</p>
                      </div>
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
                    {/* Summary pill */}
                    <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">
                          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}{selectedSlot.time}
                        </p>
                        <p className="text-[11px] text-gray-500">{selectedType?.label} · {selectedType?.duration} min</p>
                      </div>
                      <p className="text-[15px] font-bold text-blue-600">{selectedType?.price != null ? `${currencySymbol}${selectedType.price}` : 'Pendiente'}</p>
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
                    <span className="text-[15px] font-bold text-blue-600">{currencySymbol}{paymentData.amount}</span>
                  </div>
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{selectedSlot?.time}{' · '}{selectedType?.duration} min
                  </div>
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
                  Tu pago fue procesado y la cita queda confirmada.
                </p>
                <div className="w-full bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 mb-5 text-left overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-gray-800">{selectedType?.label}</p>
                    <span className="text-[13px] font-bold text-emerald-600">${chargeAmount} pagado</span>
                  </div>
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
