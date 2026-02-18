import { apiClient } from './api'

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? 'https://totalmentegestionterapeutica.onrender.com/api' : 'http://localhost:3000/api')

// Get auth token from storage
const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}

export const appointmentsAPI = {
  // Get available time slots for a specific date
  getAvailableSlots: async (date, professionalId = null) => {
    try {
      const params = new URLSearchParams({ date })
      if (professionalId) params.append('professionalId', professionalId)
      
      const response = await apiClient.get(`/appointments/available-slots?${params.toString()}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener horarios disponibles')
    }
  },

  // Reserve an appointment slot (patient)
  reserveAppointment: async (appointmentData) => {
    try {
      const response = await apiClient.post('/appointments/reserve', {
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        reason: appointmentData.reason,
        notes: appointmentData.notes,
        duration: appointmentData.duration,
        professionalId: appointmentData.professionalId,
        status: 'reserved',
        paymentStatus: 'pending'
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al reservar la cita')
    }
  },

  // Create appointment (professional)
  createAppointment: async (appointmentData) => {
    try {
      const response = await apiClient.post('/appointments', appointmentData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al crear la cita')
    }
  },

  // Get all appointments (with optional filters)
  getAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.status) params.append('status', filters.status)
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.professionalId) params.append('professionalId', filters.professionalId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const queryString = params.toString()
      const response = await apiClient.get(`/appointments${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener las citas')
    }
  },

  // Get patient appointments (for patient dashboard)
  getPatientAppointments: async () => {
    try {
      const response = await apiClient.get('/appointments/patient/my-appointments')
      // Ensure we always return an array
      if (Array.isArray(response)) {
        return response
      } else if (response?.appointments && Array.isArray(response.appointments)) {
        return response.appointments
      } else {
        console.warn('Unexpected response format, returning empty array')
        return []
      }
    } catch (error) {
      // Fallback to regular getAppointments
      console.warn('Using fallback getAppointments')
      try {
        const fallbackResponse = await appointmentsAPI.getAppointments({})
        // Ensure we always return an array from fallback too
        if (Array.isArray(fallbackResponse)) {
          return fallbackResponse
        } else if (fallbackResponse?.appointments && Array.isArray(fallbackResponse.appointments)) {
          return fallbackResponse.appointments
        } else {
          return []
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        return []
      }
    }
  },

  // Get single appointment by ID
  getAppointmentById: async (id) => {
    try {
      const response = await apiClient.get(`/appointments/${id}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener la cita')
    }
  },

  // Update appointment
  updateAppointment: async (id, appointmentData) => {
    try {
      const response = await apiClient.put(`/appointments/${id}`, appointmentData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar la cita')
    }
  },

  // Cancel appointment
  cancelAppointment: async (id, reason = '') => {
    try {
      const response = await apiClient.put(`/appointments/${id}/cancel`, { reason })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al cancelar la cita')
    }
  },

  // Confirm appointment
  confirmAppointment: async (id) => {
    try {
      const response = await apiClient.put(`/appointments/${id}/confirm`, {})
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al confirmar la cita')
    }
  },

  // Complete appointment
  completeAppointment: async (id, notes = '') => {
    try {
      const response = await apiClient.put(`/appointments/${id}/complete`, { notes })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al completar la cita')
    }
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    try {
      const response = await apiClient.delete(`/appointments/${id}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al eliminar la cita')
    }
  },

  // Send video call link to patient
  sendVideoLink: async (appointmentId, data) => {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/send-video-link`, {
        patientName: data.patientName,
        videoLink: data.videoLink,
        appointmentTime: data.appointmentTime
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al enviar el enlace de videollamada')
    }
  },

  // Get appointment statistics (for dashboard)
  getStatistics: async (period = 'month') => {
    try {
      const response = await apiClient.get(`/appointments/statistics?period=${period}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener estadísticas')
    }
  },

  // Get upcoming appointments
  getUpcoming: async (limit = 5) => {
    try {
      const response = await apiClient.get(`/appointments/upcoming?limit=${limit}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener próximas citas')
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (id, newDate, newTime) => {
    try {
      const response = await apiClient.put(`/appointments/${id}/reschedule`, {
        date: newDate,
        time: newTime
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al reprogramar la cita')
    }
  },

  // Get professional availability
  getAvailability: async (professionalId = null) => {
    try {
      const endpoint = professionalId 
        ? `/professionals/${professionalId}/availability`
        : '/availability'
      const response = await apiClient.get(endpoint)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener disponibilidad')
    }
  },

  // Update professional availability
  updateAvailability: async (availabilityData) => {
    try {
      const response = await apiClient.put('/availability', availabilityData)
      return response
    } catch (error) {
      console.error('[updateAvailability] Error:', error)
      throw new Error(error.message || 'Error al actualizar disponibilidad')
    }
  }
}

// Payment API for appointments
export const paymentsAPI = {
  // Process payment for an appointment
  processPayment: async (paymentData) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: paymentData.appointmentId,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod || 'card',
          cardLast4: paymentData.cardLast4,
          currency: paymentData.currency || 'MXN'
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar el pago')
      }
      return data
    } catch (error) {
      throw new Error(error.message || 'Error al procesar el pago')
    }
  },

  // Get payment history
  getPaymentHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.appointmentId) params.append('appointmentId', filters.appointmentId)
      if (filters.status) params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const queryString = params.toString()
      const response = await apiClient.get(`/payments${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener el historial de pagos')
    }
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    try {
      const response = await apiClient.get(`/payments/${id}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener el pago')
    }
  },

  // Request refund
  requestRefund: async (paymentId, reason = '') => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refund`, { reason })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al solicitar el reembolso')
    }
  }
}

export default appointmentsAPI
