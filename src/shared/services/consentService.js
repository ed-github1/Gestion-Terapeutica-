import apiClient from '../api/client'

/**
 * Check whether the authenticated professional has already signed the consent.
 * Backend should return { signed: boolean, signedAt?: string }
 */
export const getConsentStatus = () =>
  apiClient.get('/professionals/consent/status')
