import apiClient from '@shared/api/client'

export const statsService = {
  getProfessionalStats: (year) =>
    apiClient.get(`/professional/stats?year=${year}`),

  getProfessionalSettings: () =>
    apiClient.get('/professional/settings'),

  updateProfessionalSettings: (settings) =>
    apiClient.patch('/professional/settings', settings),
}
