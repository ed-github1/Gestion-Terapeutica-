import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { CreditCard, TrendingUp, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const PLAN_BADGE = {
  PRO: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  EMPRESA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BASICO: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  FREE: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500',
}

export default function AdminSubscriptions() {
  const { dark } = useDarkModeContext()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubscriptions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getSubscriptions()
      const d = res.data?.data || res.data
      setSubscriptions(Array.isArray(d?.subscriptions) ? d.subscriptions : Array.isArray(d) ? d : [])
    } catch {
      setError('No se pudieron cargar las suscripciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubscriptions() }, [])

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Suscripciones</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Planes activos y facturación</p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-2xl px-4 py-3">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CreditCard size={36} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No hay datos de suscripciones disponibles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuario</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plan</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Renovación</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub, i) => {
                    const plan = (sub.plan || sub.planType || sub.subscriptionPlan || 'FREE').toUpperCase()
                    const isActive = sub.status === 'active' || sub.active === true
                    const renewsAt = sub.currentPeriodEnd || sub.renewsAt
                    const name = sub.user?.nombre
                      ? `${sub.user.nombre} ${sub.user.apellido || ''}`.trim()
                      : sub.user?.name || sub.user?.email || sub.userId || '—'
                    return (
                      <motion.tr
                        key={sub._id || sub.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-200">{name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[plan] ?? 'bg-gray-100 text-gray-600'}`}>
                            {plan}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {renewsAt ? new Date(renewsAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {sub.amount != null ? `€${sub.amount}` : '—'}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
