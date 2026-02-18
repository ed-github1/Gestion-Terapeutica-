/**
 * shared/services/appointmentsService.js
 * All HTTP calls related to appointments.
 */
import apiClient from '@shared/api/client'

export const appointmentsService = {
  getAvailableSlots: (date, professionalId = null) => {
    const params = new URLSearchParams({ date })
    if (professionalId) params.append('professionalId', professionalId)
    return apiClient.get(`/appointments/available-slots?${params}`)
  },

  reserve: (data) =>
    apiClient.post('/appointments/reserve', {
      date: data.date,
      time: data.time,
      type: data.type,
      reason: data.reason,
      notes: data.notes,
      duration: data.duration,
      professionalId: data.professionalId,
      status: 'reserved',
      paymentStatus: 'pending',
    }),

  create: (data) =>
    apiClient.post('/appointments', data),

  getAll: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    const qs = params.toString()
    return apiClient.get(`/appointments${qs ? `?${qs}` : ''}`)
  },

  getPatientAppointments: () =>
    apiClient.get('/appointments/patient/my-appointments'),

  getProfessionalAppointments: (professionalId) =>
    apiClient.get(`/appointments/professional/${professionalId}`),

  updateStatus: (id, status) =>
    apiClient.patch(`/appointments/${id}/status`, { status }),

  cancel: (id, reason) =>
    apiClient.patch(`/appointments/${id}/cancel`, { reason }),

  getById: (id) =>
    apiClient.get(`/appointments/${id}`),

  getCalendarEvents: (startDate, endDate) =>
    apiClient.get(`/appointments/calendar?startDate=${startDate}&endDate=${endDate}`),
}
