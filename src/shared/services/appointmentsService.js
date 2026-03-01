/**
 * shared/services/appointmentsService.js
 * All HTTP calls related to appointments.
 */
import apiClient from '@shared/api/client'

export const appointmentsService = {
  getAvailableSlots: (date, professionalId = null) => {
    const params = new URLSearchParams({ date, limit: 100 })
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

  // General list with optional filters (used by professional side)
  getAll: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    const qs = params.toString()
    return apiClient.get(`/appointments${qs ? `?${qs}` : ''}`)
  },

  // Patient's own appointments — backend filters by the JWT's patient identity.
  // Response shape varies by backend version; use normalizeAppointmentsResponse()
  // from @shared/utils/appointments to unwrap and normalise before use.
  getPatientAppointments: () =>
    apiClient.get('/appointments'),

  getProfessionalAppointments: (professionalId) =>
    apiClient.get(`/appointments/professional/${professionalId}`),

  // Convenience alias kept for backwards compat — prefer getPatientAppointments()
  getMyAppointments: () =>
    apiClient.get('/appointments/my').catch(() => apiClient.get('/appointments')),

  updateStatus: (id, status) =>
    apiClient.patch(`/appointments/${id}/status`, { status }),

  cancel: (id, reason) =>
    apiClient.patch(`/appointments/${id}/cancel`, { reason }),

  getById: (id) =>
    apiClient.get(`/appointments/${id}`),

  getCalendarEvents: (startDate, endDate) =>
    apiClient.get(`/appointments/calendar?startDate=${startDate}&endDate=${endDate}`),
}
