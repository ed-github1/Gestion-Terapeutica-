import apiClient from '../api/client'

/**
 * Upload a signed consent PDF for the authenticated professional.
 *
 * Backend contract (to implement):
 *   POST /professionals/consent
 *   Content-Type: multipart/form-data
 *   Fields:
 *     - consent   : PDF file blob
 *     - doctorName: string
 *     - cedula    : string
 *     - signedAt  : ISO date string
 *
 * Expected response: { ok: true, url?: string }
 *
 * The backend should:
 *   1. Receive the file via multer (or equivalent)
 *   2. Store it in MongoDB as { professionalId, pdfBuffer, doctorName, cedula, signedAt, ip }
 *      OR upload to Cloudflare R2/Cloudinary and store only the URL
 *   3. Set professional.consentSigned = true on their user document
 */
export const uploadSignedConsent = (blob, { doctorName, cedula }) => {
  const formData = new FormData()
  formData.append('consent', blob, `consent_${Date.now()}.pdf`)
  formData.append('doctorName', doctorName)
  formData.append('cedula', cedula)
  formData.append('signedAt', new Date().toISOString())

  return apiClient.post('/professionals/consent', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Check whether the authenticated professional has already signed.
 * Backend should return { signed: boolean, signedAt?: string }
 */
export const getConsentStatus = () =>
  apiClient.get('/professionals/consent/status')
