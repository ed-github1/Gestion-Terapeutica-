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
    apiClient.get(`/professionals/${profileId}`, { validateStatus: (s) => s < 500 }),
}

/**
 * Resolve the professional linked to the current patient.
 * Returns { professionalId, professionalUserId } — either may be null if unresolvable.
 * Tries multiple endpoints in order and caches professionalUserId in localStorage.
 *
 * Usage:
 *   const { professionalId, professionalUserId } = await resolveLinkedProfessional(user)
 */
export async function resolveLinkedProfessional(user = {}) {
  let pid  = user?.professionalId || user?.professional_id || user?.professional?._id || null
  let puid = null

  // 1. Patient profile
  try {
    const res = await patientsService.getMyProfile()
    const p   = res.data?.data || res.data
    if (!pid)  pid  = p?.professionalId || p?.professional_id || p?.professional?._id || p?.professional?.id || null
    const raw = p?.professionalUserId || p?.professional?.userId || p?.professional?.user?._id || p?.professional?.user?.id || null
    if (!puid) puid = raw && typeof raw === 'object' ? (raw._id || raw.id || null) : raw
  } catch { /* continue */ }

  // 2. Linked professional object
  if (!puid || !pid) {
    try {
      const res = await patientsService.getMyProfessional()
      const p   = res.data?.data || res.data
      if (!pid)  pid  = p?._id || p?.id || null
      const raw = p?.userId || p?.user?._id || p?.user?.id || null
      if (!puid) puid = raw && typeof raw === 'object' ? (raw._id || raw.id || null) : raw
    } catch { /* continue */ }
  }

  // 3. Invitations fallback
  if (!pid || !puid) {
    try {
      const { invitationsService } = await import('./invitationsService')
      const res  = await invitationsService.getAll()
      const list = res.data?.data || res.data || []
      const acc  = Array.isArray(list)
        ? list.find(i => i.status === 'accepted' || i.status === 'completed' || i.professionalId)
        : null
      if (!pid)  pid  = acc?.professionalId || acc?.professional_id || acc?.professional?._id || null
      const raw  = acc?.professionalUserId || acc?.professional?.userId || null
      if (!puid) puid = raw && typeof raw === 'object' ? (raw._id || raw.id || null) : raw
    } catch { /* continue */ }
  }

  // 4. Fetch professional profile by ID to extract userId
  if (pid && !puid) {
    try {
      const res = await patientsService.getProfessionalInfo(pid)
      if (res.status === 200) {
        const p   = res.data?.data || res.data
        const raw = p?.userId || p?.user?._id || p?.user?.id || p?.user || null
        puid = raw && typeof raw === 'object' ? (raw._id || raw.id || null) : raw
      }
    } catch { /* unexpected network failure */ }
  }

  // 5. localStorage cache as last resort
  if (!puid) puid = localStorage.getItem('_linkedProUserId') || null

  if (puid) localStorage.setItem('_linkedProUserId', puid)

  return { professionalId: pid, professionalUserId: puid }
}
