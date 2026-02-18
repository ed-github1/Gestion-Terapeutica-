import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  Calendar, 
  Users, 
  Lock, 
  TrendingUp, 
  Heart,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  MessageCircle,
  Zap
} from 'lucide-react';

const LandingPage = () => {
  const [activePricing, setActivePricing] = useState('professional');
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Video,
      title: 'Videollamadas Seguras',
      description: 'Sesiones de terapia en tiempo real con conexión WebRTC encriptada de extremo a extremo.',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: Calendar,
      title: 'Gestión Inteligente',
      description: 'Agenda automática con recordatorios SMS y sincronización en tiempo real.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Portal de Pacientes',
      description: 'Espacio personalizado para cada paciente con historial clínico y progreso terapéutico.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Lock,
      title: 'Cumplimiento Total',
      description: 'Certificación HIPAA y protección de datos conforme a normativas internacionales.',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Análisis de Progreso',
      description: 'Seguimiento visual del progreso terapéutico con métricas y reportes avanzados.',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: MessageCircle,
      title: 'Diario Terapéutico',
      description: 'Herramienta de registro emocional para pacientes entre sesiones.',
      gradient: 'from-indigo-500 to-violet-500'
    }
  ];

  const testimonials = [
    {
      name: 'Dra. María González',
      role: 'Psicóloga Clínica',
      image: 'MG',
      rating: 5,
      text: 'Totalmente transformó mi práctica. Ahora puedo atender a más pacientes sin sacrificar la calidad del cuidado.',
      gradient: 'from-violet-100 to-purple-100'
    },
    {
      name: 'Dr. Carlos Méndez',
      role: 'Terapeuta Familiar',
      image: 'CM',
      rating: 5,
      text: 'La integración de videollamadas es perfecta. Mis pacientes adoran la flexibilidad y yo la facilidad de uso.',
      gradient: 'from-blue-100 to-cyan-100'
    },
    {
      name: 'Lic. Ana Torres',
      role: 'Psicoterapeuta',
      image: 'AT',
      rating: 5,
      text: 'El sistema de gestión de citas me ahorra 10 horas semanales. Ahora me enfoco en lo que importa: mis pacientes.',
      gradient: 'from-emerald-100 to-teal-100'
    }
  ];

  const pricingPlans = {
    professional: {
      name: 'Profesional',
      price: '49',
      period: 'mes',
      description: 'Ideal para terapeutas independientes',
      features: [
        'Hasta 50 pacientes activos',
        'Videollamadas ilimitadas',
        'Agenda inteligente',
        'Portal de pacientes',
        'Historial clínico completo',
        'Soporte prioritario'
      ],
      cta: 'Comenzar prueba gratuita',
      popular: false
    },
    clinic: {
      name: 'Clínica',
      price: '149',
      period: 'mes',
      description: 'Para equipos de hasta 5 profesionales',
      features: [
        'Pacientes ilimitados',
        'Multi-profesional',
        'Dashboard de clínica',
        'Análisis avanzados',
        'API personalizada',
        'Onboarding dedicado',
        'Soporte 24/7'
      ],
      cta: 'Solicitar demo',
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Soluciones para instituciones',
      features: [
        'Profesionales ilimitados',
        'Infraestructura dedicada',
        'Personalización total',
        'Integraciones custom',
        'SLA garantizado',
        'Gerente de cuenta',
        'Capacitación on-site'
      ],
      cta: 'Contactar ventas',
      popular: false
    }
  };

  const stats = [
    { value: '12,000+', label: 'Sesiones realizadas' },
    { value: '850+', label: 'Profesionales activos' },
    { value: '99.9%', label: 'Uptime garantizado' },
    { value: '4.9/5', label: 'Calificación promedio' }
  ];

  const companyLogos = ['Harvard', 'Stanford', 'Mayo Clinic', 'Johns Hopkins', 'UCLA', 'MIT'];

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-violet-50/30 to-blue-50 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-linear-to-br from-violet-300/40 to-purple-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 w-80 h-80 bg-linear-to-br from-blue-300/40 to-cyan-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-96 h-96 bg-linear-to-br from-emerald-300/40 to-teal-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 40, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-200/60 backdrop-blur-xl bg-white/70">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-linear-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                TotalMente
              </span>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="#features" className="text-slate-700 hover:text-violet-600 transition-colors font-medium">
                Características
              </a>
              <a href="#testimonials" className="text-slate-700 hover:text-violet-600 transition-colors font-medium">
                Testimonios
              </a>
              <a href="#pricing" className="text-slate-700 hover:text-violet-600 transition-colors font-medium">
                Precios
              </a>
              <button className="text-slate-700 hover:text-violet-600 transition-colors font-medium">
                Iniciar Sesión
              </button>
              <motion.button 
                className="px-6 py-2.5 bg-linear-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Comenzar Gratis
              </motion.button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-100 to-purple-100 rounded-full mb-6 border border-violet-200/60"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">
                Plataforma #1 en gestión terapéutica
              </span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-linear-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Transforma
              </span>
              <br />
              <span className="text-slate-900">
                tu práctica terapéutica
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              La plataforma todo-en-uno que profesionales de salud mental confían para gestionar sus sesiones, pacientes y crecimiento profesional.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <motion.button
                className="group px-8 py-4 bg-linear-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Prueba gratuita de 14 días
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl font-semibold border-2 border-slate-200 hover:border-violet-300 hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Ver demo en vivo
                <Video className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Configuración en 5 minutos</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Main Dashboard Mockup */}
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
                <div className="bg-linear-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  </div>
                  <div className="flex-1 mx-4 bg-white/20 rounded-lg px-4 py-1 text-white/60 text-sm">
                    dashboard.totalmentegestion.com
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-linear-to-r from-slate-200 to-slate-100 rounded-lg"></div>
                    <div className="h-8 w-24 bg-linear-to-r from-violet-200 to-purple-200 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="bg-linear-to-br from-slate-50 to-violet-50/30 rounded-2xl p-4 border border-slate-200/60"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      >
                        <div className="h-6 w-6 bg-linear-to-br from-violet-400 to-purple-400 rounded-lg mb-3"></div>
                        <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
                        <div className="h-5 w-12 bg-linear-to-r from-slate-300 to-slate-200 rounded"></div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-200/60"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                      >
                        <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-400 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2.5 w-24 bg-slate-200 rounded"></div>
                          <div className="h-2 w-32 bg-slate-100 rounded"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-4 backdrop-blur-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">+32%</div>
                    <div className="text-sm text-slate-600">Más pacientes</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Notification */}
              <motion.div
                className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-4 backdrop-blur-xl"
                animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Sesión completada</div>
                    <div className="text-xs text-slate-600">Hace 2 minutos</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl lg:text-5xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trusted By Section */}
      <section className="relative z-10 py-12 bg-white/60 backdrop-blur-xl border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium tracking-wider uppercase">
            Confiado por instituciones líderes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {companyLogos.map((logo, index) => (
              <motion.div
                key={index}
                className="text-2xl font-bold text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.1 }}
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-100 to-purple-100 rounded-full mb-6 border border-violet-200/60">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">
              Potencia tu práctica
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Todo lo que necesitas
            </span>
            <br />
            <span className="text-slate-900">en una plataforma</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Herramientas diseñadas específicamente para profesionales de salud mental
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 hover:border-violet-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`w-14 h-14 bg-linear-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-32 bg-linear-to-br from-violet-50 to-purple-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-6 border border-violet-200/60 shadow-lg">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-violet-700">
                5.0 en todas las reseñas
              </span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="text-slate-900">Amado por </span>
              <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                profesionales
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Miles de terapeutas han transformado su práctica con TotalMente
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className={`bg-linear-to-br ${testimonial.gradient} backdrop-blur-sm rounded-3xl p-8 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-100 to-teal-100 rounded-full mb-6 border border-emerald-200/60">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              14 días gratis, cancela cuando quieras
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            <span className="text-slate-900">Planes que </span>
            <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              se adaptan a ti
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Comienza gratis y escala según tu práctica crece
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(pricingPlans).map(([key, plan], index) => (
            <motion.div
              key={key}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular
                  ? 'border-violet-500 shadow-2xl scale-105 z-10'
                  : 'border-slate-200/60 hover:border-violet-300'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-linear-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Más popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  {plan.price !== 'Personalizado' && <span className="text-slate-600 text-2xl">$</span>}
                  <span className="text-5xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-slate-600">/{plan.period}</span>}
                </div>
              </div>

              <motion.button
                className={`w-full py-4 rounded-2xl font-semibold mb-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.cta}
              </motion.button>

              <div className="space-y-4">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-slate-600 mb-4">
            ¿Necesitas más información? <a href="#" className="text-violet-600 font-semibold hover:underline">Compara todos los planes</a>
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Garantía de devolución 30 días</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Pago seguro SSL</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-32 max-w-5xl mx-auto px-6">
        <motion.div
          className="relative bg-linear-to-br from-violet-600 via-purple-600 to-blue-600 rounded-[3rem] p-12 lg:p-16 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative text-center">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                Oferta limitada - Solo quedan 12 espacios
              </span>
            </motion.div>

            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Comienza a transformar
              <br />
              tu práctica hoy
            </h2>

            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Únete a cientos de profesionales que ya están brindando mejor atención con menos esfuerzo administrativo
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-6 py-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-80"
              />
              <motion.button
                className="px-8 py-4 bg-white text-violet-600 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Comenzar gratis
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>14 días de prueba</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Configuración inmediata</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/60 backdrop-blur-xl py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  TotalMente
                </span>
              </div>
              <p className="text-slate-600 mb-4">
                La plataforma todo-en-uno para profesionales de salud mental.
              </p>
              <div className="flex gap-3">
                {['tw', 'fb', 'in', 'ig'].map((social) => (
                  <motion.div
                    key={social}
                    className="w-10 h-10 bg-slate-100 hover:bg-linear-to-br hover:from-violet-600 hover:to-purple-600 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg group"
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    <span className="text-slate-600 group-hover:text-white font-bold text-xs uppercase">
                      {social}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Producto</h4>
              <ul className="space-y-3">
                {['Características', 'Precios', 'Integraciones', 'Demo', 'Roadmap'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Recursos</h4>
              <ul className="space-y-3">
                {['Blog', 'Guías', 'Centro de ayuda', 'Webinars', 'Comunidad'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Empresa</h4>
              <ul className="space-y-3">
                {['Nosotros', 'Contacto', 'Carreras', 'Legal', 'Privacidad'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              © 2026 TotalMente. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                Términos
              </a>
              <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-slate-600 hover:text-violet-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

