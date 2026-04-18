/**
 * shared/services/professionalsService.js
 * HTTP calls related to professional profiles (tarifas, settings).
 */
import apiClient from '@shared/api/client'

export const professionalsService = {
  /** GET /api/professionals/me/tarifas — current professional's session rates */
  getMyTarifas: () =>
    apiClient.get('/professionals/me/tarifas'),

  /** PUT /api/professionals/me/tarifas — update current professional's session rates */
  updateMyTarifas: (tarifas) =>
    apiClient.put('/professionals/me/tarifas', { tarifas }),

  /** GET /api/professionals/:id/tarifas — public: get a professional's session rates (for patients) */
  getTarifas: (professionalId) =>
    apiClient.get(`/professionals/${professionalId}/tarifas`),
}
