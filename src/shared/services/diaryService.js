/**
 * shared/services/diaryService.js
 * Clinical diary / session notes for patients.
 */
import apiClient from '@shared/api/client'

export const diaryService = {
  addNote: (patientId, noteData) =>
    apiClient.post(`/patients/${patientId}/diary-notes`, noteData),

  getNotes: (patientId) =>
    apiClient.get(`/patients/${patientId}/diary-notes`),

  updateNote: (patientId, noteId, data) =>
    apiClient.put(`/patients/${patientId}/diary-notes/${noteId}`, data),

  deleteNote: (patientId, noteId) =>
    apiClient.delete(`/patients/${patientId}/diary-notes/${noteId}`),
}
