import { apiClient as api } from './api'

/**
 * Subscription API Service
 * Handles subscription management, upgrades, and billing
 */

/**
 * Get current user's subscription details
 */
export const getCurrentSubscription = async () => {
  const response = await api.get('/subscription/current')
  return response.data
}

/**
 * Get user's usage statistics
 */
export const getUsageStats = async () => {
  const response = await api.get('/subscription/usage')
  return response.data
}

/**
 * Create or update subscription
 */
export const createSubscription = async (planType, billingPeriod = 'monthly') => {
  const response = await api.post('/subscription/create', {
    planType,
    billingPeriod
  })
  return response.data
}

/**
 * Upgrade/downgrade subscription
 */
export const changeSubscription = async (newPlanType, billingPeriod = 'monthly') => {
  const response = await api.put('/subscription/change', {
    planType: newPlanType,
    billingPeriod
  })
  return response.data
}

/**
 * Cancel subscription
 */
export const cancelSubscription = async (reason = '') => {
  const response = await api.post('/subscription/cancel', {
    reason,
    cancelAt: 'period_end' // or 'immediately'
  })
  return response.data
}

/**
 * Reactivate cancelled subscription
 */
export const reactivateSubscription = async () => {
  const response = await api.post('/subscription/reactivate')
  return response.data
}

/**
 * Get billing history
 */
export const getBillingHistory = async () => {
  const response = await api.get('/subscription/billing-history')
  return response.data
}

/**
 * Update payment method
 */
export const updatePaymentMethod = async (paymentMethodId) => {
  const response = await api.put('/subscription/payment-method', {
    paymentMethodId
  })
  return response.data
}

/**
 * Request enterprise quote
 */
export const requestEnterpriseQuote = async (data) => {
  const response = await api.post('/subscription/enterprise-quote', {
    companyName: data.companyName,
    numberOfProfessionals: data.numberOfProfessionals,
    email: data.email,
    phone: data.phone,
    requirements: data.requirements
  })
  return response.data
}

/**
 * Create checkout session (for Stripe integration)
 */
export const createCheckoutSession = async (planType, billingPeriod) => {
  const response = await api.post('/subscription/checkout-session', {
    planType,
    billingPeriod,
    successUrl: `${window.location.origin}/dashboard/professional?checkout=success`,
    cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`
  })
  return response.data
}

/**
 * Verify checkout session after payment
 */
export const verifyCheckoutSession = async (sessionId) => {
  const response = await api.get(`/subscription/verify-checkout/${sessionId}`)
  return response.data
}

/**
 * Get subscription features availability
 */
export const checkFeatureAvailability = async (featureName) => {
  const response = await api.get(`/subscription/feature/${featureName}`)
  return response.data
}

const subscriptionAPI = {
  getCurrentSubscription,
  getUsageStats,
  createSubscription,
  changeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getBillingHistory,
  updatePaymentMethod,
  requestEnterpriseQuote,
  createCheckoutSession,
  verifyCheckoutSession,
  checkFeatureAvailability
}

export default subscriptionAPI
