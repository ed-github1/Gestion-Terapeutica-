/**
 * shared/services/patientsService.js
 * All HTTP calls related to patient records management.
 */
import apiClient from '@shared/api/client'

export const patientsService = {
  create: (data) =>
    apiClient.post('/patients', data),

  getAll: () =>
    apiClient.get('/patients'),

  getById: (id) =>
    apiClient.get(`/patients/${id}`),

  update: (id, data) =>
    apiClient.put(`/patients/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/patients/${id}`),

  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('photo', file)
    return apiClient.post(`/patients/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadDocuments: (id, files) => {
    const form = new FormData()
    const fileList = Array.isArray(files) ? files : [files]
    fileList.forEach((f) => form.append('documents', f))
    return apiClient.post(`/patients/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  sendInvitation: (id, email) =>
    apiClient.post(`/patients/${id}/send-invitation`, { email }),
}
