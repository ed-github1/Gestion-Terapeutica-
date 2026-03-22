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
            {/* Stripe wordmark */}
            <div className="flex items-center gap-1.5">
              <svg className="h-4.5 text-[#635BFF]" viewBox="0 0 60 25" fill="currentColor" aria-label="Stripe">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a14.4 14.4 0 01-4.56.88c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.4 0 .4-.04 1.09-.06 1.8zm-5.92-5.84c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.23c-1.64 0-2.68-.89-2.68-2.25 0-2.55 2.52-2.98 4.92-2.98v.4c0 1.26-.13 3.4-2.24 3.4v1.43zm3.59-11.93c-1.52 0-3.37.55-4.72 1.54l1.28 2.62c.86-.58 1.9-.97 2.94-.97.89 0 1.55.37 1.55 1.15v.22c-3.93 0-7.42 1.22-7.42 4.93 0 2.74 2.07 4.4 4.74 4.4 1.52 0 2.64-.52 3.37-1.35l.28 1.07h3.6v-9.1c0-3.28-2.43-4.51-5.62-4.51zm-10.27 12.54c-.92 0-1.25-.49-1.25-1.73V12h2.85V8.57h-2.85V4.88h-4.34v3.69h-1.71V12h1.71v7.7c0 2.92 1.64 4.47 4.7 4.47 1.03 0 1.94-.19 2.7-.52v-3.25c-.4.12-.89.21-1.81.21v-.07zm-10.16.07V8.57h-4.34v13.34h4.34zm-2.17-15.3c1.43 0 2.58-1.13 2.58-2.52 0-1.4-1.15-2.53-2.58-2.53A2.53 2.53 0 0019.47 5.1c0 1.39 1.13 2.52 2.47 2.52zm-8.2 3.08c0-1.01.85-1.4 1.97-1.4.98 0 2.07.28 2.98.76V4.73a9.57 9.57 0 00-2.98-.46C12.2 4.27 9.56 6.2 9.56 9.01c0 4.5 5.96 3.74 5.96 5.8 0 1.16-.98 1.55-2.17 1.55-1.19 0-2.58-.43-3.62-1.04v3.44c1.04.46 2.13.7 3.59.7C16.6 19.46 20 17.6 20 14.5c0-4.71-6.23-4.01-6.23-5.81z"/>
              </svg>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Pago seguro</span>
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
              <div className="h-1 w-full bg-[#0075C9]" />
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
                      €{billingPeriod === 'yearly' ? plan.price * 12 : plan.price}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && savings > 0 && (
                    <div className="flex justify-between text-sm text-[#0075C9] dark:text-[#54C0E8]">
                      <span>Descuento anual (20%)</span>
                      <span>-€{savings}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-end">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {billingPeriod === 'yearly' ? 'Facturado anualmente' : 'Facturado mensualmente'}
                    </p>
                    <div className="text-right">
                      {billingPeriod === 'yearly' && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                          €{monthlyEquiv}/mes
                        </p>
                      )}
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">€{price}</p>
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
                <div className="h-1 w-full bg-[#0075C9]" />
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
                      `Ir a pagar · €${price}`
                    )}
                  </motion.button>

                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                    Sin permanencia · Cancela cuando quieras
                  </p>
                </div>
              </div>

              {/* Payment methods strip */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'SSL 256-bit', 'PCI DSS'].map((label) => (
                    <span
                      key={label}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* 30-day guarantee */}
              <div className="bg-[#0075C9]/5 dark:bg-[#0075C9]/10 rounded-2xl border border-[#0075C9]/20 dark:border-[#0075C9]/30 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0075C9]/10 dark:bg-[#0075C9]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[#0075C9] dark:text-[#54C0E8]">30</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Garantía de devolución de 30 días</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Si no estás satisfecho en los primeros 30 días, te devolvemos tu dinero sin preguntas.
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
