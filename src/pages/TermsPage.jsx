import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import BrandLogo from '@/shared/ui/BrandLogo'

const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <BrandLogo fullLogo size="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer print:hidden"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors print:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
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
                Expediente Legal Integral
              </h1>
            </div>
          </div>
          <p className="text-slate-600 font-medium">
            Paquete de Cumplimiento en Protección de Datos Personales en Posesión de Particulares
          </p>
          <p className="text-slate-500 text-sm">Plataforma Digital "TotalMente"</p>
        </motion.div>



        {/* Footer note */}
        <div className="border-t border-slate-200 pt-6 mt-4">
          <p className="text-xs text-slate-400">
            Expediente Legal Integral  Paquete de Cumplimiento en Protección de Datos Personales en Posesión de
            Particulares. Plataforma Digital "TotalMente". Confidencial  Uso exclusivo del Cliente. Fecha: 2 de marzo de 2026.
          </p>
        </div>
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
