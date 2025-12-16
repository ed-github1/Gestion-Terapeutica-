import { apiClient } from './auth'

export const patientsAPI = {
  // Create a new patient
  create: async (patientData) => {
    const response = await apiClient.post('/patients', patientData)
    return response
  },

  // Get all patients
  getAll: async () => {
    const response = await apiClient.get('/patients')
    return response
  },

  // Get single patient
  getById: async (id) => {
    const response = await apiClient.get(`/patients/${id}`)
    return response
  },

  // Update patient
  update: async (id, patientData) => {
    const response = await apiClient.put(`/patients/${id}`, patientData)
    return response
  },

  // Delete patient
  delete: async (id) => {
    const response = await apiClient.delete(`/patients/${id}`)
    return response
  },

  // Upload patient photo
  uploadPhoto: async (patientId, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await apiClient.post(`/patients/${patientId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // Upload patient documents (multiple files)
  uploadDocument: async (patientId, files) => {
    const formData = new FormData()
    // If files is an array, append each file
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('documents', file)
      })
    } else {
      // Single file
      formData.append('documents', files)
    }
    const response = await apiClient.post(`/patients/${patientId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // Send registration invitation to patient
  sendInvitation: async (patientId, email) => {
    const response = await apiClient.post(`/patients/${patientId}/send-invitation`, { email })
    return response
  }
}
