import { useState } from 'react'
import { motion } from 'motion/react'
import { X, DollarSign, Check } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'

const SESSION_TYPES = [
  { key: 'consultation', label: 'Consulta general',  color: 'bg-blue-500',    ring: 'focus:ring-blue-500/40'   },
  { key: 'therapy',      label: 'Terapia',            color: 'bg-purple-500',  ring: 'focus:ring-purple-500/40' },
  { key: 'followup',     label: 'Seguimiento',        color: 'bg-emerald-500', ring: 'focus:ring-emerald-500/40'},
  { key: 'emergency',    label: 'Emergencia',         color: 'bg-rose-500',    ring: 'focus:ring-rose-500/40'  },
]

const CURRENCIES = [
  { value: 'MXN', symbol: '$', label: 'MXN — Peso mexicano' },
  { value: 'USD', symbol: '$', label: 'USD — Dólar'         },
  { value: 'EUR', symbol: '€', label: 'EUR — Euro'          },
]

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('professionalSettings') || '{}')
  } catch {
    return {}
  }
}

export default function RatesPanel({ onClose }) {
  const [saved, setSaved] = useState(false)

  const initial = loadSettings()
  const [currency, setCurrency] = useState(initial.currency || 'MXN')
  const [prices, setPrices] = useState({
    consultation: initial.sessionTypePrices?.consultation ?? 50,
    therapy:      initial.sessionTypePrices?.therapy      ?? 70,
    followup:     initial.sessionTypePrices?.followup     ?? 40,
    emergency:    initial.sessionTypePrices?.emergency    ?? 90,
  })

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol ?? '$'

  const handleSave = () => {
    try {
      const existing = loadSettings()
      const updated = {
        ...existing,
        currency,
        sessionTypePrices: {
          ...existing.sessionTypePrices,
          ...prices,
        },
      }
      localStorage.setItem('professionalSettings', JSON.stringify(updated))
      setSaved(true)
      showToast('Tarifas guardadas', 'success')
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1200)
    } catch {
      showToast('No se pudieron guardar las tarifas', 'error')
    }
  }

  const inputCls = 'w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition'
  const labelCls = 'block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Tarifas por sesión</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Define el precio predeterminado por tipo de sesión. Al crear una nueva cita, el precio se rellenará automáticamente.
          </p>

          {/* Currency */}
          <div>
            <label className={labelCls}>Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
            >
              {CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Price inputs */}
          <div className="space-y-3">
            <label className={labelCls}>Precio por tipo</label>
            {SESSION_TYPES.map(({ key, label, color, ring }) => (
              <div key={key} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-700/60">
                <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 min-w-0 truncate">
                  {label}
                </span>
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[key]}
                    onChange={(e) => setPrices(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className={`${inputCls} ${ring}`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700/60">
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Guardado</>
            ) : (
              'Guardar tarifas'
            )}
          </button>
        </div>
      </motion.div>
    </>
  )
}
