import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Shield, FileText, Lock, AlertTriangle, ClipboardList, BarChart2, Users } from 'lucide-react'
import BrandLogo from '@/shared/ui/BrandLogo'

const Section = ({ id, icon: Icon, title, children }) => (
  <motion.section
    id={id}
    className="mb-14 scroll-mt-24"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100">
          <Icon className="w-5 h-5 text-blue-600" />
        </span>
      )}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
    <div className="text-slate-700 leading-relaxed space-y-3 text-sm">
      {children}
    </div>
  </motion.section>
)

const toc = [
  { id: 'aviso-integral', label: '1. Aviso de Privacidad Integral' },
  { id: 'aviso-simplificado', label: '2. Aviso de Privacidad Simplificado' },
  { id: 'consentimiento-sensibles', label: '3. Consentimiento Expreso para Datos Sensibles' },
  { id: 'brecha-seguridad', label: '4. Procedimiento ante Brecha de Seguridad' },
  { id: 'registro-interno', label: '5. Registro Interno de Tratamiento' },
  { id: 'matriz-clasificacion', label: '6. Matriz de Clasificación de Datos' },
  { id: 'gobernanza', label: '7. Gobernanza y Responsabilidad Directiva' },
]

const PrivacyPolicyPage = () => {
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
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:grid lg:grid-cols-[260px_1fr] lg:gap-16">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Contenido</p>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">Última actualización</p>
              <p className="text-xs text-blue-600">2 de marzo de 2026</p>
              <p className="text-xs text-blue-600 mt-2">
                Conforme a la <strong>LFPDPPP</strong> y su Reglamento.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main>
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
                  Expediente Legal Integral
                </h1>
              </div>
            </div>
            <p className="text-slate-600 font-medium mt-1">
              Paquete de Cumplimiento en Protección de Datos Personales en Posesión de Particulares
            </p>
            <p className="text-slate-500 text-sm mt-1">Plataforma Digital "TotalMente"</p>
          </motion.div>

          {/* 1 */}
          <Section id="aviso-integral" icon={Shield} title="1. Aviso de Privacidad Integral">
            <p>
              Emitido conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
              (LFPDPPP), su Reglamento y Lineamientos aplicables.
            </p>
            <p>
              El responsable de la plataforma declara que tratará datos personales y datos personales sensibles relativos
              al estado de salud mental conforme a los principios de licitud, consentimiento, información, calidad,
              finalidad, lealtad, proporcionalidad y responsabilidad.
            </p>
            <p>Se implementan medidas de seguridad administrativas, técnicas y físicas conforme al artículo 19 de la LFPDPPP.</p>
            <p>El titular podrá ejercer derechos ARCO conforme a los artículos 22 al 27 de la LFPDPPP.</p>
          </Section>

          {/* 2 */}
          <Section id="aviso-simplificado" icon={FileText} title="2. Aviso de Privacidad Simplificado">
            <p>La plataforma es responsable del tratamiento de sus datos personales y datos sensibles.</p>
            <p>Las finalidades principales incluyen la gestión de cuenta, conexión con profesionales y cumplimiento legal.</p>
            <p>Consulte el Aviso de Privacidad Integral para información completa.</p>
          </Section>

          {/* 3 */}
          <Section id="consentimiento-sensibles" icon={Lock} title="3. Consentimiento Expreso para el Tratamiento de Datos Personales Sensibles">
            <p>
              <strong>Fundamento Legal:</strong> Artículo 9 de la LFPDPPP y artículos 15, 16 y correlativos de su Reglamento.
            </p>
            <p>
              <strong>Naturaleza del Consentimiento:</strong> Tratándose de datos personales sensibles relativos al estado
              de salud mental, diagnósticos, antecedentes clínicos y cualquier información derivada de la interacción
              terapéutica, el consentimiento deberá ser expreso, específico, informado y verificable.
            </p>
            <p><strong>Procedimiento de Obtención del Consentimiento:</strong></p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Presentación previa del Aviso de Privacidad Integral en formato accesible y descargable.</li>
              <li>Visualización obligatoria de cláusula destacada sobre tratamiento de datos sensibles.</li>
              <li>Aceptación mediante mecanismo electrónico verificable (checkbox no pre-marcado + botón de confirmación).</li>
              <li>Registro automático en logs del sistema con fecha, hora, IP, dispositivo y versión del documento aceptado.</li>
              <li>Generación de evidencia digital almacenada de forma cifrada.</li>
              <li>Posibilidad de revocación del consentimiento mediante mecanismo digital accesible.</li>
              <li>Conservación de evidencia del consentimiento durante la vigencia de la relación jurídica y periodo legal aplicable.</li>
            </ol>
          </Section>

          {/* 4 */}
          <Section id="brecha-seguridad" icon={AlertTriangle} title="4. Procedimiento ante Brecha de Seguridad de Datos Personales">
            <p>
              <strong>Fundamento Legal:</strong> Artículos 19 y 20 de la LFPDPPP; obligación de implementar medidas de
              seguridad y notificar vulneraciones que afecten significativamente derechos patrimoniales o morales.
            </p>

            <p className="font-semibold text-slate-800">Fase I – Identificación y Contención Inmediata:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Activación del protocolo interno por el Responsable de Seguridad de la Información.</li>
              <li>Aislamiento del sistema comprometido.</li>
              <li>Preservación de evidencia técnica.</li>
            </ol>

            <p className="font-semibold text-slate-800">Fase II – Evaluación del Incidente:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Determinación del tipo de datos comprometidos.</li>
              <li>Evaluación del volumen y alcance de la afectación.</li>
              <li>Análisis de riesgo para titulares (alto, medio o bajo).</li>
            </ol>

            <p className="font-semibold text-slate-800">Fase III – Notificación:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Notificación a titulares cuando la afectación sea significativa.</li>
              <li>Comunicación clara indicando naturaleza del incidente, datos comprometidos y medidas adoptadas.</li>
              <li>Recomendaciones para mitigación de riesgos.</li>
            </ol>

            <p className="font-semibold text-slate-800">Fase IV – Medidas Correctivas y Preventivas:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Corrección de vulnerabilidades.</li>
              <li>Actualización de controles técnicos.</li>
              <li>Reentrenamiento del personal si aplica.</li>
              <li>Registro documentado del incidente para auditoría interna.</li>
            </ol>
          </Section>

          {/* 5 */}
          <Section id="registro-interno" icon={ClipboardList} title="5. Registro Interno de Tratamiento de Datos Personales">
            <p>
              <strong>Fundamento Legal:</strong> Principio de Responsabilidad (Accountability) previsto en el artículo 14
              de la LFPDPPP.
            </p>
            <p><strong>Contenido mínimo del Registro:</strong></p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Identificación del Responsable y Encargados.</li>
              <li>Categorías de datos tratados (identificación, contacto, financieros, sensibles).</li>
              <li>Finalidades específicas del tratamiento.</li>
              <li>Transferencias nacionales e internacionales.</li>
              <li>Plazos de conservación.</li>
              <li>Descripción de medidas de seguridad implementadas.</li>
              <li>Base jurídica del tratamiento.</li>
              <li>Registro de incidentes y evaluaciones periódicas.</li>
            </ol>
            <p>
              El Registro deberá actualizarse cuando exista modificación sustancial en las finalidades, categorías de
              datos o medidas de seguridad.
            </p>
          </Section>

          {/* 6 */}
          <Section id="matriz-clasificacion" icon={BarChart2} title="6. Matriz de Clasificación y Gestión de Riesgos de Datos Personales">
            <p><strong>Objetivo:</strong> Clasificar los datos conforme a su nivel de sensibilidad y riesgo asociado.</p>

            <p><strong>Clasificación:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nivel Básico – Datos de identificación general.</li>
              <li>Nivel Medio – Datos financieros y de pago.</li>
              <li>Nivel Alto – Datos personales sensibles relativos a la salud mental.</li>
            </ul>

            <p><strong>Medidas Asociadas por Nivel:</strong></p>

            <p className="font-medium text-slate-800">Nivel Básico:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Control de acceso lógico.</li>
              <li>Respaldo periódico.</li>
            </ul>

            <p className="font-medium text-slate-800">Nivel Medio:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cifrado en tránsito (SSL/TLS).</li>
              <li>Restricción por roles.</li>
              <li>Monitoreo de accesos.</li>
            </ul>

            <p className="font-medium text-slate-800">Nivel Alto:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cifrado en reposo (AES-256 o equivalente).</li>
              <li>Autenticación multifactor.</li>
              <li>Registro detallado de auditoría.</li>
              <li>Evaluación periódica de vulnerabilidades.</li>
              <li>Control estricto de acceso bajo principio de mínima intervención.</li>
            </ul>

            <p>
              La Matriz deberá revisarse al menos una vez al año o cuando se modifique el modelo de negocio o arquitectura
              tecnológica.
            </p>
          </Section>

          {/* 7 */}
          <Section id="gobernanza" icon={Users} title="7. Gobernanza y Responsabilidad Directiva">
            <p>
              La Dirección (Determinar por escrito quién será parte de ésta) reconoce la protección de datos como elemento
              estratégico del modelo de negocio. Se deberá establecer un Comité Interno de Protección de Datos que
              sesionará al menos una vez al año para evaluar riesgos, incidentes y cumplimiento.
            </p>
            <p>
              Las decisiones del Comité serán documentadas y archivadas como parte del sistema de cumplimiento.
            </p>
          </Section>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-6 mt-4">
            <p className="text-xs text-slate-400">
              Expediente Legal Integral — Paquete de Cumplimiento en Protección de Datos Personales en Posesión de
              Particulares. Plataforma Digital "TotalMente". Confidencial – Uso exclusivo del Cliente. Fecha: 2 de marzo de 2026.
            </p>
          </div>
        </main>
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
