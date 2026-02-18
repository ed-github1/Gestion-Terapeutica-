import { apiClient } from './api'


export const videoCallAPI = {
  // ========================================
  // WebRTC Endpoints 
  // ========================================
  
  // Get ICE servers configuration for WebRTC
  getIceServers: async () => {
    try {
      const response = await apiClient.get('/rtc/ice-servers')
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener servidores ICE')
    }
  },

  // Join video room (WebRTC)
  joinRoom: async (appointmentId) => {
    try {
      const response = await apiClient.post('/rtc/rooms/join', {
        appointmentId
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al unirse a la sala')
    }
  },

  // Get room status
  getRoomStatus: async (appointmentId) => {
    try {
      const response = await apiClient.get(`/rtc/rooms/${appointmentId}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener estado de la sala')
    }
  },

  // Get all active rooms
  getActiveRooms: async () => {
    try {
      const response = await apiClient.get('/rtc/rooms')
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener salas activas')
    }
  },

  // End room (Professional only)
  endRoom: async (appointmentId) => {
    try {
      const response = await apiClient.post(`/rtc/rooms/${appointmentId}/end`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al finalizar la sala')
    }
  },

  // Get room statistics
  getRoomStats: async (appointmentId) => {
    try {
      const response = await apiClient.get(`/rtc/rooms/${appointmentId}/stats`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al obtener estadísticas')
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/rtc/health')
      return response
    } catch (error) {
      throw new Error(error.message || 'Error al verificar salud del servicio')
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
