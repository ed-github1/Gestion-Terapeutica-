/**
 * CheckoutPage.jsx
 *
 * "Review your order" page. On submit it calls the backend to create a
 * Stripe Checkout Session and redirects the user to Stripe's hosted
 * payment page — the same approach used by GitHub, Notion, Linear, etc.
 *
 * Flow:
 *   1. User picks a plan on /pricing
 *   2. Lands here → reviews the order summary
 *   3. Clicks "Ir a pagar" → POST /subscriptions/checkout
 *   4. Backend returns { checkoutUrl }
 *   5. window.location.href = checkoutUrl  (Stripe's hosted page)
 *   6. On success Stripe redirects back to /dashboard/professional?subscription=success
 *   7. On cancel  Stripe redirects back to /pricing
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { PLAN_PRICING, PLAN_LIMITS, PLAN_TYPES } from '@shared/constants/subscriptionPlans'
import { subscriptionService } from '@shared/services/subscriptionService'
import { showToast } from '@shared/ui/Toast'
import { useDarkModeContext } from '@shared/DarkModeContext'

/* ─────────────────────────────────────────────────────────────────────────
   CheckoutPage
───────────────────────────────────────────────────────────────────────── */
const CheckoutPage = () => {
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { dark }          = useDarkModeContext()

  const planType      = searchParams.get('plan')?.toUpperCase() || PLAN_TYPES.PRO
  const billingPeriod = searchParams.get('billing') || 'monthly'

  const [loading, setLoading] = useState(false)

  const plan   = PLAN_PRICING[planType] || PLAN_PRICING[PLAN_TYPES.PRO]
  const limits = PLAN_LIMITS[planType]  || PLAN_LIMITS[PLAN_TYPES.PRO]

  const price = billingPeriod === 'yearly' && plan.yearlyPrice
    ? plan.yearlyPrice
    : billingPeriod === 'yearly'
      ? plan.price * 12
      : plan.price

  const monthlyEquiv = billingPeriod === 'yearly' ? Math.round(price / 12) : plan.price
  const savings      = billingPeriod === 'yearly' ? (plan.price * 12) - price : 0

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await subscriptionService.createCheckoutSession(planType, billingPeriod)
      const checkoutUrl = res?.data?.checkoutUrl || res?.checkoutUrl
      if (!checkoutUrl) throw new Error('No checkout URL')
      window.location.href = checkoutUrl
    } catch {
      showToast('No se pudo iniciar el pago. Intenta de nuevo.', 'error')
      setLoading(false)
    }
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen tm-bg transition-colors">

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pricing')}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Revisar pedido</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plan {plan.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8 items-start">

            {/* Left — Order summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
            >
              <div className="h-1 w-full bg-linear-to-r from-[#0075C9] via-[#54C0E8] to-[#AEE058]" />
              <div className="p-7">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{plan.name}</p>
                  {plan.popular && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.description}</p>

                {/* Price breakdown */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-6 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Plan {plan.name} · {billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${billingPeriod === 'yearly' ? plan.price * 12 : plan.price}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && savings > 0 && (
                    <div className="flex justify-between text-sm text-[#0075C9] dark:text-[#54C0E8]">
                      <span>Descuento anual (20%)</span>
                      <span>-${savings}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-end">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {billingPeriod === 'yearly' ? 'Facturado anualmente' : 'Facturado mensualmente'}
                    </p>
                    <div className="text-right">
                      {billingPeriod === 'yearly' && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                          ${monthlyEquiv}/mes
                        </p>
                      )}
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">${price}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Incluye
                </p>
                <ul className="space-y-2.5">
                  {limits.features.slice(0, 7).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#0075C9]" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                  {limits.features.length > 7 && (
                    <li className="text-sm text-gray-400 dark:text-gray-500 pl-4">
                      +{limits.features.length - 7} más incluidos
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>

            {/* Right — CTA stack */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="flex flex-col gap-4"
            >
              {/* Payment panel */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-linear-to-r from-[#0075C9] via-[#54C0E8] to-[#AEE058]" />
                <div className="p-7">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Pago seguro con Stripe</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Serás redirigido a la página de pago oficial de Stripe. Acepta tarjetas, Apple Pay, Google Pay y más.
                  </p>

                  {/* Steps */}
                  <div className="space-y-3 mb-7">
                    {[
                      'Introduce tus datos de pago de forma segura',
                      'Stripe procesa el pago con cifrado SSL',
                      'Recibirás confirmación por email al instante',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#0075C9]/10 dark:bg-[#0075C9]/20 text-[#0075C9] dark:text-[#54C0E8] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <motion.button
                    onClick={handleCheckout}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.015 }}
                    whileTap={{ scale: loading ? 1 : 0.985 }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0075C9] hover:bg-[#005fa3] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Redirigiendo…
                      </>
                    ) : (
                      `Ir a pagar · $${price}`
                    )}
                  </motion.button>

                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                    Sin permanencia · Cancela cuando quieras
                  </p>
                </div>
              </div>

     
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default CheckoutPage
