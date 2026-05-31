import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import BrandLogo from '@/shared/ui/BrandLogo';
import CookieConsentModal from '@/shared/ui/CookieConsentModal';
import {
  Video,
  CalendarCheck,
  Users,
  ShieldCheck,
  Activity,
  NotebookPen,
  Lock,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  Quote,
} from 'lucide-react';

// Expensive easing — slow out, used across the choreography.
const EASE = [0.16, 1, 0.3, 1];

// Subtle fade-up used everywhere — no perpetual motion, just a calm reveal.
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

// Hero entrance choreography — a parent stagger that reveals each block in sequence.
const heroStagger = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

// A child block rising into place.
const rise = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};

// A headline line sliding up from behind its clip mask.
const lineRise = {
  initial: { y: '115%' },
  animate: { y: 0, transition: { duration: 0.95, ease: EASE } },
};

// The product card assembles itself — rows slide in after the card lands.
const rowContainer = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } },
};
const rowRise = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Mouse-reactive parallax for the hero visual — gentle 3D tilt + layered depth.
  const heroRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.4 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [7, -7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-7, 7]);
  const cardShiftX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const cardShiftY = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  // The floating proof card sits "closer", so it parallaxes further.
  const proofShiftX = useTransform(sx, [-0.5, 0.5], [-26, 26]);
  const proofShiftY = useTransform(sy, [-0.5, 0.5], [-18, 18]);

  const handleHeroMove = (e) => {
    if (reduceMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetHeroMove = () => {
    mx.set(0);
    my.set(0);
  };

  const features = [
    {
      icon: Video,
      title: 'Videollamadas seguras',
      description: 'Sesiones en tiempo real con conexión encriptada de extremo a extremo. Sin instalar nada.',
    },
    {
      icon: CalendarCheck,
      title: 'Agenda que se cuida sola',
      description: 'Disponibilidad, recordatorios y reprogramaciones automáticas. Menos correos, más consulta.',
    },
    {
      icon: Users,
      title: 'Portal del paciente',
      description: 'Cada persona tiene su espacio: próximas citas, tareas y un diario entre sesiones.',
    },
    {
      icon: NotebookPen,
      title: 'Ficha clínica viva',
      description: 'Notas, resúmenes y evolución en un solo lugar, ordenados por sesión y siempre a mano.',
    },
    {
      icon: Activity,
      title: 'Seguimiento de progreso',
      description: 'Estados de ánimo, objetivos y avances visibles para ti y para tu paciente.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacidad por diseño',
      description: 'Cifrado en tránsito y en reposo. Tú decides quién accede a cada dato clínico.',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Crea tu cuenta',
      description: 'Configura tu perfil y tu disponibilidad en minutos. Sin tarjeta de crédito.',
    },
    {
      n: '02',
      title: 'Invita a tus pacientes',
      description: 'Cada uno recibe su acceso al portal y a las videollamadas con un enlace.',
    },
    {
      n: '03',
      title: 'Atiende y da seguimiento',
      description: 'Sesiones, notas y progreso conviven en un mismo expediente, sesión a sesión.',
    },
  ];

  const testimonials = [
    {
      name: 'Dra. María González',
      role: 'Psicóloga clínica',
      initials: 'MG',
      text: 'Reuní agenda, videollamada y ficha clínica en un mismo lugar. Dejé de saltar entre cinco herramientas.',
    },
    {
      name: 'Dr. Carlos Méndez',
      role: 'Terapeuta familiar',
      initials: 'CM',
      text: 'Las videollamadas simplemente funcionan. Mis pacientes entran con un enlace y la sesión empieza a tiempo.',
    },
    {
      name: 'Lic. Ana Torres',
      role: 'Psicoterapeuta',
      initials: 'AT',
      text: 'Los recordatorios y la reprogramación automática me devolvieron horas cada semana.',
    },
  ];

  const pricingPlans = [
    {
      key: 'professional',
      name: 'Profesional',
      price: '49',
      period: 'mes',
      description: 'Para terapeutas independientes.',
      features: [
        'Hasta 50 pacientes activos',
        'Videollamadas ilimitadas',
        'Agenda y recordatorios',
        'Portal de pacientes',
        'Ficha clínica completa',
        'Soporte prioritario',
      ],
      cta: 'Comenzar prueba gratuita',
      popular: false,
    },
    {
      key: 'clinic',
      name: 'Clínica',
      price: '149',
      period: 'mes',
      description: 'Para equipos de hasta 5 profesionales.',
      features: [
        'Pacientes ilimitados',
        'Varios profesionales',
        'Panel de clínica',
        'Reportes de actividad',
        'Onboarding acompañado',
        'Soporte 24/7',
      ],
      cta: 'Comenzar prueba gratuita',
      popular: true,
    },
    {
      key: 'enterprise',
      name: 'Instituciones',
      price: 'A medida',
      period: '',
      description: 'Para organizaciones y redes de atención.',
      features: [
        'Profesionales ilimitados',
        'Infraestructura dedicada',
        'Integraciones a medida',
        'SLA garantizado',
        'Gerente de cuenta',
        'Capacitación al equipo',
      ],
      cta: 'Hablar con nosotros',
      popular: false,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#FAF8F4] font-sans text-[#2A3338] antialiased selection:bg-[#0075C9]/15">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#ECE7DE] bg-[#FAF8F4]/85 backdrop-blur-md">
        <nav className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            <BrandLogo />

            <div className="hidden items-center gap-9 md:flex">
              <a href="#features" className="text-sm font-medium text-[#5C6B70] transition-colors hover:text-[#2A3338]">
                Características
              </a>
              <a href="#how" className="text-sm font-medium text-[#5C6B70] transition-colors hover:text-[#2A3338]">
                Cómo funciona
              </a>
              <a href="#pricing" className="text-sm font-medium text-[#5C6B70] transition-colors hover:text-[#2A3338]">
                Precios
              </a>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-[#5C6B70] transition-colors hover:text-[#2A3338]"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-full bg-[#0075C9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0065ae]"
              >
                Crear cuenta
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[#2A3338] transition-colors hover:bg-black/5 md:hidden"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-[#ECE7DE] py-4 md:hidden">
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Características', href: '#features' },
                  { label: 'Cómo funciona', href: '#how' },
                  { label: 'Precios', href: '#pricing' },
                ].map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5C6B70] hover:bg-black/5"
                  >
                    {label}
                  </a>
                ))}
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#5C6B70] hover:bg-black/5"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                  className="mt-2 rounded-full bg-[#0075C9] px-5 py-3 text-sm font-semibold text-white"
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMove}
        onMouseLeave={resetHeroMove}
        className="relative overflow-hidden"
      >
        {/* Static brand washes — ambient color, no per-frame repaint */}
        <div className="pointer-events-none absolute -right-40 -top-32 h-[36rem] w-[36rem] rounded-full bg-[#54C0E8]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 h-[28rem] w-[28rem] rounded-full bg-[#AEE058]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-24">
          <motion.div variants={heroStagger} initial="initial" animate="animate">
            <motion.div variants={rise} className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8a9498]">
              <motion.span
                className="h-px bg-[#C9C0B0]"
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
              />
              Para profesionales de salud mental
            </motion.div>

            <h1 className="mt-6 font-display text-[2.85rem] font-normal leading-[1.02] tracking-[-0.025em] text-[#2A3338] sm:text-[4.25rem]">
              <span className="block overflow-hidden pb-[0.05em]">
                <motion.span variants={lineRise} className="block">Tu práctica,</motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span variants={lineRise} className="block">
                  <span className="relative italic text-[#0075C9]">
                    reunida
                    <motion.span
                      className="absolute -bottom-0.5 left-0 h-[3px] w-full origin-left rounded-full bg-[#AEE058]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 1.15 }}
                    />
                  </span>{' '}
                  en un lugar.
                </motion.span>
              </span>
            </h1>

            <motion.p variants={rise} className="mt-7 max-w-md text-lg leading-relaxed text-[#5C6B70]">
              Agenda, videollamadas y ficha clínica conviven en un mismo expediente.
              Menos tareas administrativas, más tiempo para acompañar.
            </motion.p>

            <motion.div variants={rise} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#0075C9] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(0,117,201,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#0065ae] hover:shadow-[0_16px_34px_-12px_rgba(0,117,201,0.6)]"
              >
                Comenzar gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9D2C6] bg-white px-7 py-3.5 text-sm font-semibold text-[#2A3338] transition-all hover:-translate-y-0.5 hover:border-[#0075C9]/40 hover:shadow-sm"
              >
                Ya tengo cuenta
              </button>
            </motion.div>

            <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#5C6B70]">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#0075C9]" /> 14 días gratis
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#0075C9]" /> Sin tarjeta de crédito
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#0075C9]" /> Cancela cuando quieras
              </span>
            </motion.div>

            <motion.div variants={rise} className="mt-10 flex items-center gap-4 border-t border-[#ECE7DE] pt-7">
              <div className="flex -space-x-2.5">
                {[
                  { i: 'MG', c: '#0075C9' },
                  { i: 'CM', c: '#54C0E8' },
                  { i: 'AT', c: '#7FB52E' },
                  { i: 'JR', c: '#2A3338' },
                ].map((a) => (
                  <div
                    key={a.i}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FAF8F4] text-[10px] font-bold text-white"
                    style={{ backgroundColor: a.c }}
                  >
                    {a.i}
                  </div>
                ))}
              </div>
              <p className="text-sm leading-snug text-[#5C6B70]">
                Construido junto a<br className="hidden sm:block" /> profesionales de salud mental.
              </p>
            </motion.div>
          </motion.div>

          {/* Hero visual — an honest product snippet that assembles itself */}
          <motion.div
            className="relative [transform-style:preserve-3d]"
            style={reduceMotion ? undefined : { rotateX, rotateY, x: cardShiftX, y: cardShiftY, transformPerspective: 1100 }}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          >
            <div className="rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(42,51,56,0.28)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#9aa5a8]">Hoy</p>
                  <p className="font-display text-xl text-[#2A3338]">Agenda del día</p>
                </div>
                <span className="rounded-full bg-[#AEE058]/20 px-3 py-1 text-xs font-semibold text-[#5b7d12]">4 sesiones</span>
              </div>

              <motion.div className="mt-5 space-y-3" variants={rowContainer} initial="initial" animate="animate">
                {[
                  { time: '09:00', name: 'Lucía Fernández', tag: 'Videollamada', accent: '#0075C9', live: true },
                  { time: '11:30', name: 'Diego Ramírez', tag: 'Presencial', accent: '#54C0E8', live: false },
                  { time: '16:00', name: 'Sofía Martín', tag: 'Videollamada', accent: '#0075C9', live: false },
                ].map((s) => (
                  <motion.div
                    key={s.time}
                    variants={rowRise}
                    className="flex items-center gap-3 rounded-xl border border-[#F0ECE3] bg-[#FCFBF8] p-3"
                  >
                    <div className="w-12 shrink-0 text-sm font-semibold text-[#2A3338]">{s.time}</div>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: s.accent }}
                    >
                      {s.name.split(' ').map((p) => p[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#2A3338]">{s.name}</p>
                      <p className="text-xs text-[#8a9498]">{s.tag}</p>
                    </div>
                    {s.live ? (
                      <span className="relative inline-flex items-center gap-1.5 rounded-full bg-[#0075C9] px-2.5 py-1 text-xs font-semibold text-white">
                        {!reduceMotion && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-[#0075C9]"
                            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                          />
                        )}
                        <Video className="relative h-3 w-3" /> <span className="relative">Unirse</span>
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#D9D2C6]" />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Floating proof card — parallaxes closer, drifts gently */}
            <motion.div
              className="absolute -bottom-5 -left-4 hidden rounded-xl border border-[#ECE7DE] bg-white p-3.5 shadow-[0_18px_40px_-22px_rgba(42,51,56,0.3)] sm:block"
              style={reduceMotion ? undefined : { x: proofShiftX, y: proofShiftY, translateZ: 40 }}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 1, ease: EASE }}
            >
              <motion.div
                className="flex items-center gap-3"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#AEE058]/20">
                  <ShieldCheck className="h-5 w-5 text-[#5b7d12]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2A3338]">Cifrado activo</p>
                  <p className="text-xs text-[#8a9498]">Extremo a extremo</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip — honest signals, no fabricated logos */}
      <section className="border-y border-[#ECE7DE] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-6 py-10 sm:grid-cols-4">
          {[
            { k: '100%', v: 'Sesiones encriptadas' },
            { k: '5 min', v: 'Para empezar' },
            { k: '24/7', v: 'Acceso al portal' },
            { k: '0', v: 'Costo de instalación' },
          ].map((s) => (
            <div key={s.v} className="px-2 text-center">
              <div className="font-display text-3xl text-[#0075C9]">{s.k}</div>
              <div className="mt-1 text-sm text-[#5C6B70]">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <motion.div {...fadeUp} className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0075C9]">Todo en uno</p>
          <h2 className="mt-3 font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-[#2A3338] sm:text-5xl">
            Las herramientas de tu consulta, sin las costuras.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5C6B70]">
            Pensado específicamente para la práctica de salud mental: cada parte conversa con la siguiente.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[#ECE7DE] bg-[#ECE7DE] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
              key={feature.title}
              className="group bg-white p-8 transition-colors hover:bg-[#FCFBF8]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0075C9]/8 text-[#0075C9] transition-colors group-hover:bg-[#0075C9] group-hover:text-white">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#2A3338]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5C6B70]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-[#ECE7DE] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0075C9]">Cómo funciona</p>
            <h2 className="mt-3 font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-[#2A3338] sm:text-5xl">
              De registrarte a tu primera sesión, en una tarde.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} key={step.n}>
                <div className="font-display text-5xl text-[#54C0E8]">{step.n}</div>
                <div className="mt-4 h-px w-12 bg-[#E2DCD0]" />
                <h3 className="mt-4 text-xl font-semibold text-[#2A3338]">{step.title}</h3>
                <p className="mt-2 text-[#5C6B70]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <motion.div {...fadeUp} className="flex items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0075C9]">Testimonios</p>
            <h2 className="mt-3 font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-[#2A3338] sm:text-5xl">
              Hecho para el día a día clínico.
            </h2>
          </div>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              key={t.name}
              className="flex flex-col rounded-2xl border border-[#ECE7DE] bg-white p-7"
            >
              <Quote className="h-7 w-7 text-[#AEE058]" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-[#3a464b]">
                “{t.text}”
              </blockquote>
              <div className="mt-6 flex items-center gap-1 text-[#f0a500]">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-[#F0ECE3] pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0075C9]/10 text-sm font-bold text-[#0075C9]">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2A3338]">{t.name}</div>
                  <div className="text-xs text-[#8a9498]">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[#ECE7DE] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0075C9]">Precios</p>
            <h2 className="mt-3 font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-[#2A3338] sm:text-5xl">
              Un plan que crece contigo.
            </h2>
            <p className="mt-5 text-lg text-[#5C6B70]">
              Empieza con 14 días gratis. Sin permanencia, cancela cuando quieras.
            </p>
          </motion.div>

          <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                key={plan.key}
                className={`flex flex-col rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-[#0075C9] bg-[#0075C9] text-white shadow-[0_30px_70px_-30px_rgba(0,117,201,0.6)]'
                    : 'border-[#ECE7DE] bg-[#FCFBF8]'
                }`}
              >
                {plan.popular && (
                  <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#AEE058] px-3 py-1 text-xs font-bold text-[#33480a]">
                    Más elegido
                  </span>
                )}
                <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-[#2A3338]'}`}>{plan.name}</h3>
                <p className={`mt-1 text-sm ${plan.popular ? 'text-white/75' : 'text-[#5C6B70]'}`}>{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {plan.price !== 'A medida' && (
                    <span className={`text-xl ${plan.popular ? 'text-white/80' : 'text-[#5C6B70]'}`}>$</span>
                  )}
                  <span className="font-display text-5xl tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm ${plan.popular ? 'text-white/75' : 'text-[#5C6B70]'}`}>/{plan.period}</span>
                  )}
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className={`mt-7 rounded-full py-3 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-white text-[#0075C9] hover:bg-[#f1f6fb]'
                      : 'bg-[#0075C9] text-white hover:bg-[#0065ae]'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? 'text-[#AEE058]' : 'text-[#0075C9]'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-[#3a464b]'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#5C6B70]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0075C9]" /> Garantía de 30 días
            </span>
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#0075C9]" /> Pago seguro
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl border border-[#ECE7DE] bg-[#2A3338] px-8 py-16 text-center sm:px-16"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#54C0E8]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#AEE058]/15 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-white sm:text-5xl">
              Dale a tu consulta el espacio que merece.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Prueba TotalMente gratis durante 14 días. Sin tarjeta, sin compromiso.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#2A3338] transition-transform hover:scale-[1.02]"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ECE7DE] bg-[#FAF8F4]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <BrandLogo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5C6B70]">
                La plataforma todo-en-uno para profesionales de salud mental. Acompaña, transforma, gestiona.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#2A3338]">Producto</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {['Características', 'Cómo funciona', 'Precios'].map((item) => (
                  <li key={item}>
                    <a href="#features" className="text-[#5C6B70] transition-colors hover:text-[#0075C9]">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#2A3338]">Empresa</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: 'Términos', href: '/terminos' },
                  { label: 'Privacidad', href: '/privacidad' },
                  { label: 'Cookies', href: '/cookies' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-[#5C6B70] transition-colors hover:text-[#0075C9]">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#2A3338]">Comenzar</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <button onClick={() => navigate('/register')} className="text-[#5C6B70] transition-colors hover:text-[#0075C9]">
                    Crear cuenta
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="text-[#5C6B70] transition-colors hover:text-[#0075C9]">
                    Iniciar sesión
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#ECE7DE] pt-8 text-sm text-[#8a9498] sm:flex-row">
            <p>© 2026 TotalMente. Todos los derechos reservados.</p>
            <p className="inline-flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Privacidad por diseño
            </p>
          </div>
        </div>
      </footer>

      <CookieConsentModal />
    </div>
  );
};

export default LandingPage;
