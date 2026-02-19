/**
 * shared/services/videoCallService.js
 * WebRTC signaling and room management endpoints.
 */
import apiClient from '@shared/api/client'

export const videoCallService = {
  getIceServers: () =>
    apiClient.get('/rtc/ice-servers'),

  joinRoom: (appointmentId) =>
    apiClient.post('/rtc/rooms/join', { appointmentId }),

  getRoomStatus: (appointmentId) =>
    apiClient.get(`/rtc/rooms/${appointmentId}`),

  getActiveRooms: () =>
    apiClient.get('/rtc/rooms'),

  endRoom: (appointmentId) =>
    apiClient.post(`/rtc/rooms/${appointmentId}/end`),

  getRoomStats: (appointmentId) =>
    apiClient.get(`/rtc/rooms/${appointmentId}/stats`),

  healthCheck: () =>
    apiClient.get('/rtc/health'),

  // Video invitations
  sendVideoInvitation: (appointmentId, patientId, patientName, professionalName) =>
    apiClient.post('/video/notify-patient', { appointmentId, patientId, patientName, professionalName }),

  getActiveInvitations: () =>
    apiClient.get('/video/active-invitations'),

  acceptInvitation: (appointmentId) =>
    apiClient.post('/video/accept-invitation', { appointmentId }),

  rejectInvitation: (appointmentId) =>
    apiClient.post('/video/decline-invitation', { appointmentId }),
}
