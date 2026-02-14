/**
 * Subscription Plans Configuration
 * Defines pricing tiers and features for the platform
 */

export const PLAN_TYPES = {
  GRATUITO: 'GRATUITO',
  PRO: 'PRO',
  EMPRESA: 'EMPRESA'
}

export const PLAN_LIMITS = {
  GRATUITO: {
    maxPatients: 5,
    maxAppointmentsPerMonth: 20,
    videoCallMinutes: 60, // per month
    storageGB: 1,
    supportLevel: 'community',
    features: [
      'Hasta 5 pacientes activos',
      'Máximo 20 citas al mes',
      '60 minutos de videollamadas',
      '1 GB de almacenamiento',
      'Agenda básica',
      'Notas de sesión',
      'Soporte por comunidad'
    ],
    restrictions: [
      'Sin recordatorios automáticos',
      'Sin informes avanzados',
      'Sin integraciones',
      'Marca de agua en informes'
    ]
  },
  PRO: {
    maxPatients: 50,
    maxAppointmentsPerMonth: -1, // unlimited
    videoCallMinutes: 500,
    storageGB: 50,
    supportLevel: 'priority',
    features: [
      'Hasta 50 pacientes activos',
      'Citas ilimitadas',
      '500 minutos de videollamadas',
      '50 GB de almacenamiento',
      'Recordatorios automáticos por SMS/Email',
      'Análisis y estadísticas avanzadas',
      'Plantillas personalizadas',
      'Formularios de evaluación',
      'Calendario sincronizado (Google/Outlook)',
      'Informes profesionales sin marca',
      'Soporte prioritario 24/7',
      'Seguridad y cifrado avanzado'
    ],
    restrictions: []
  },
  EMPRESA: {
    maxPatients: -1, // unlimited
    maxAppointmentsPerMonth: -1,
    videoCallMinutes: -1,
    storageGB: -1,
    supportLevel: 'dedicated',
    features: [
      'Pacientes ilimitados',
      'Citas ilimitadas',
      'Videollamadas ilimitadas',
      'Almacenamiento ilimitado',
      'Múltiples profesionales en 1 cuenta',
      'Gestión de equipo y permisos',
      'API personalizada',
      'Integraciones avanzadas (EHR, facturación)',
      'Dashboard administrativo',
      'Cumplimiento HIPAA/GDPR garantizado',
      'Dominio personalizado',
      'Onboarding y capacitación personalizada',
      'Gerente de cuenta dedicado',
      'Soporte técnico 24/7/365',
      'SLA garantizado 99.9%'
    ],
    restrictions: []
  }
}

export const PLAN_PRICING = {
  GRATUITO: {
    name: 'Gratuito',
    price: 0,
    currency: 'EUR',
    billingPeriod: 'month',
    description: 'Perfecto para comenzar tu práctica',
    popular: false,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-700'
  },
  PRO: {
    name: 'Pro',
    price: 29,
    currency: 'EUR',
    billingPeriod: 'month',
    yearlyPrice: 290, // ~20% discount
    description: 'Para profesionales establecidos',
    popular: true,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600'
  },
  EMPRESA: {
    name: 'Empresa',
    price: null, // custom pricing
    currency: 'EUR',
    billingPeriod: 'month',
    description: 'Para clínicas y equipos grandes',
    popular: false,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    customPricing: true
  }
}

/**
 * Get plan details by type
 */
export const getPlanDetails = (planType) => {
  return {
    type: planType,
    ...PLAN_PRICING[planType],
    limits: PLAN_LIMITS[planType]
  }
}

/**
 * Check if user can perform action based on their plan
 */
export const canPerformAction = (userPlan, action, currentUsage) => {
  const limits = PLAN_LIMITS[userPlan]
  
  switch (action) {
    case 'add_patient':
      return limits.maxPatients === -1 || currentUsage.patients < limits.maxPatients
    case 'schedule_appointment':
      return limits.maxAppointmentsPerMonth === -1 || 
             currentUsage.appointmentsThisMonth < limits.maxAppointmentsPerMonth
    case 'start_video_call':
      return limits.videoCallMinutes === -1 || 
             currentUsage.videoMinutesThisMonth < limits.videoCallMinutes
    default:
      return true
  }
}

/**
 * Get upgrade recommendation based on current usage
 */
export const getUpgradeRecommendation = (currentPlan, usage) => {
  const limits = PLAN_LIMITS[currentPlan]
  const warnings = []

  if (limits.maxPatients !== -1 && usage.patients >= limits.maxPatients * 0.8) {
    warnings.push({
      type: 'patients',
      message: `Estás usando ${usage.patients} de ${limits.maxPatients} pacientes`,
      urgent: usage.patients >= limits.maxPatients
    })
  }

  if (limits.maxAppointmentsPerMonth !== -1 && 
      usage.appointmentsThisMonth >= limits.maxAppointmentsPerMonth * 0.8) {
    warnings.push({
      type: 'appointments',
      message: `Has usado ${usage.appointmentsThisMonth} de ${limits.maxAppointmentsPerMonth} citas este mes`,
      urgent: usage.appointmentsThisMonth >= limits.maxAppointmentsPerMonth
    })
  }

  if (limits.videoCallMinutes !== -1 && 
      usage.videoMinutesThisMonth >= limits.videoCallMinutes * 0.8) {
    warnings.push({
      type: 'video',
      message: `Has usado ${usage.videoMinutesThisMonth} de ${limits.videoCallMinutes} minutos de video`,
      urgent: usage.videoMinutesThisMonth >= limits.videoCallMinutes
    })
  }

  return {
    shouldUpgrade: warnings.some(w => w.urgent),
    warnings,
    recommendedPlan: currentPlan === PLAN_TYPES.GRATUITO ? PLAN_TYPES.PRO : PLAN_TYPES.EMPRESA
  }
}
