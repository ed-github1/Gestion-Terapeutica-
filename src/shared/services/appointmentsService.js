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
      sessionType: data.sessionType || data.type,
      mode: data.mode ?? 'consultorio',
      isVideoCall: data.mode === 'videollamada' || data.isVideoCall || false,
      reason: data.reason,
      notes: data.notes,
      duration: data.duration,
      professionalId: data.professionalId,
      ...(data.patientId ? { patientId: data.patientId } : {}),
      ...(data.patientName ? { patientName: data.patientName } : {}),
      status: 'reserved',
      paymentStatus: 'pending',
      createdBy: 'patient',
    }),

  create: (data) =>
    apiClient.post('/appointments', data),

  // General list with optional filters (used by professional side)
  // Only status, type, mode, and date are accepted by the backend.
  getAll: (filters = {}) => {
    const params = new URLSearchParams()
    const allowed = ['status', 'type', 'mode', 'date']
    allowed.forEach(k => { if (filters[k]) params.append(k, filters[k]) })
    const qs = params.toString()
    return apiClient.get(`/appointments${qs ? `?${qs}` : ''}`)
  },

  /**
   * Professional's own appointment list.
   * Calls /appointments/professional/me (JWT-scoped).
   * Falls back to /appointments only if the primary endpoint throws (404 / not yet
   * available), so a single code path works regardless of backend version.
   * NOTE: do NOT fall back based on response content — an empty array from
   * /professional/me is a valid "no appointments yet" answer and should not
   * trigger a fallback to /appointments which is patient-scoped on newer backends.
   */
  getAllAsProf: async (filters = {}) => {
    const params = new URLSearchParams()
    const allowed = ['status', 'type', 'mode', 'date']
    allowed.forEach(k => { if (filters[k]) params.append(k, filters[k]) })
    const qs = params.toString()
    try {
      return await apiClient.get(`/appointments/professional/me${qs ? `?${qs}` : ''}`)
    } catch { /* endpoint not yet supported — fall back */ }
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

  updateSessionNotes: (id, sessionNotes) =>
    apiClient.patch(`/appointments/${id}/session-notes`, { sessionNotes }),

  cancel: (id, reason) =>
    apiClient.put(`/appointments/${id}/cancel`, { reason }),

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
  createForPatient: (data) => {
    // sessionType uses display names; type has a different backend enum so we omit it
    // and let the backend derive it from sessionType (same pattern as /appointments/reserve).
    const SESSION_TYPE_MAP = {
      primera_consulta: 'Primera Sesión',
      seguimiento:      'Seguimiento',
      extraordinaria:   'Extraordinaria',
    }
    const sessionType = SESSION_TYPE_MAP[data.type] || data.type
    return apiClient.post('/appointments', {
      // Backend filters GET /appointments by patientId === user._id (user account),
      // so we must store patientUserId (user account _id) here, not the profile _id.
      patientId: data.patientUserId || data.patientId,
      ...(data.patientUserId ? { patientUserId: data.patientUserId } : {}),
      professionalId: data.professionalId,
      patientName: data.patientName,
      date: data.date,
      time: data.time,
      sessionType,
      duration: data.duration,
      notes: data.notes,
      mode: data.mode ?? (data.isVideoCall ? 'videollamada' : 'consultorio'),
      isVideoCall: data.mode === 'videollamada' || data.isVideoCall || false,
      reason: data.reason || data.notes || '',
      status: 'reserved',
      paymentStatus: 'pending',
      createdBy: 'professional',
    })
  },

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

  /** Get revenue report (professionals only) */
  getRevenue: () =>
    apiClient.get('/appointments/revenue'),
}
