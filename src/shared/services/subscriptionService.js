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

  /** Returns { clientSecret } to confirm with Stripe.js on the frontend */
  createPaymentIntent: (planId, billingCycle, email) =>
    apiClient.post('/subscriptions/payment-intent', { planId, billingCycle, email }),

  /** Legacy: returns { checkoutUrl } for Stripe Hosted Checkout redirect */
  createCheckoutSession: (planId, billingCycle) => {
    const origin = window.location.origin
    return apiClient.post('/subscriptions/checkout', {
      planId,
      billingCycle,
      successUrl: `${origin}/dashboard/professional?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing`,
    })
  },

  /** Verify a Stripe Checkout Session and activate the plan if paid */
  verifyCheckoutSession: (sessionId) =>
    apiClient.post('/subscriptions/verify-session', { sessionId }),

  cancelSubscription: () =>
    apiClient.post('/subscriptions/cancel'),

  upgradePlan: (planId) =>
    apiClient.post('/subscriptions/upgrade', { planId }),
}
