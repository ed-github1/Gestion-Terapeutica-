import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Shield } from 'lucide-react'
import BrandLogo from '@/shared/ui/BrandLogo'

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <BrandLogo fullLogo size="h-9 w-auto" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600">
              <Shield className="w-6 h-6 text-white" />
            </span>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">TotalMente</p>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Política de Privacidad
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="prose prose-sm max-w-none"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="space-y-6 text-slate-700">
            <p className="text-base leading-relaxed">
              TotalMente respeta tu privacidad y está comprometida con la protección de tus datos personales.
              De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP),
              tratamos tu información de forma responsable. Los datos que recopilamos, incluyendo información de salud mental,
              se utilizan únicamente para proporcionar nuestros servicios de conexión entre pacientes y profesionales terapéuticos,
              gestionar tu cuenta y cumplir con obligaciones legales. Implementamos medidas de seguridad técnicas, administrativas
              y físicas para proteger tu información contra acceso no autorizado.
            </p>
            <p className="text-base leading-relaxed">
              Tienes derecho a acceder, rectificar, cancelar u oponerme al tratamiento de tus datos personales (derechos ARCO)
              en cualquier momento. Si tienes preguntas sobre cómo tratamos tu información o deseas ejercer estos derechos,
              puedes contactarnos a través de los canales indicados en la plataforma. No compartimos tus datos con terceros
              sin tu consentimiento, excepto cuando es requerido por ley o para proporcionar los servicios solicitados.
              Esta política se revisa regularmente para asegurar cumplimiento con la normativa aplicable.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 TotalMente. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link to="/terminos" className="hover:text-blue-600 transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-blue-600 transition-colors font-medium text-blue-600">Privacidad</Link>
            <Link to="/cookies" className="hover:text-blue-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicyPage
