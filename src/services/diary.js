import { apiClient } from './auth'

export const diaryAPI = {
  // Add a diary note for a patient
  addNote: async (patientId, noteData) => {
    const response = await apiClient.post(`/patients/${patientId}/diary-notes`, noteData)
    return response
  },

  // Get all diary notes for a patient
  getNotes: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/diary-notes`)
    return response
  }
}
