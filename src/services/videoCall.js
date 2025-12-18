import { apiClient } from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const videoCallAPI = {
  // Get Twilio token for video call
  getToken: async (appointmentId, identity) => {
    try {
      const response = await apiClient.post('/video/token', {
        appointmentId,
        identity
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener token de video')
    }
  },

  // Notify patient about incoming video call
  notifyPatient: async (appointmentId, patientId) => {
    try {
      const response = await apiClient.post(`/video/notify-patient`, {
        appointmentId,
        patientId
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al notificar al paciente')
    }
  },

  // Get active video call invitations for patient
  getActiveInvitations: async () => {
    try {
      const response = await apiClient.get('/video/active-invitations')
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener invitaciones')
    }
  },

  // Accept video call invitation
  acceptInvitation: async (appointmentId) => {
    try {
      const response = await apiClient.post(`/video/accept-invitation`, {
        appointmentId
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al aceptar la invitación')
    }
  },

  // Decline video call invitation
  declineInvitation: async (appointmentId, reason = '') => {
    try {
      const response = await apiClient.post(`/video/decline-invitation`, {
        appointmentId,
        reason
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al rechazar la invitación')
    }
  },

  // Check if professional is waiting in call
  checkCallStatus: async (appointmentId) => {
    try {
      const response = await apiClient.get(`/video/call-status/${appointmentId}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al verificar estado de llamada')
    }
  },

  // Start video call session
  startCall: async (appointmentId) => {
    try {
      const response = await apiClient.post(`/video/start-call`, {
        appointmentId
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al iniciar la llamada')
    }
  },

  // End video call session
  endCall: async (appointmentId, duration) => {
    try {
      const response = await apiClient.post(`/video/end-call`, {
        appointmentId,
        duration
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al finalizar la llamada')
    }
  }
}
