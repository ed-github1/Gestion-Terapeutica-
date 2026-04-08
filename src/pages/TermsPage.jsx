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

        {/* Index */}
        <motion.div
          className="mb-14 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-slate-900 mb-4">Índice</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
            <li>Aviso de Privacidad Integral</li>
            <li>Aviso de Privacidad Simplificado</li>
            <li>Consentimiento Expreso para Datos Sensibles</li>
            <li>Procedimiento ante Brecha de Seguridad</li>
            <li>Registro Interno de Tratamiento de Datos</li>
            <li>Matriz de Clasificación de Datos</li>
            <li className="font-semibold text-indigo-700">Cláusulas de Firma Electrónica</li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            Para los documentos 16 consulte la{' '}
            <Link to="/privacidad" className="text-blue-600 underline">Política de Privacidad</Link>.
          </p>
        </motion.div>

        {/* Section 7 */}
        <motion.section
          className="mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">7. Gobernanza y Responsabilidad Directiva</h2>
          <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
            <p>
              La Dirección ( Determinar por escrito quien será parte de ésta) reconoce la protección de datos como
              elemento estratégico del modelo de negocio. Se deberá establecer un Comité Interno de Protección de Datos
              que sesionará al menos una vez al año para evaluar riesgos, incidentes y cumplimiento.
            </p>
            <p>
              Las decisiones del Comité serán documentadas y archivadas como parte del sistema de cumplimiento.
            </p>
          </div>
        </motion.section>

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
