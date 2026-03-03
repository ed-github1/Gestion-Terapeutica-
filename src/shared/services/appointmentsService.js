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

  /** Patient accepts a pending appointment */
  accept: (id) =>
    apiClient.patch(`/appointments/${id}/accept`),

  /** Patient rejects/declines an appointment */
  reject: (id, reason) =>
    apiClient.patch(`/appointments/${id}/reject`, { reason }),

  /** Patient pays for an accepted appointment — returns { checkoutUrl } or { success } */
  pay: (id, paymentData) =>
    apiClient.post(`/appointments/${id}/pay`, paymentData),

  /** Professional creates an appointment for a patient.
   * Uses POST /appointments (not /reserve which is patient-only).
   * professionalId must be supplied by the caller from the auth context.
   */
  createForPatient: (data) =>
    apiClient.post('/appointments', {
      // Backend filters GET /appointments by patientId === user._id (user account),
      // so we must store patientUserId (user account _id) here, not the profile _id.
      patientId: data.patientUserId || data.patientId,
      ...(data.patientUserId ? { patientUserId: data.patientUserId } : {}),
      professionalId: data.professionalId,
      patientName: data.patientName,
      date: data.date,
      time: data.time,
      type: data.type,
      duration: data.duration,
      notes: data.notes,
      isVideoCall: data.isVideoCall,
      reason: data.reason || data.notes || '',
      status: 'reserved',
      paymentStatus: 'pending',
    }),

  /** Get a professional's weekly availability (day-of-week → time-slot map) */
  getAvailability: (professionalId = null) => {
    const endpoint = professionalId
      ? `/availability/${professionalId}`
      : '/availability'
    return apiClient.get(endpoint)
  },

  /** Save / update the current professional's weekly availability */
  updateAvailability: (availabilityData) =>
    apiClient.put('/availability', availabilityData),
}
