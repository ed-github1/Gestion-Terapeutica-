import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { CreditCard, Lock, Check, ArrowLeft } from 'lucide-react'
import { PLAN_PRICING, PLAN_LIMITS, PLAN_TYPES } from '@constants/subscriptionPlans'
import { subscriptionService } from '@shared/services/subscriptionService'
import { showToast } from '@components'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planType = searchParams.get('plan')?.toUpperCase() || PLAN_TYPES.PRO
  const billingPeriod = searchParams.get('billing') || 'monthly'
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingEmail: '',
    acceptTerms: false
  })

  const plan = PLAN_PRICING[planType]
  const limits = PLAN_LIMITS[planType]
  
  const getPrice = () => {
    if (billingPeriod === 'yearly' && plan.yearlyPrice) {
      return plan.yearlyPrice
    }
    return billingPeriod === 'yearly' ? plan.price * 12 : plan.price
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.acceptTerms) {
      showToast('Debes aceptar los términos y condiciones', 'error')
      return
    }

    setLoading(true)
    try {
      // Create checkout session (Stripe integration)
      const session = await subscriptionService.createCheckoutSession(planType, billingPeriod)
      
      // Redirect to Stripe checkout
      if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl
      } else {
        // Handle direct subscription creation
        await subscriptionService.createCheckoutSession(planType, billingPeriod)
        showToast('✅ Suscripción activada exitosamente', 'success')
        navigate('/dashboard/professional?subscription=success')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      showToast('❌ Error al procesar el pago. Intenta nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
  }

  const formatExpiryDate = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Volver a Planes</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-4xl p-8 border border-gray-200 shadow-sm h-fit"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>
            
            <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${plan.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Plan {plan.name}</h3>
            <p className="text-gray-600 mb-6">{plan.description}</p>

            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-700">Plan {plan.name} - {billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}</span>
                <span className="font-bold text-gray-900">€{getPrice()}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="flex justify-between mb-3 text-sm text-emerald-600">
                  <span>Descuento anual (20%)</span>
                  <span>-€{(plan.price * 12) - getPrice()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">€{getPrice()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {billingPeriod === 'yearly' ? 'Facturado anualmente' : 'Facturado mensualmente'}
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-500 uppercase mb-4">Incluye:</p>
              {limits.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Pago 100% Seguro</p>
                <p className="text-xs text-blue-700">Cifrado SSL de 256 bits</p>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-4xl p-8 border border-gray-200 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Pago</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Billing Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email de Facturación *
                </label>
                <input
                  type="email"
                  name="billingEmail"
                  value={formData.billingEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Tarjeta *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value)
                      setFormData(prev => ({ ...prev, cardNumber: formatted }))
                    }}
                    maxLength={19}
                    required
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                  />
                  <CreditCard className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Titular *
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Como aparece en la tarjeta"
                />
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Exp. *
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => {
                      const formatted = formatExpiryDate(e.target.value)
                      setFormData(prev => ({ ...prev, expiryDate: formatted }))
                    }}
                    maxLength={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="MM/AA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    maxLength={4}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label className="text-sm text-gray-700">
                  Acepto los{' '}
                  <a href="/terms" className="text-emerald-600 hover:underline font-semibold">
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/privacy" className="text-emerald-600 hover:underline font-semibold">
                    Política de Privacidad
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Procesando...' : `Pagar €${getPrice()}`}
              </motion.button>

              <p className="text-xs text-center text-gray-500">
                Puedes cancelar tu suscripción en cualquier momento desde tu panel de control
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
