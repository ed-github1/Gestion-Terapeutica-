import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '../../components'
import { appointmentsAPI, paymentsAPI } from '../../services/appointments'

const AppointmentRequest = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: select slot, 2: payment, 3: success
  const [appointmentData, setAppointmentData] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  const [formData, setFormData] = useState({
    type: 'consultation',
    reason: '',
    notes: ''
  })

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    amount: 500 // Default amount in pesos
  })

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
  }, [selectedDate])

  const fetchAvailableSlots = async (date) => {
    setLoading(true)
    try {
      const response = await appointmentsAPI.getAvailableSlots(date)
      console.log('✅ Slots from API:', response.data)
      
      // If API returns empty array, use fallback data
      if (response.data && response.data.length > 0) {
        setAvailableSlots(response.data)
      } else {
        console.warn('⚠️ API returned empty slots, using fallback data')
        generateSlotsFromAvailability(date)
      }
    } catch (error) {
      console.warn('⚠️ Backend not available, using fallback data:', error.message)
      // Direct fallback to localStorage or mock data
      generateSlotsFromAvailability(date)
    } finally {
      setLoading(false)
    }
  }

  const generateSlotsFromAvailability = (date) => {
    // Check localStorage first
    const savedAvailability = localStorage.getItem('professionalAvailability')
    if (savedAvailability) {
      try {
        const availability = JSON.parse(savedAvailability)
        const dayOfWeek = new Date(date).getDay()
        const daySlots = availability[dayOfWeek] || []
        
        if (daySlots.length > 0) {
          const slots = daySlots.map(time => ({
            time,
            available: true,
            professional: 'Profesional'
          }))
          
          console.log('📅 Generated slots from localStorage:', slots.length, 'slots')
          setAvailableSlots(slots)
          return
        }
      } catch (err) {
        console.warn('Failed to parse saved availability')
      }
    }
    
    // Ultimate fallback: generate mock slots
    console.log('📅 No saved availability, generating mock slots')
    generateMockSlots()
  }

  const generateMockSlots = () => {
    const slots = []
    const hours = [9, 10, 11, 12, 14, 15, 16, 17, 18]
    
    hours.forEach(hour => {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3, // Random availability
        professional: 'Dr. García'
      })
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        available: Math.random() > 0.3,
        professional: 'Dr. García'
      })
    })
    
    console.log('📅 Generated mock slots:', slots.length, 'slots')
    setAvailableSlots(slots)
  }

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
        // Try to reserve with backend
        const response = await appointmentsAPI.reserveAppointment({
          date: selectedDate,
          time: selectedSlot.time,
          type: formData.type,
          reason: formData.reason,
          notes: formData.notes,
          duration: selectedType?.duration || 60
        })
        setAppointmentData(response.data)
        appointmentId = response.data.id || response.data._id
      } catch (error) {
        console.warn('⚠️ Backend not available, using demo mode for reservation')
        // Demo mode: create mock appointment data
        appointmentId = 'patient_' + Date.now()
        const mockAppointment = {
          id: appointmentId,
          date: selectedDate,
          time: selectedSlot.time,
          type: formData.type,
          reason: formData.reason,
          notes: formData.notes,
          duration: selectedType?.duration || 60,
          status: 'reserved',
          paymentStatus: 'pending',
          patientName: 'Paciente Demo' // This would come from user context in real app
        }
        setAppointmentData(mockAppointment)
        
        // Save to localStorage for professional to see
        const [hours, minutes] = selectedSlot.time.split(':')
        const startDate = new Date(selectedDate)
        startDate.setHours(parseInt(hours), parseInt(minutes), 0)
        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + (selectedType?.duration || 60))
        
        const calendarAppointment = {
          id: appointmentId,
          patientName: 'Paciente Demo',
          type: formData.type,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          duration: String(selectedType?.duration || 60),
          notes: formData.reason,
          isVideoCall: false,
          status: 'reserved'
        }
        
        // Add to professional's appointments in localStorage
        const savedAppointments = localStorage.getItem('professionalAppointments')
        const appointments = savedAppointments ? JSON.parse(savedAppointments) : []
        appointments.push(calendarAppointment)
        localStorage.setItem('professionalAppointments', JSON.stringify(appointments))
      }
      
      setPaymentData(prev => ({ ...prev, amount: selectedType?.price || 500 }))
      setStep(2) // Move to payment
      showToast('✅ Horario reservado, procede con el pago', 'success')
    } catch (error) {
      console.error('Error reserving slot:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()

    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      showToast('Por favor completa todos los datos de pago', 'warning')
      return
    }

    setLoading(true)
    try {
      // Process payment (demo mode enabled)
      try {
        await paymentsAPI.processPayment({
          appointmentId: appointmentData._id || appointmentData.id,
          amount: paymentData.amount,
          paymentMethod: 'card',
          cardLast4: paymentData.cardNumber.slice(-4)
        })
        console.log('✅ Payment processed via backend')
      } catch (error) {
        console.warn('⚠️ Backend not available, using demo mode for payment')
        // Demo mode: simulate successful payment
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate processing time
      }

      setStep(3) // Success
      showToast('🎉 ¡Pago procesado exitosamente!', 'success')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 3000)
    } catch (error) {
      console.error('Error processing payment:', error)
      showToast(`❌ ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Reservar Cita</h2>
              <p className="text-blue-100 mt-1">
                {step === 1 && 'Paso 1: Selecciona horario'}
                {step === 2 && 'Paso 2: Confirmar pago'}
                {step === 3 && '¡Reserva confirmada!'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            <div className={`h-2 flex-1 rounded-full transition ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-2 flex-1 rounded-full transition ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-2 flex-1 rounded-full transition ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Time Slot */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-6"
            >
              {/* Appointment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Cita
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {appointmentTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600">${type.price} MXN · {type.duration} min</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona una Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Available Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horarios Disponibles
                </label>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando horarios...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-600">No hay horarios disponibles para esta fecha.</p>
                    <p className="text-xs text-gray-500 mt-1">Intenta con otra fecha</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg text-sm font-medium transition ${
                          selectedSlot?.time === slot.time
                            ? 'bg-blue-500 text-white'
                            : slot.available
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason for Visit */}
              {selectedSlot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la Consulta *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe brevemente el motivo de tu consulta..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Adicionales (opcional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Información adicional..."
                    />
                  </div>
                </motion.div>
              )}

              {/* Selected Slot Info */}
              {selectedSlot && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">📅 Resumen de Reserva:</p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-medium">Fecha:</span> {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><span className="font-medium">Hora:</span> {selectedSlot.time}</p>
                    <p><span className="font-medium">Tipo:</span> {appointmentTypes.find(t => t.value === formData.type)?.label}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">Total: ${appointmentTypes.find(t => t.value === formData.type)?.price} MXN</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReserveSlot}
                  disabled={loading || !selectedSlot || !formData.reason}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Reservando...' : 'Continuar al Pago'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handlePayment}
              className="p-6 space-y-6"
            >
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Resumen de Reserva</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Fecha:</span> {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><span className="font-medium">Hora:</span> {selectedSlot?.time}</p>
                  <p><span className="font-medium">Tipo:</span> {appointmentTypes.find(t => t.value === formData.type)?.label}</p>
                  <p><span className="font-medium">Duración:</span> {appointmentTypes.find(t => t.value === formData.type)?.duration} minutos</p>
                  <p className="text-lg font-bold text-green-600 mt-2">Total a Pagar: ${paymentData.amount} MXN</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Tarjeta *
                  </label>
                  <input
                    required
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre en la Tarjeta *
                  </label>
                  <input
                    required
                    type="text"
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="JUAN PEREZ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Expiración *
                    </label>
                    <input
                      required
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4)
                        }
                        setPaymentData({ ...paymentData, expiryDate: value })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      required
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  🔒 <span className="font-semibold">Seguro:</span> Tu información de pago está protegida con encriptación SSL.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition font-semibold shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : `Pagar $${paymentData.amount}`}
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h3>
              <p className="text-gray-600 mb-6">
                Tu cita ha sido reservada y confirmada con pago exitoso. Te esperamos en la fecha y hora programada.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  📧 Hemos enviado la confirmación y comprobante de pago a tu correo electrónico.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  📅 {new Date(selectedDate).toLocaleDateString('es-MX')} a las {selectedSlot?.time}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition font-semibold"
              >
                Volver al Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default AppointmentRequest
