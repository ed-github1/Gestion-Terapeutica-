/**
 * shared/services/videoCallService.js
 * WebRTC signaling and room management endpoints.
 */
import apiClient from '@shared/api/client'

export const videoCallService = {
  getIceServers: () =>
    apiClient.get('/rtc/ice-servers'),

  joinRoom: (appointmentId, { recordingConsent = false } = {}) =>
    apiClient.post('/rtc/rooms/join', { appointmentId, recordingConsent }),

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

  // Start a video call (creates room on backend via RTC)
  startCall: (appointmentId) =>
    apiClient.post('/rtc/rooms/join', { appointmentId }),

  // Video invitations
  sendVideoInvitation: (appointmentId, patientId, patientName, professionalName) =>
    apiClient.post('/video/notify-patient', { appointmentId, patientId, patientName, professionalName }),

  getActiveInvitations: () =>
    apiClient.get('/video/active-invitations'),

  acceptInvitation: (appointmentId) =>
    apiClient.post('/video/accept-invitation', { appointmentId }),

  rejectInvitation: (appointmentId) =>
    apiClient.post('/video/decline-invitation', { appointmentId }),

  // End video call and track duration
  endCall: (appointmentId, duration) =>
    apiClient.post('/video/end', { appointmentId, duration }),

  // Set recordingConsent on the appointment so the upload is accepted
  grantRecordingConsent: (appointmentId) =>
    apiClient.put(`/appointments/${appointmentId}`, { recordingConsent: true }),

  // Upload a client-side audio recording blob
  uploadRecording: (appointmentId, blob) => {
    const formData = new FormData()
    formData.append('recording', blob, 'recording.webm')
    formData.append('recordingConsent', 'true')
    return apiClient.post(`/rtc/rooms/${appointmentId}/recording`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
