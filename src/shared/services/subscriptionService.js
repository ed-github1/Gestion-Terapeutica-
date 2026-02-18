/**
 * shared/services/subscriptionService.js
 * Subscription plan and checkout endpoints.
 */
import apiClient from '@shared/api/client'

export const subscriptionService = {
  getPlans: () =>
    apiClient.get('/subscriptions/plans'),

  getCurrentPlan: () =>
    apiClient.get('/subscriptions/current'),

  createCheckoutSession: (planId, billingCycle) =>
    apiClient.post('/subscriptions/checkout', { planId, billingCycle }),

  cancelSubscription: () =>
    apiClient.post('/subscriptions/cancel'),

  upgradePlan: (planId) =>
    apiClient.post('/subscriptions/upgrade', { planId }),
}
