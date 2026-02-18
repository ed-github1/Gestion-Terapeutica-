import { apiClient } from './api'

export const invitationsAPI = {
  // Send invitation to register a new patient
  sendInvitation: async (invitationData) => {
    try {
      const response = await apiClient.post('/invitations/send', invitationData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al enviar la invitación')
    }
  },

  // Verify invitation code
  verifyCode: async (inviteCode) => {
    try {
      const response = await apiClient.get(`/invitations/verify/${inviteCode}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Código de invitación inválido')
    }
  },

  // Get all invitations (for professional)
  getAll: async () => {
    try {
      const response = await apiClient.get('/invitations')
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener invitaciones')
    }
  },

  // Resend invitation
  resend: async (invitationId) => {
    try {
      const response = await apiClient.post(`/invitations/${invitationId}/resend`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al reenviar invitación')
    }
  }
}
