import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { X, Check, Wallet, TriangleAlert, ExternalLink, Info, TrendingUp } from 'lucide-react'
import { showToast } from '@shared/ui/Toast'
import { useAuth } from '@features/auth'
import { getCurrencyForCountry } from '@shared/constants/subscriptionPlans'
import { professionalsService } from '@shared/services/professionalsService'
import { useDarkModeContext } from '@shared/DarkModeContext'
import mpLogo from '@assets/LOGO_MP.svg'
import apiClient from '@shared/api/client'

// MP fee pages per country — only countries where MP officially operates
const MP_FEE_URLS = {
  MX: 'https://www.mercadopago.com.mx/costs-section',
  AR: 'https://www.mercadopago.com.ar/costs-section',
  BR: 'https://www.mercadopago.com.br/costs-section',
  CO: 'https://www.mercadopago.com.co/costs-section',
  CL: 'https://www.mercadopago.com.cl/costs-section',
  PE: 'https://www.mercadopago.com.pe/costs-section',
  UY: 'https://www.mercadopago.com.uy/costs-section',
}

// Keys match the backend Professional.tarifas schema
const SESSION_TYPES = [
  {
    key: 'primeraSesion',
    label: 'Primera consulta',
    description: 'Sesión inicial de evaluación',
    dotLight: 'bg-sky-500',
    accent: 'font-black dark:text-white ',
    pillBg: 'bg-gray-50 dark:bg-transparent',
    pillBorder: 'border-gray-100 dark:border-gray-700',
    inputFocus: 'focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20',
    symbolBg: 'bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400',
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    description: 'Sesión regular de tratamiento',
    dotLight: 'bg-emerald-500',
    accent: 'font-black dark:text-white',
    pillBg: 'bg-gray-50 dark:bg-transparent',
    pillBorder: 'border-emerald-100 dark:border-emerald-800/40',
    inputFocus: 'focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/20',
    symbolBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400',
  },
  {
    key: 'extraordinaria',
    label: 'Extraordinaria',
    description: 'Sesión adicional o urgente',
    dotLight: 'bg-amber-500',
    accent: 'font-black dark:text-white',
    pillBg: 'bg-gray-50 dark:bg-transparent',
    pillBorder: 'border-amber-100 dark:border-amber-800/40',
    inputFocus: 'focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20',
    symbolBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400',
  },
]

const COLORS = {
  primeraSesion: { bar: 'bg-sky-500', ring: 'focus:ring-sky-400/20 focus:border-sky-400' },
  seguimiento: { bar: 'bg-emerald-500', ring: 'focus:ring-emerald-400/20 focus:border-emerald-400' },
  extraordinaria: { bar: 'bg-amber-500', ring: 'focus:ring-amber-400/20 focus:border-amber-400' },
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('professionalSettings') || '{}')
  } catch {
    return {}
  }
}

export default function RatesPanel({ onClose, embedded = false }) {
  const { user } = useAuth()
  const { dark } = useDarkModeContext()
  const location = useLocation()
  const [saved, setSaved] = useState(false)
  const [mpConnected, setMpConnected] = useState(false)
  const [mpConnecting, setMpConnecting] = useState(false)

  const countryInfo = getCurrencyForCountry(user?.country)
  const currency = countryInfo.currency
  const currencySymbol = countryInfo.symbol

  const [prices, setPrices] = useState({
    primeraSesion: '50',
    seguimiento: '40',
    extraordinaria: '70',
  })
  const [loadingTarifas, setLoadingTarifas] = useState(true)
  const [feeInfo, setFeeInfo] = useState({ rate: null, source: null, bannerDismissed: true })
  const [weeklyHours, setWeeklyHours] = useState(0)

  useEffect(() => {
    const load = () => {
      try {
        const raw = sessionStorage.getItem('professionalAvailability')
        if (!raw) { setWeeklyHours(0); return }
        const avail = JSON.parse(raw)
        const total = Object.values(avail).reduce((sum, slots) => sum + (Array.isArray(slots) ? slots.length : 0), 0)
        setWeeklyHours(total)
      } catch { setWeeklyHours(0) }
    }
    load()
    window.addEventListener('availabilityUpdated', load)
    return () => window.removeEventListener('availabilityUpdated', load)
  }, [])

  // Init mpConnected from user
  useEffect(() => {
    setMpConnected(user?.mpConnected ?? false)
  }, [user])

  // Handle OAuth callback: ?mp=connected or ?mp=error
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mp = params.get('mp')
    if (!mp) return
    if (mp === 'connected') {
      setMpConnected(true)
      showToast('Cuenta de MercadoPago conectada', 'success')
    } else if (mp === 'error') {
      showToast('Error al conectar MercadoPago, intenta de nuevo', 'error')
    }
    window.history.replaceState({}, '', location.pathname)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectMP = async () => {
    setMpConnecting(true)
    try {
      const res = await apiClient.get('/auth/mercadopago/connect')
      window.location.href = res.data?.url
    } catch {
      showToast('No se pudo iniciar la conexión con MercadoPago.', 'error')
      setMpConnecting(false)
    }
  }

  const handleDisconnectMP = async () => {
    try {
      await apiClient.post('/auth/mercadopago/disconnect')
      setMpConnected(false)
      showToast('Cuenta de MercadoPago desconectada', 'success')
    } catch {
      showToast('No se pudo desconectar MercadoPago.', 'error')
    }
  }

  // Fetch MP fee rate + banner dismissed state
  useEffect(() => {
    professionalsService.getMyMpFeeRate()
      .then(res => setFeeInfo({
        rate: res.data?.rate ?? null,
        source: res.data?.source ?? null,
        bannerDismissed: res.data?.bannerDismissed ?? true,
      }))
      .catch(() => { })
  }, [])

  // Fetch current tarifas from backend on mount
  useEffect(() => {
    let cancelled = false
    professionalsService.getMyTarifas()
      .then(res => {
        if (cancelled) return
        const t = res.data?.data?.tarifas || res.data?.tarifas || res.data?.data || {}
        setPrices({
          primeraSesion: String(t.primeraSesion ?? 50),
          seguimiento: String(t.seguimiento ?? 40),
          extraordinaria: String(t.extraordinaria ?? 70),
        })
      })
      .catch(() => {
        const cached = loadSettings()
        if (cached.sessionTypePrices) {
          setPrices({
            primeraSesion: String(cached.sessionTypePrices.primeraSesion ?? cached.sessionTypePrices.primera_consulta ?? 50),
            seguimiento: String(cached.sessionTypePrices.seguimiento ?? 40),
            extraordinaria: String(cached.sessionTypePrices.extraordinaria ?? 70),
          })
        }
      })
      .finally(() => { if (!cancelled) setLoadingTarifas(false) })
    return () => { cancelled = true }
  }, [])

  const handleDismissBanner = () => {
    setFeeInfo(prev => ({ ...prev, bannerDismissed: true }))
    professionalsService.dismissRatesBanner().catch(() => { })
  }

  const handleSave = async () => {
    const tarifas = Object.fromEntries(
      Object.entries(prices).map(([k, v]) => [k, parseFloat(v) || 0])
    )

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
      onClose?.()
    }, 1200)
  }

  const mpFeeUrl = MP_FEE_URLS[user?.country]

  const body = (
    <div className="space-y-4">
      {/* ── Dismissable fee notice (only shown once) ── */}
      {!feeInfo.bannerDismissed && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
          <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">MercadoPago descuenta una comisión por cada cobro</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-snug">
              El panel muestra el monto real que recibirás por sesión.{' '}
              {mpFeeUrl && (
                <a href={mpFeeUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors">
                  Ver costos en tu país
                </a>
              )}
            </p>
          </div>
          <button onClick={handleDismissBanner} className="shrink-0 p-1 rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Cobros ── */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cobros</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Pasarela para recibir pagos de tus pacientes</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">

          {/* MP connect row */}
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-32 h-12 shrink-0 bg-[#0077B6] dark:bg-white"
                style={{
                  WebkitMaskImage: `url(${mpLogo})`,
                  maskImage: `url(${mpLogo})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center left',
                  maskPosition: 'center left',
                }}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500 select-none">
                {mpConnected ? 'Desconectar' : 'Conectar'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={mpConnected}
                disabled={mpConnecting}
                onClick={() => mpConnected ? handleDisconnectMP() : handleConnectMP()}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${mpConnected ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${mpConnected ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Currency row */}
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            <p className="text-sm text-gray-700 dark:text-gray-300">Moneda</p>
            <div className="flex items-center gap-2 shrink-0">
              {user?.country && user.country !== 'OTHER' && (
                <img
                  src={`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@2.6.0/flags/${user.country.toLowerCase()}.svg`}
                  width={16} height={16} alt={user.country}
                  className="rounded-full"
                />
              )}
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currencySymbol} {currency}</span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">{countryInfo.currencyLabel}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Tarifas por sesión ── */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tarifas por sesión</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Lo que cobras por cada tipo de consulta</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {SESSION_TYPES.map(({ key, label, description }) => {
            const { bar } = COLORS[key]
            const amount = parseFloat(prices[key])
            const hasBreakdown = feeInfo.rate && amount > 0
            const fee = hasBreakdown ? amount * feeInfo.rate : 0
            const net = hasBreakdown ? amount - fee : 0
            return (
              <div key={key} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`w-0.75 h-8 rounded-full ${bar} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-gray-500 dark:text-gray-500">{currencySymbol}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prices[key]}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '' || /^[\d.]*$/.test(val)) setPrices(prev => ({ ...prev, [key]: val }))
                      }}
                      className="w-20 text-right text-base font-bold bg-transparent text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-700 pb-0.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      placeholder="0"
                    />
                  </div>
                </div>
                {hasBreakdown && (
                  <div className="flex items-center justify-between mt-2 pl-3.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Comisión {(feeInfo.rate * 100).toFixed(1)}% —{' '}
                      <span className="text-rose-400 font-medium">−{currencySymbol}{fee.toFixed(2)}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                      Recibirás {currencySymbol}{net.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Fee source footnote inside the section */}
        {feeInfo.rate && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {feeInfo.source === 'actual' ? 'Comisión real de tu cuenta' : 'Comisión estimada según tu país'}
              {' · '}{(feeInfo.rate * 100).toFixed(2)}%
            </p>
            {mpFeeUrl && (
              <a href={mpFeeUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 dark:text-blue-400 hover:underline underline-offset-2">
                Ver costos <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Revenue estimate ── */}
      {weeklyHours > 0 && (() => {
        const rate = parseFloat(prices.seguimiento) || 0
        if (!rate) return null
        const monthly = Math.round(weeklyHours * 4.3 * 0.75 * rate)
        return (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[11px] text-blue-700 dark:text-blue-300 truncate">
                Con tu disponibilidad · {weeklyHours}h/sem
              </span>
            </div>
            <span className="text-[13px] font-black text-blue-600 dark:text-blue-300 shrink-0 tabular-nums">
              ~{currencySymbol}{monthly.toLocaleString()} / mes
            </span>
          </div>
        )
      })()}

      {/* ── Save ── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

    </div>
  )

  if (embedded) return body

  return createPortal(
    <div className={dark ? 'dark' : ''}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-60"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          className="bg-white dark:bg-gray-900 w-full max-w-sm max-h-[92dvh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">Configuración</p>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">Tarifas por sesión</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 shrink-0" />

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 custom-scrollbar">
            {body}
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body
  )
}
