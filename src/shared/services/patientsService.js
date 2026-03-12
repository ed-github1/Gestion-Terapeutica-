/**
 * shared/services/patientsService.js
 * All HTTP calls related to patient records management.
 */
import apiClient from '@shared/api/client'

export const patientsService = {
  // GET /api/patients/me — patient's own profile (includes professionalId link)
  getMyProfile: () =>
    apiClient.get('/patients/me'),

  // GET /api/patients/my-professional — returns the professional linked to this patient
  getMyProfessional: () =>
    apiClient.get('/patients/my-professional'),

  // GET /api/patients?status=active&search=juan&page=1&limit=20
  getAll: ({ status, search, page = 1, limit = 50 } = {}) => {
    const params = { page, limit }
    if (status && status !== 'all') params.status = status
    if (search) params.search = search
    return apiClient.get('/patients', { params })
  },

  getById: (id) =>
    apiClient.get(`/patients/${id}`),

  update: (id, data) =>
    apiClient.put(`/patients/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/patients/${id}`),

  /** GET /api/professionals/:id — public info about a professional (returns userId for socket routing) */
  getProfessionalInfo: (profileId) =>
    apiClient.get(`/professionals/${profileId}`),
}
