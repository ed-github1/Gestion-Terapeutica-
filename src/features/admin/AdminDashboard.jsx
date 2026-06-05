import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, UserCog, CreditCard,
  AlertTriangle, RefreshCw, FileText, ArrowRight,
  ShieldCheck, Activity,
} from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'
import { useAuth } from '@features/auth'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('es-ES'))

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const todayLabel = () => {
  const s = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const relativeTime = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 2) return 'ahora'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-sky-400 to-teal-500',
  'from-emerald-400 to-green-500',
  'from-violet-500 to-purple-600',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
]
const avatarGradient = (name = '') =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length]

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  health_professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  patient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pacient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}
const ROLE_LABEL = {
  admin: 'Admin', health_professional: 'Profesional', professional: 'Profesional',
  patient: 'Paciente', pacient: 'Paciente',
}

/* ── KPI Stat Card ───────────────────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, sub, accentBg, iconBg, iconColor, index, loading, onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.08 + index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -2, transition: { duration: 0.18 } }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative text-left bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 w-full cursor-pointer"
  >
    {/* Accent bar */}
    <div className={`h-0.75 w-full ${accentBg}`} />

    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <ArrowRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-2.5">
          <div className="h-8 w-20 bg-gray-100 dark:bg-gray-700/80 rounded-lg animate-pulse" />
          <div className="h-3.5 w-28 bg-gray-100 dark:bg-gray-700/80 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700/80 rounded animate-pulse opacity-60" />
        </div>
      ) : (
        <>
          <p className="text-[32px] font-bold text-gray-900 dark:text-white font-display leading-none tabular-nums">
            {fmt(value)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-snug">{label}</p>
          {sub && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-snug">{sub}</p>
          )}
        </>
      )}
    </div>
  </motion.button>
)

/* ── Subscription Breakdown ──────────────────────────────────────────────── */

const SubscriptionBreakdown = ({ stats, loading }) => {
  const pro = stats?.subscriptions?.pro ?? 0
  const empresa = stats?.subscriptions?.empresa ?? 0
  const gratuito = stats?.subscriptions?.gratuito ?? 0
  const total = pro + empresa + gratuito || 1

  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setReady(true), 80)
      return () => clearTimeout(t)
    }
  }, [loading])

  const segments = [
    { label: 'Pro', value: pro, pct: Math.round((pro / total) * 100), barColor: 'bg-[#0075C9]', dotColor: 'bg-[#0075C9]' },
    { label: 'Empresa', value: empresa, pct: Math.round((empresa / total) * 100), barColor: 'bg-[#54C0E8]', dotColor: 'bg-[#54C0E8]' },
    { label: 'Gratuito', value: gratuito, pct: Math.round((gratuito / total) * 100), barColor: 'bg-gray-200 dark:bg-gray-600', dotColor: 'bg-gray-300 dark:bg-gray-500' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Suscripciones</p>
        {!loading && (
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums font-display">
            {fmt(pro + empresa + gratuito)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3.5 w-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-4">
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  width: ready ? `${s.pct}%` : '0%',
                  transition: 'width 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`h-full ${s.barColor}`}
              />
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2.5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.dotColor}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums font-display">
                    {fmt(s.value)}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 w-8 text-right tabular-nums">
                    {s.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Professional Status Grid ────────────────────────────────────────────── */

const ProfessionalStatus = ({ stats, loading }) => {
  const tiles = [
    {
      label: 'Totales',
      value: stats?.professionals?.total,
      classes: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300',
    },
    {
      label: 'Activos',
      value: stats?.professionals?.active,
      classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'KYC OK',
      value: stats?.professionals?.kycApproved,
      classes: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
    },
    {
      label: 'Contratos',
      value: stats?.professionals?.contractSigned,
      classes: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Profesionales</p>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(({ label, value, classes }) => (
          <div key={label} className={`rounded-xl px-3 py-3 ${classes}`}>
            {loading ? (
              <div className="h-6 w-10 bg-current/10 rounded animate-pulse mb-1.5" />
            ) : (
              <p className="text-[22px] font-bold leading-none tabular-nums font-display">{fmt(value)}</p>
            )}
            <p className="text-[11px] font-medium mt-1.5 opacity-60 leading-none">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Quick Actions ───────────────────────────────────────────────────────── */

const ACTIONS = [
  { label: 'Usuarios', path: '/dashboard/admin/users', icon: Users, classes: 'bg-blue-50 dark:bg-blue-900/20 text-[#0075C9] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' },
  { label: 'Profesionales', path: '/dashboard/admin/professionals', icon: UserCheck, classes: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/30' },
  { label: 'Contratos', path: '/dashboard/admin/contracts', icon: FileText, classes: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30' },
  { label: 'Suscripciones', path: '/dashboard/admin/subscriptions', icon: CreditCard, classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
]

const QuickActions = ({ navigate }) => (
  <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-5">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Acceso rápido</p>
    <div className="grid grid-cols-2 gap-2">
      {ACTIONS.map(({ label, path, icon: Icon, classes }) => (
        <motion.button
          key={path}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(path)}
          className={`${classes} rounded-xl px-3 py-2.5 text-left flex items-center gap-2 transition-colors`}
        >
          <Icon size={13} className="shrink-0" />
          <span className="text-xs font-semibold leading-none">{label}</span>
        </motion.button>
      ))}
    </div>
  </div>
)

/* ── Table Skeleton ──────────────────────────────────────────────────────── */

const TableSkeleton = () => (
  <>
    {[...Array(7)].map((_, i) => (
      <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
        <td className="py-3 pl-5 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse shrink-0" style={{ opacity: 1 - i * 0.1 }} />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
              <div className="h-3 w-36 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ opacity: 0.7 - i * 0.08 }} />
            </div>
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
        </td>
        <td className="py-3 pl-4 pr-5">
          <div className="h-3.5 w-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse ml-auto" style={{ opacity: 1 - i * 0.1 }} />
        </td>
      </tr>
    ))}
  </>
)

/* ── User Row ────────────────────────────────────────────────────────────── */

const UserRow = ({ user, index }) => {
  const role = user.role || user.rol || ''
  const name =
    user.nombre && user.apellido ? `${user.nombre} ${user.apellido}`
    : user.name || '—'
  const initial = name !== '—' ? name[0].toUpperCase() : '?'

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.045, duration: 0.3, ease: 'easeOut' }}
      className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/70 dark:hover:bg-gray-700/25 transition-colors"
    >
      <td className="py-3 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full bg-linear-to-br ${avatarGradient(name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none truncate">{name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          {ROLE_LABEL[role] ?? role}
        </span>
      </td>
      <td className="py-3 pl-4 pr-5 text-xs text-gray-400 dark:text-gray-500 text-right tabular-nums">
        {relativeTime(user.createdAt)}
      </td>
    </motion.tr>
  )
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { dark } = useDarkModeContext()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoadingStats(true)
      setLoadingUsers(true)
    }
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getUsers({ limit: 10, page: 1 }),
      ])
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data)
      }
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data?.data || usersRes.value.data
        setRecentUsers(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [])
      }
    } catch {
      setError('No se pudieron cargar los datos de administración.')
    } finally {
      setLoadingStats(false)
      setLoadingUsers(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const adminName = user?.nombre || user?.name || 'Admin'

  const statCards = [
    {
      icon: Users,
      label: 'Usuarios Totales',
      value: stats?.users?.total,
      accentBg: 'bg-[#0075C9]',
      iconBg: 'bg-blue-50 dark:bg-blue-900/25',
      iconColor: 'text-[#0075C9] dark:text-blue-300',
      onClick: () => navigate('/dashboard/admin/users'),
    },
    {
      icon: UserCog,
      label: 'Pacientes',
      value: stats?.patients?.total,
      accentBg: 'bg-[#54C0E8]',
      iconBg: 'bg-sky-50 dark:bg-sky-900/25',
      iconColor: 'text-sky-600 dark:text-sky-300',
      onClick: () => navigate('/dashboard/admin/users'),
    },
    {
      icon: UserCheck,
      label: 'Profesionales',
      value: stats?.professionals?.total,
      sub: [
        stats?.professionals?.active != null && `${stats.professionals.active} activos`,
        stats?.professionals?.kycApproved != null && `${stats.professionals.kycApproved} KYC`,
      ].filter(Boolean).join(' · ') || undefined,
      accentBg: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/25',
      iconColor: 'text-emerald-600 dark:text-emerald-300',
      onClick: () => navigate('/dashboard/admin/professionals'),
    },
    {
      icon: CreditCard,
      label: 'Suscripciones Pro',
      value: stats?.subscriptions?.pro,
      sub: [
        stats?.subscriptions?.empresa != null && `${stats.subscriptions.empresa} Empresa`,
        stats?.subscriptions?.gratuito != null && `${stats.subscriptions.gratuito} Gratuito`,
      ].filter(Boolean).join(' · ') || undefined,
      accentBg: 'bg-violet-500',
      iconBg: 'bg-violet-50 dark:bg-violet-900/25',
      iconColor: 'text-violet-600 dark:text-violet-300',
      onClick: () => navigate('/dashboard/admin/subscriptions'),
    },
  ]

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-5 lg:space-y-6">

        {/* ── Welcome Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              {todayLabel()}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              {greeting()}, {adminName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Vista general de la plataforma · TotalMente
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors shadow-sm disabled:opacity-60 shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </motion.div>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-2xl px-4 py-3"
          >
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </motion.div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} index={i} loading={loadingStats} />
          ))}
        </div>

        {/* ── Main Content ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Recent users (3/5) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Usuarios Recientes</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Últimos registros en la plataforma
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/admin/users')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0075C9] dark:text-blue-400 hover:underline shrink-0 transition-colors"
              >
                Ver todos <ArrowRight size={10} />
              </button>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/60">
                  <th className="py-2.5 pl-5 pr-4 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Usuario
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Rol
                  </th>
                  <th className="py-2.5 pl-4 pr-5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">
                    Registro
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <TableSkeleton />
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u, i) => (
                    <UserRow key={u._id || u.id} user={u} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </motion.div>

          {/* Right sidebar (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4 }}
            >
              <SubscriptionBreakdown stats={stats} loading={loadingStats} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.4 }}
            >
              <ProfessionalStatus stats={stats} loading={loadingStats} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.40, duration: 0.4 }}
            >
              <QuickActions navigate={navigate} />
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  )
}
