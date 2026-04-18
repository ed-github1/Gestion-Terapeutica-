import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { X, Check, Wallet } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { useAuth } from '@features/auth'
import { getCurrencyForCountry } from '@shared/constants/subscriptionPlans'
import { professionalsService } from '@shared/services/professionalsService'

// Keys match the backend Professional.tarifas schema
const SESSION_TYPES = [
  {
    key: 'primeraSesion',
    label: 'Primera consulta',
    description: 'Sesión inicial de evaluación',
    dotLight: 'bg-sky-500',
    dotDark: 'bg-sky-400',
    accent: 'text-sky-600 dark:text-sky-400',
    pillBg: 'bg-sky-50 dark:bg-sky-900/25',
    pillBorder: 'border-sky-100 dark:border-sky-800/40',
    inputFocus: 'focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20',
    symbolBg: 'bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400',
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    description: 'Sesión regular de tratamiento',
    dotLight: 'bg-emerald-500',
    dotDark: 'bg-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
    pillBg: 'bg-emerald-50 dark:bg-emerald-900/25',
    pillBorder: 'border-emerald-100 dark:border-emerald-800/40',
    inputFocus: 'focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/20',
    symbolBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400',
  },
  {
    key: 'extraordinaria',
    label: 'Extraordinaria',
    description: 'Sesión adicional o urgente',
    dotLight: 'bg-amber-500',
    dotDark: 'bg-amber-400',
    accent: 'text-amber-600 dark:text-amber-400',
    pillBg: 'bg-amber-50 dark:bg-amber-900/25',
    pillBorder: 'border-amber-100 dark:border-amber-800/40',
    inputFocus: 'focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20',
    symbolBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400',
  },
]


function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('professionalSettings') || '{}')
  } catch {
    return {}
  }
}

export default function RatesPanel({ onClose }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const countryInfo = getCurrencyForCountry(user?.country)
  const currency = countryInfo.currency
  const currencySymbol = countryInfo.symbol

  const [prices, setPrices] = useState({
    primeraSesion:   '50',
    seguimiento:     '40',
    extraordinaria:  '70',
  })
  const [loadingTarifas, setLoadingTarifas] = useState(true)

  // Fetch current tarifas from backend on mount
  useEffect(() => {
    let cancelled = false
    professionalsService.getMyTarifas()
      .then(res => {
        if (cancelled) return
        const t = res.data?.data?.tarifas || res.data?.tarifas || res.data?.data || {}
        setPrices({
          primeraSesion:   String(t.primeraSesion ?? 50),
          seguimiento:     String(t.seguimiento ?? 40),
          extraordinaria:  String(t.extraordinaria ?? 70),
        })
      })
      .catch(() => {
        // Fallback: read from localStorage cache
        const cached = loadSettings()
        if (cached.sessionTypePrices) {
          setPrices({
            primeraSesion:   String(cached.sessionTypePrices.primeraSesion ?? cached.sessionTypePrices.primera_consulta ?? 50),
            seguimiento:     String(cached.sessionTypePrices.seguimiento ?? 40),
            extraordinaria:  String(cached.sessionTypePrices.extraordinaria ?? 70),
          })
        }
      })
      .finally(() => { if (!cancelled) setLoadingTarifas(false) })
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    const tarifas = Object.fromEntries(
      Object.entries(prices).map(([k, v]) => [k, parseFloat(v) || 0])
    )

    // Always cache locally so the data is available even if API fails
    const existing = loadSettings()
    localStorage.setItem('professionalSettings', JSON.stringify({
      ...existing,
      currency,
      sessionTypePrices: tarifas,
    }))

    try {
      await professionalsService.updateMyTarifas(tarifas)
    } catch {
      // API not available yet — saved locally only
    }

    setSaved(true)
    showToast('Tarifas guardadas', 'success')
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">Configuración</p>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Tarifas por sesión</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 shrink-0" />

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">

          {/* Currency — read-only, derived from country */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Moneda</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <span className="text-base font-bold text-gray-700 dark:text-gray-200">{currencySymbol}</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currency}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">— {countryInfo.currencyLabel}</span>
              <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">según tu país</span>
            </div>
          </div>

          {/* Price cards */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">Precio por tipo de sesión</label>
            <div className="space-y-2.5">
              {SESSION_TYPES.map(({ key, label, description, dotLight, accent, pillBg, pillBorder, inputFocus, symbolBg }) => (
                <div key={key} className={`rounded-xl border ${pillBg} ${pillBorder} p-3.5`}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`w-2 h-2 rounded-full ${dotLight} shrink-0`} />
                    <span className={`text-[13px] font-semibold ${accent}`}>{label}</span>
                    <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">{description}</span>
                  </div>
                  <div className={`flex items-center rounded-xl border bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${inputFocus}`}>
                    <div className={`flex items-center justify-center px-3.5 self-stretch text-sm font-bold border-r border-gray-200 dark:border-gray-700 ${symbolBg}`}>
                      {currencySymbol}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prices[key]}
                      onChange={(e) => setPrices(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-3.5 py-2.5 text-lg font-bold bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              saved
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-linear-to-r from-sky-500 to-teal-500 hover:from-sky-500 hover:to-teal-600 text-white shadow-sm hover:shadow-md active:scale-[0.98]'
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> ¡Guardado!</>
            ) : (
              <><Wallet className="w-4 h-4" /> Guardar tarifas</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
