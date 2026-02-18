/**
 * shared/services/invitationsService.js
 * Patient invitation flow endpoints.
 */
import apiClient from '@shared/api/client'

export const invitationsService = {
  send: (data) =>
    apiClient.post('/invitations/send', data),

  verify: (inviteCode) =>
    apiClient.get(`/invitations/verify/${inviteCode}`),

  getAll: () =>
    apiClient.get('/invitations'),

  resend: (invitationId) =>
    apiClient.post(`/invitations/${invitationId}/resend`),

  complete: (inviteCode, patientData) =>
    apiClient.post(`/invitations/${inviteCode}/complete`, patientData),
}
