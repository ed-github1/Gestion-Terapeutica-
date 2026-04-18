import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Cookie, Shield, BarChart2, Settings, ChevronDown, ChevronUp, X } from 'lucide-react'
import { ROUTES } from '@shared/constants/routes'

const COOKIE_CONSENT_KEY = 'cookie_consent'

/**
 * Read the stored consent preferences.
 * Returns null if the user hasn't consented yet.
 */
export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Persist the user's cookie preferences.
 * `preferences` shape: { necessary: true, functional: boolean, analytics: boolean, consented: true, date: ISO }
 */
function saveCookieConsent(preferences) {
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({ ...preferences, consented: true, date: new Date().toISOString() }),
  )
}

const CATEGORIES = [
  {
    id: 'necessary',
    label: 'Estrictamente necesarias',
    description:
      'Cookies esenciales para la autenticación, seguridad y funcionamiento básico de la plataforma. No se pueden desactivar.',
    icon: Shield,
    locked: true,
    defaultValue: true,
  },
  {
    id: 'functional',
    label: 'Funcionales',
    description:
      'Permiten recordar tus preferencias como el modo oscuro, idioma y configuraciones de la interfaz.',
    icon: Settings,
    locked: false,
    defaultValue: true,
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    description:
      'Nos ayudan a entender cómo usas la plataforma para mejorar la experiencia. Los datos son anónimos.',
    icon: BarChart2,
    locked: false,
    defaultValue: false,
  },
]

const CookieConsentModal = () => {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [preferences, setPreferences] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, c.defaultValue])),
  )

  useEffect(() => {
    const consent = getCookieConsent()
    if (!consent) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const handleAcceptAll = useCallback(() => {
    const all = Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))
    saveCookieConsent(all)
    setVisible(false)
  }, [])

  const handleAcceptSelected = useCallback(() => {
    saveCookieConsent({ ...preferences, necessary: true })
    setVisible(false)
  }, [preferences])

  const handleRejectOptional = useCallback(() => {
    const minimal = Object.fromEntries(
      CATEGORIES.map((c) => [c.id, c.locked ? true : false]),
    )
    saveCookieConsent(minimal)
    setVisible(false)
  }, [])

  const toggleCategory = (id) => {
    const cat = CATEGORIES.find((c) => c.id === id)
    if (cat?.locked) return
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleRejectOptional}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-label="Preferencias de cookies"
            className="fixed z-[9999] bottom-0 inset-x-0 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-lg w-full"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Preferencias de cookies</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Gestiona tu privacidad</p>
                  </div>
                </div>
                <button
                  onClick={handleRejectOptional}
                  className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Usamos cookies para garantizar la seguridad de tu sesión y mejorar tu experiencia.
                  Las cookies de autenticación son esenciales y no se pueden desactivar.
                  Puedes gestionar las demás a continuación.
                </p>

                {/* Category toggles */}
                <div className="mt-4">
                  <button
                    onClick={() => setExpanded((e) => !e)}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expanded ? 'Ocultar detalles' : 'Personalizar cookies'}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3">
                          {CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const checked = preferences[cat.id]
                            return (
                              <div
                                key={cat.id}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
                                  checked
                                    ? 'bg-blue-50/60 border-blue-200/60'
                                    : 'bg-slate-50 border-slate-200/60'
                                }`}
                              >
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200/60 shrink-0 mt-0.5">
                                  <Icon className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-900">{cat.label}</span>
                                    <button
                                      role="switch"
                                      aria-checked={checked}
                                      aria-label={cat.label}
                                      disabled={cat.locked}
                                      onClick={() => toggleCategory(cat.id)}
                                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                        checked ? 'bg-blue-600' : 'bg-slate-300'
                                      } ${cat.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
                                          checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 text-sm cursor-pointer"
                >
                  Aceptar todas
                </button>
                {expanded ? (
                  <button
                    onClick={handleAcceptSelected}
                    className="flex-1 px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                  >
                    Guardar preferencias
                  </button>
                ) : (
                  <button
                    onClick={handleRejectOptional}
                    className="flex-1 px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                  >
                    Solo necesarias
                  </button>
                )}
              </div>

              {/* Legal links */}
              <div className="px-6 pb-5 flex items-center justify-center gap-4 text-xs text-slate-500">
                <Link to={ROUTES.PRIVACY} className="hover:text-blue-600 transition-colors underline">
                  Política de privacidad
                </Link>
                <span>·</span>
                <Link to={ROUTES.TERMS} className="hover:text-blue-600 transition-colors underline">
                  Términos y condiciones
                </Link>
                <span>·</span>
                <Link to={ROUTES.COOKIES} className="hover:text-blue-600 transition-colors underline">
                  Política de cookies
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CookieConsentModal
