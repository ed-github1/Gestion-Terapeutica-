import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Check, X, ArrowRight, Zap, Building2, Star, Shield, Sparkles, Crown } from 'lucide-react'
import { PLAN_TYPES, PLAN_PRICING, PLAN_LIMITS } from '@constants/subscriptionPlans'

const PricingPlans = () => {
  const navigate = useNavigate()
  const [billingPeriod, setBillingPeriod] = useState('monthly') // monthly or yearly
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handleSelectPlan = (planType) => {
    setSelectedPlan(planType)
    
    if (planType === PLAN_TYPES.GRATUITO) {
      // Redirect to signup with free plan
      navigate('/register?plan=gratuito')
    } else if (planType === PLAN_TYPES.EMPRESA) {
      // Redirect to contact/demo page
      navigate('/contact?plan=empresa')
    } else {
      // Redirect to checkout
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-blue-100/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Planes y Precios
                </h1>
                <p className="text-sm text-indigo-600 mt-1">Elige el plan perfecto para tu práctica</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-12"
        >
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-blue-100 inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* GRATUITO Plan */}
          <PlanCard
            planType={PLAN_TYPES.GRATUITO}
            pricing={getPlanPrice(PLAN_TYPES.GRATUITO)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.1}
          />

          {/* PRO Plan */}
          <PlanCard
            planType={PLAN_TYPES.PRO}
            pricing={getPlanPrice(PLAN_TYPES.PRO)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.2}
          />

          {/* EMPRESA Plan */}
          <PlanCard
            planType={PLAN_TYPES.EMPRESA}
            pricing={getPlanPrice(PLAN_TYPES.EMPRESA)}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
            delay={0.3}
          />
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-100 shadow-xl"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6 text-center">Preguntas Frecuentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Guarantee Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-2xl border border-blue-200 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-indigo-900">Garantía de 30 días</p>
              <p className="text-sm text-indigo-700">Si no estás satisfecho, te devolvemos tu dinero</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Plan Card Component
const PlanCard = ({ planType, pricing, billingPeriod, onSelect, delay }) => {
  const plan = PLAN_PRICING[planType]
  const limits = PLAN_LIMITS[planType]
  const isPopular = plan.popular

  const getIcon = () => {
    switch (planType) {
      case PLAN_TYPES.GRATUITO:
        return <Star className="w-7 h-7" />
      case PLAN_TYPES.PRO:
        return <Crown className="w-7 h-7" />
      case PLAN_TYPES.EMPRESA:
        return <Building2 className="w-7 h-7" />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2 ${
        isPopular
          ? 'border-indigo-500 shadow-xl scale-105 ring-4 ring-indigo-100'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MÁS POPULAR
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
          planType === PLAN_TYPES.GRATUITO ? 'from-slate-500 to-slate-600' :
          planType === PLAN_TYPES.PRO ? 'from-indigo-600 to-blue-600' :
          'from-blue-700 to-indigo-800'
        } flex items-center justify-center text-white mb-4 shadow-lg`}>
          {getIcon()}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

        {/* Price */}
        <div className="mb-6">
          {plan.customPricing ? (
            <div>
              <p className="text-4xl font-bold text-gray-900 mb-1">Personalizado</p>
              <p className="text-sm text-gray-600">Contáctanos para una cotización</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">${pricing.price}</span>
                <span className="text-gray-600">/ mes</span>
              </div>
              {billingPeriod === 'yearly' && pricing.yearly && (
                <p className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full inline-block">
                  ${pricing.yearly}/año (ahorras ${(pricing.price * 12) - pricing.yearly})
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
          className={`w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mb-8 transition-all shadow-lg ${
            isPopular
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200'
              : planType === PLAN_TYPES.GRATUITO
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200'
          }`}
        >
          {planType === PLAN_TYPES.GRATUITO ? 'Comenzar Gratis' : 
           planType === PLAN_TYPES.EMPRESA ? 'Contactar Ventas' : 
           'Comenzar Prueba'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Features List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Incluye:</p>
          {limits.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-indigo-600" strokeWidth={3} />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}

          {limits.restrictions.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">No incluye:</p>
              {limits.restrictions.map((restriction, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500">{restriction}</span>
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
    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100/50 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-indigo-900 mb-2">{question}</h3>
      <p className="text-sm text-gray-600">{answer}</p>
    </div>
  )
}

export default PricingPlans
