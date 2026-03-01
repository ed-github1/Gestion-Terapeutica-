/**
 * CrisisButton.jsx
 * Persistent, always-accessible emergency / crisis action button.
 * Provides direct contact to the assigned professional and a national crisis line.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// Spain – Teléfono de la Esperanza 717 003 717 (24h)
const CRISIS_LINE = { label: 'Línea de crisis 24h', number: '717003717', display: '717 003 717' }

const CrisisButton = ({ professionalPhone }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Fixed trigger */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5
                   bg-red-600 hover:bg-red-700 text-white rounded-2xl
                   shadow-lg shadow-red-300 text-xs font-bold
                   transition-colors"
        aria-label="Botón de emergencia"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="hidden sm:inline">Emergencia</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              exit={{ scale: 0.9,    opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">¿Necesitas ayuda ahora?</h2>
                  <p className="text-red-100 text-xs">Estás en un lugar seguro. Da el siguiente paso.</p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {/* Crisis hotline */}
                <a
                  href={`tel:${CRISIS_LINE.number}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-800">{CRISIS_LINE.label}</p>
                    <p className="text-base font-bold text-red-600 tracking-wide">{CRISIS_LINE.display}</p>
                  </div>
                  <svg className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                {/* Professional contact */}
                {professionalPhone ? (
                  <a
                    href={`tel:${professionalPhone}`}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-800">Contactar a mi profesional</p>
                      <p className="text-sm font-bold text-blue-600">{professionalPhone}</p>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-stone-200 bg-stone-50">
                    <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-600">Mi profesional</p>
                      <p className="text-xs text-stone-400">Usa el chat del dashboard para contactarle</p>
                    </div>
                  </div>
                )}

                {/* Emergency services */}
                <a
                  href="tel:112"
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm font-bold">Emergencias 112</span>
                </a>

                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CrisisButton
