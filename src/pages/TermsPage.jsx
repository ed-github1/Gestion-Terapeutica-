import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, FileText } from 'lucide-react'
import BrandLogo from '@/shared/ui/BrandLogo'

const TermsPage = () => {
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
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600">
              <FileText className="w-6 h-6 text-white" />
            </span>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">TotalMente</p>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Términos y Condiciones
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
              Al acceder y utilizar la plataforma TotalMente, aceptas estos Términos y Condiciones. TotalMente es un servicio
              de conexión entre pacientes y profesionales de la salud mental que facilita la búsqueda, reserva y realización de
              sesiones terapéuticas. Los usuarios son responsables de proporcionar información precisa y actualizada en sus cuentas.
              Nos reservamos el derecho de suspender o cancelar cuentas que violen nuestras políticas o que realicen actividades
              ilegales. Los servicios se proporcionan bajo una base "tal cual", sin garantías explícitas, aunque trabajamos
              continuamente para mejorar su calidad y confiabilidad.
            </p>
            <p className="text-base leading-relaxed">
              Como usuario, aceptas que eres el único responsable de mantener la confidencialidad de tu cuenta y tus credenciales.
              TotalMente no se responsabiliza por el contenido intercambiado durante las sesiones terapéuticas, aunque se compromete
              a proteger la privacidad de esta información conforme a la ley aplicable. Los profesionales que utilizan la plataforma
              son responsables de proporcionar servicios conforme a sus obligaciones legales y profesionales. El acceso no autorizado,
              la reproducción no autorizada de contenido, o el incumplimiento de estos términos puede resultar en acciones legales.
              Para cualquier pregunta o disputa, contáctanos a través de los canales de soporte disponibles en la plataforma.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p> 2026 TotalMente. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link to="/terminos" className="hover:text-blue-600 transition-colors font-medium text-blue-600">Términos</Link>
            <Link to="/privacidad" className="hover:text-blue-600 transition-colors">Privacidad</Link>
            <Link to="/cookies" className="hover:text-blue-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsPage
