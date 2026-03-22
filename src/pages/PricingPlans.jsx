import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { PLAN_TYPES, PLAN_PRICING, PLAN_LIMITS } from '@shared/constants/subscriptionPlans'
import { useDarkModeContext } from '@shared/DarkModeContext'

const PricingPlans = () => {
  const navigate = useNavigate()
  const { dark } = useDarkModeContext()
  const [billingPeriod, setBillingPeriod] = useState('monthly')

  const handleSelectPlan = (planType) => {
    if (planType === PLAN_TYPES.GRATUITO) {
      navigate('/register?plan=gratuito')
    } else if (planType === PLAN_TYPES.EMPRESA) {
      navigate('/contact?plan=empresa')
    } else {
      navigate(`/checkout?plan=${planType.toLowerCase()}&billing=${billingPeriod}`)
    }
  }

  const getPlanPrice = (planType) => {
    const plan = PLAN_PRICING[planType]
    if (plan.customPricing) return null
    if (billingPeriod === 'yearly' && plan.yearlyPrice) {
      return { price: Math.round(plan.yearlyPrice / 12), yearly: plan.yearlyPrice }
    }
    return { price: plan.price, yearly: null }
  }

  return (
    <div className={dark ? 'dark' : ''}>
    <div className="min-h-screen tm-bg">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Planes y Precios</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Elige el plan perfecto para tu práctica</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero blurb */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Simple, transparente, sin sorpresas
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Comienza gratis y crece cuando lo necesites. Sin contratos, sin permanencia.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm inline-flex gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#0075C9] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-[#0075C9] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-[#AEE058] text-gray-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                −20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <PlanCard
            planType={PLAN_TYPES.GRATUITO}
            pricing={getPlanPrice(PLAN_TYPES.GRATUITO)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.1}
          />
          <PlanCard
            planType={PLAN_TYPES.PRO}
            pricing={getPlanPrice(PLAN_TYPES.PRO)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.15}
          />
          <PlanCard
            planType={PLAN_TYPES.EMPRESA}
            pricing={getPlanPrice(PLAN_TYPES.EMPRESA)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.2}
          />
        </div>

        {/* Guarantee strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left mb-14"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0075C9]/10 dark:bg-[#54C0E8]/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-[#0075C9] dark:text-[#54C0E8]">30</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">Garantía de devolución de 30 días</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Si no estás satisfecho en los primeros 30 días, te devolvemos tu dinero sin preguntas.</p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Preguntas frecuentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FAQItem
              question="¿Puedo cambiar de plan en cualquier momento?"
              answer="Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se aplican inmediatamente."
            />
            <FAQItem
              question="¿Qué métodos de pago aceptan?"
              answer="Aceptamos tarjetas de crédito/débito, PayPal y transferencias bancarias para planes Empresa."
            />
            <FAQItem
              question="¿Hay contrato de permanencia?"
              answer="No, todos nuestros planes son sin compromiso. Puedes cancelar en cualquier momento."
            />
            <FAQItem
              question="¿Los datos están seguros?"
              answer="Sí, cumplimos con HIPAA y GDPR. Todos los datos están cifrados y almacenados de forma segura."
            />
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  )
}

// Plan Card Component
const PlanCard = ({ planType, pricing, billingPeriod, onSelect, delay }) => {
  const plan = PLAN_PRICING[planType]
  const limits = PLAN_LIMITS[planType]
  const isPopular = plan.popular

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all hover:shadow-lg flex flex-col ${
        isPopular
          ? 'border-[#0075C9] dark:border-[#54C0E8] shadow-md'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #0075C9, #54C0E8, #AEE058)' }} />

      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#0075C9] text-white uppercase tracking-wide">
            Más popular
          </span>
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        {/* Plan name & description */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{plan.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          {plan.customPricing ? (
            <div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">A medida</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Contáctanos para una cotización</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${pricing.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ mes</span>
              </div>
              {billingPeriod === 'yearly' && pricing.yearly && (
                <p className="text-xs text-[#0075C9] dark:text-[#54C0E8] font-semibold mt-1.5 bg-[#0075C9]/8 dark:bg-[#54C0E8]/10 px-2.5 py-1 rounded-lg inline-block">
                  ${pricing.yearly}/año · ahorras ${(pricing.price * 12) - pricing.yearly}
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(planType)}
          className={`w-full py-3 rounded-2xl font-bold text-sm mb-7 transition-all ${
            isPopular
              ? 'bg-[#0075C9] hover:bg-[#005fa3] text-white shadow-sm'
              : planType === PLAN_TYPES.GRATUITO
              ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              : 'bg-[#4D5858] hover:bg-[#3c4444] dark:bg-gray-700 dark:hover:bg-gray-600 text-white dark:text-gray-200'
          }`}
        >
          {planType === PLAN_TYPES.GRATUITO ? 'Comenzar gratis'
           : planType === PLAN_TYPES.EMPRESA ? 'Contactar ventas'
           : 'Comenzar prueba'}
        </motion.button>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-700 mb-5" />

        {/* Features List */}
        <div className="space-y-2.5 flex-1">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Incluye</p>
          {limits.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                planType === PLAN_TYPES.PRO ? 'bg-[#0075C9]' :
                planType === PLAN_TYPES.EMPRESA ? 'bg-[#54C0E8]' :
                'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{feature}</span>
            </div>
          ))}

          {limits.restrictions.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-700 my-4" />
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">No incluye</p>
              {limits.restrictions.map((restriction, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm text-gray-400 dark:text-gray-500 leading-snug">{restriction}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">{question}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{answer}</p>
    </div>
  )
}

export default PricingPlans
