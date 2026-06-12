/**
 * shared/services/professionalsService.js
 * HTTP calls related to professional profiles (tarifas, settings).
 */
import apiClient from '@shared/api/client'
import axios from 'axios'

// Create a separate axios instance for file uploads without the default JSON content-type
const uploadClient = axios.create({
  baseURL: apiClient.defaults.baseURL,
  timeout: 15_000,
  withCredentials: true,
})

// Copy auth interceptor from main client
uploadClient.interceptors.request.use((config) => {
  const readCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[2]) : null
  }
  const csrf = readCookie('csrf_token')
  if (csrf) config.headers['X-CSRF-Token'] = csrf
  const token = readCookie('authToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

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

  /** GET /api/professional/me/mp-fee-rate — effective MP processing fee rate for this professional */
  getMyMpFeeRate: () =>
    apiClient.get('/professional/me/mp-fee-rate'),

  /** POST /api/professional/me/dismiss-rates-banner — mark the MP fee banner as dismissed */
  dismissRatesBanner: () =>
    apiClient.post('/professional/me/dismiss-rates-banner'),

  /** POST /api/professional/me/picture — upload professional's profile picture */
  uploadPicture: (file) => {
    const formData = new FormData()
    formData.append('picture', file)
    // Use uploadClient which doesn't have the default application/json header
    return uploadClient.post('/professional/me/picture', formData)
  },

  /** GET /api/professional/{professionalId}/picture — retrieve picture (public) */
  getPicture: (professionalId) =>
    apiClient.get(`/professional/${professionalId}/picture`, { responseType: 'blob' }),
}
