import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, BarChart2, Cookie, Download, Settings, Shield, ToggleRight } from 'lucide-react'
import BrandLogo from '@/shared/ui/BrandLogo'
const Section = ({ id, icon: Icon, title, children }) => (
  <motion.section
    id={id}
    className="mb-12 scroll-mt-24"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center gap-3 mb-4">
      {Icon && (
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <Icon className="w-5 h-5 text-emerald-600" />
        </span>
      )}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
    <div className="text-slate-600 leading-relaxed space-y-3 text-sm">
      {children}
    </div>
  </motion.section>
)

const toc = [
  { id: 'que-es', label: '¿Qué son las cookies?' },
  { id: 'tipos', label: 'Tipos de cookies que usamos' },
  { id: 'necesarias', label: 'Cookies estrictamente necesarias' },
  { id: 'funcionales', label: 'Cookies funcionales' },
  { id: 'analiticas', label: 'Cookies analíticas' },
  { id: 'gestion', label: 'Gestión de cookies' },
  { id: 'terceros', label: 'Cookies de terceros' },
  { id: 'actualizaciones', label: 'Actualizaciones' },
]

const CookiesPage = () => {
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
                  className="block text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold mb-1">Última actualización</p>
              <p className="text-xs text-emerald-600">2 de marzo de 2026</p>
              <p className="text-xs text-emerald-600 mt-2">
                Puede gestionar sus preferencias de cookies en cualquier momento.
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
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600">
                <Cookie className="w-6 h-6 text-white" />
              </span>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">TotalMente</p>
                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                  Política de Cookies
                </h1>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-2">
              Esta política explica cómo TotalMente utiliza cookies y tecnologías similares para garantizar el
              funcionamiento de la plataforma, recordar sus preferencias y mejorar su experiencia.
            </p>
          </motion.div>

          {/* 1 */}
          <Section id="que-es" icon={Cookie} title="1. ¿Qué son las cookies?">
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador o dispositivo al
              visitarlos. Contienen información que permite al sitio reconocerle en visitas posteriores, recordar sus
              preferencias y garantizar el correcto funcionamiento de determinadas funciones.
            </p>
            <p>
              Además de las cookies, TotalMente puede utilizar tecnologías similares como el almacenamiento local del
              navegador (<em>localStorage</em>) y <em>sessionStorage</em> para almacenar información de sesión de forma
              segura en su dispositivo.
            </p>
          </Section>

          {/* 2 */}
          <Section id="tipos" icon={ToggleRight} title="2. Resumen de tipos de cookies que usamos">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Finalidad</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Duración</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Obligatoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-700">Estrictamente necesarias</td>
                    <td className="px-4 py-3 text-slate-500">Autenticación, sesión, seguridad CSRF</td>
                    <td className="px-4 py-3 text-slate-500">Sesión / 30 días</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Sí</span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">Funcionales</td>
                    <td className="px-4 py-3 text-slate-500">Preferencias de idioma, modo oscuro, configuración UI</td>
                    <td className="px-4 py-3 text-slate-500">1 año</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Opcional</span>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-700">Analíticas</td>
                    <td className="px-4 py-3 text-slate-500">Estadísticas de uso anónimas para mejorar la plataforma</td>
                    <td className="px-4 py-3 text-slate-500">2 años</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Opcional</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 3 */}
          <Section id="necesarias" icon={Shield} title="3. Cookies estrictamente necesarias">
            <p>
              Estas cookies son <strong>imprescindibles para el funcionamiento de la plataforma</strong> y no pueden ser
              desactivadas. Sin ellas, funciones esenciales como el inicio de sesión, la autenticación de dos factores y la
              protección contra ataques CSRF no funcionarían correctamente.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Cookie</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Finalidad</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'auth_token', purpose: 'Token de autenticación de sesión (JWT)', duration: '30 días' },
                    { name: 'csrf_token', purpose: 'Protección contra ataques Cross-Site Request Forgery', duration: 'Sesión' },
                    { name: 'session_id', purpose: 'Identificador de sesión activa', duration: 'Sesión' },
                    { name: 'device_trust', purpose: 'Reconocimiento de dispositivo de confianza para 2FA', duration: '30 días' },
                  ].map(({ name, purpose, duration }) => (
                    <tr key={name} className="bg-white even:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-700">{name}</td>
                      <td className="px-3 py-2 text-slate-500">{purpose}</td>
                      <td className="px-3 py-2 text-slate-500">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 4 */}
          <Section id="funcionales" icon={Settings} title="4. Cookies funcionales">
            <p>
              Estas cookies permiten que la plataforma recuerde sus preferencias y proporcione funcionalidades mejoradas.
              Su desactivación puede afectar la experiencia de uso, pero no impedirá el acceso al servicio.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Preferencia de modo oscuro/claro:</strong> Almacena su elección de tema visual.</li>
              <li><strong>Configuración de notificaciones:</strong> Recuerda sus preferencias de alertas y sonidos.</li>
              <li><strong>Idioma y región:</strong> Mantiene su selección de idioma entre sesiones.</li>
            </ul>
          </Section>

          {/* 5 */}
          <Section id="analiticas" icon={BarChart2} title="5. Cookies analíticas">
            <p>
              Utilizamos cookies analíticas para entender cómo los usuarios interactúan con la plataforma y mejorar
              continuamente la experiencia. Los datos recopilados son <strong>anónimos y agregados</strong>; no permiten
              identificar a usuarios individuales.
            </p>
            <p>
              Las métricas recopiladas incluyen: páginas visitadas, tiempo en la plataforma, flujos de navegación más
              frecuentes y detección de errores. Esta información nos ayuda a priorizar mejoras y corregir problemas.
            </p>
            <p>
              Puede desactivar las cookies analíticas en cualquier momento desde la sección de gestión de cookies sin que
              esto afecte el funcionamiento del servicio.
            </p>
          </Section>

          {/* 6 */}
          <Section id="gestion" icon={Settings} title="6. Gestión y control de cookies">
            <p>
              Usted tiene derecho a controlar el uso de cookies en la plataforma. Puede gestionar sus preferencias de las
              siguientes formas:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Panel de privacidad de la plataforma:</strong> Acceda a <em>Configuración → Privacidad → Preferencias
                de cookies</em> para activar o desactivar cookies no esenciales.
              </li>
              <li>
                <strong>Configuración del navegador:</strong> La mayoría de navegadores permiten bloquear o eliminar cookies.
                Consulte la ayuda de su navegador para instrucciones específicas.
              </li>
              <li>
                <strong>Modo incógnito:</strong> Las cookies de sesión no persisten entre sesiones en modo privado.
              </li>
            </ul>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mt-2">
              <p className="text-xs text-amber-800">
                <strong>Nota:</strong> Bloquear las cookies estrictamente necesarias impedirá el inicio de sesión y el
                correcto funcionamiento de la plataforma.
              </p>
            </div>
          </Section>

          {/* 7 */}
          <Section id="terceros" title="7. Cookies de terceros">
            <p>
              TotalMente puede integrar servicios de terceros que establezcan sus propias cookies:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pasarela de pago:</strong> Para procesar transacciones de forma segura (no almacenamos datos de tarjeta).</li>
              <li><strong>Infraestructura de videollamadas WebRTC:</strong> Para la señalización y establecimiento de conexiones de video cifradas.</li>
            </ul>
            <p>
              Estas cookies de terceros están sujetas a las políticas de privacidad de sus respectivos proveedores.
              TotalMente no tiene control sobre dichas cookies pero selecciona cuidadosamente proveedores con estándares
              equivalentes de protección de datos.
            </p>
          </Section>

          {/* 8 */}
          <Section id="actualizaciones" title="8. Actualizaciones a esta política">
            <p>
              Esta Política de Cookies puede ser actualizada para reflejar cambios en nuestra tecnología, legislación
              aplicable o prácticas. Le notificaremos de cambios significativos a través de un aviso en la plataforma.
              La fecha de "última actualización" en la parte superior de esta página indica cuándo fue modificada por
              última vez.
            </p>
            <p>
              Para dudas sobre el uso de cookies, contáctenos en:{' '}
              <a href="mailto:privacidad@totalmente.mx" className="text-emerald-600 underline">privacidad@totalmente.mx</a>.
            </p>
          </Section>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-6 mt-4">
            <p className="text-xs text-slate-400">
              Versión: 1.0 — Fecha de emisión: 2 de marzo de 2026.
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
            <Link to="/privacidad" className="hover:text-blue-600 transition-colors">Privacidad</Link>
            <Link to="/cookies" className="hover:text-blue-600 transition-colors font-medium text-blue-600">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CookiesPage
