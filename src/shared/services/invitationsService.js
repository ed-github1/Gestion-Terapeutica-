/**
 * shared/services/invitationsService.js
 * Patient invitation flow endpoints.
 */
import apiClient from '@shared/api/client'

export const invitationsService = {
  // POST /api/invitations — professional sends invite
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
