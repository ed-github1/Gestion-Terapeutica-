/**
 * shared/services/invitationsService.js
 * Patient invitation flow endpoints.
 */
import apiClient from '@shared/api/client'

export const invitationsService = {
  // POST /api/invitations/generate-link — create a shareable registration link (no patient data required)
  generateLink: () =>
    apiClient.post('/invitations/generate-link').then((res) => res.data ?? res),

  // POST /api/invitations — professional sends invite (or creates link-only invitation)
  send: (data) =>
    apiClient.post('/invitations', data),

  // GET /api/invitations/verify/:code — validate token before showing register form
  verify: (code) =>
    apiClient.get(`/invitations/verify/${code}`),

  // GET /api/invitations — list all invitations sent by this professional
  getAll: () =>
    apiClient.get('/invitations'),

  // POST /api/invitations/:id/resend — resend email for a pending invite
  resend: (invitationId) =>
    apiClient.post(`/invitations/${invitationId}/resend`),
}
