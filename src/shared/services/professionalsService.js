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

  /** GET /api/professional/profile — authenticated professional's full profile */
  getMyProfile: () =>
    apiClient.get('/professional/profile'),

  /** PATCH /api/professional/profile — update authenticated professional's profile fields */
  updateProfile: (fields) =>
    apiClient.patch('/professional/profile', fields),

  /** GET /api/professional/kyc-url — returns a fresh KYC session URL for the logged-in professional */
  getKycUrl: () =>
    apiClient.get('/professional/kyc-url'),

  /** POST /api/professional/contract/sign — returns PDF blob or { success: true } if already signed */
  signContract: (signatureDataUrl) =>
    apiClient.post('/professional/contract/sign', { signatureDataUrl }, { responseType: 'blob' }),

  /** POST /api/professional/consent/sign — returns signed consent PDF blob */
  signConsent: (signatureDataUrl, patientName, cedula) =>
    apiClient.post('/professional/consent/sign', { signatureDataUrl, patientName, cedula }, { responseType: 'blob' }),
}
