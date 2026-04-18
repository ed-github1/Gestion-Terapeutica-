import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, UserCog, CreditCard,
  TrendingUp, Activity, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const StatCard = ({ icon: Icon, label, value, sub, colorClass, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</p>
      {loading ? (
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-none">{value ?? '—'}</p>
      )}
      {sub && !loading && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
      )}
    </div>
  </motion.div>
)

const RecentUserRow = ({ user }) => {
  const roleLabel = {
    admin: 'Admin',
    health_professional: 'Profesional',
    professional: 'Profesional',
    patient: 'Paciente',
    pacient: 'Paciente',
  }[user.role || user.rol] ?? ((user.role || user.rol) ?? '—')

  const roleBadge = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    health_professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    patient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    pacient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  }[user.role || user.rol] ?? 'bg-gray-100 text-gray-600'

  const name =
    user.nombre && user.apellido
      ? `${user.nombre} ${user.apellido}`
      : user.name || user.email || '—'

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <tr className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200 font-medium">{name}</td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
      <td className="py-3 px-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge}`}>
          {roleLabel}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{createdAt}</td>
    </tr>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { dark } = useDarkModeContext()
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoadingStats(true)
    setLoadingUsers(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getUsers({ limit: 8, page: 1 }),
      ])

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data?.data || statsRes.value.data
        setStats(d)
      }
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data?.data || usersRes.value.data
        setRecentUsers(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [])
      }
    } catch (err) {
      setError('No se pudieron cargar los datos de administración.')
    } finally {
      setLoadingStats(false)
      setLoadingUsers(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const statCards = [
    {
      icon: Users,
      label: 'Usuarios Totales',
      value: stats?.totalUsers,
      sub: stats?.newUsersThisMonth != null ? `+${stats.newUsersThisMonth} este mes` : undefined,
      colorClass: 'bg-linear-to-br from-blue-500 to-blue-600',
    },
    {
      icon: UserCheck,
      label: 'Profesionales',
      value: stats?.totalProfessionals,
      sub: stats?.activeProfessionals != null ? `${stats.activeProfessionals} activos` : undefined,
      colorClass: 'bg-linear-to-br from-sky-400 to-teal-500',
    },
    {
      icon: UserCog,
      label: 'Pacientes',
      value: stats?.totalPatients,
      sub: stats?.activePatients != null ? `${stats.activePatients} activos` : undefined,
      colorClass: 'bg-linear-to-br from-emerald-400 to-green-500',
    },
    {
      icon: CreditCard,
      label: 'Suscripciones Activas',
      value: stats?.activeSubscriptions,
      sub: stats?.mrr != null ? `MRR €${stats.mrr}` : undefined,
      colorClass: 'bg-linear-to-br from-violet-500 to-purple-600',
    },
    {
      icon: Activity,
      label: 'Sesiones este mes',
      value: stats?.sessionsThisMonth,
      colorClass: 'bg-linear-to-br from-orange-400 to-rose-500',
    },
    {
      icon: TrendingUp,
      label: 'Ingresos estimados',
      value: stats?.estimatedRevenue != null ? `€${stats.estimatedRevenue}` : undefined,
      colorClass: 'bg-linear-to-br from-lime-400 to-green-500',
    },
  ]

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Panel de Administración</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vista general de la plataforma</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            <RefreshCw size={15} className={loadingStats ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-2xl px-4 py-3">
            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={loadingStats} />
          ))}
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Gestionar Usuarios',
              desc: 'Ver, editar y moderar todas las cuentas',
              path: '/dashboard/admin/users',
              color: 'from-blue-500 to-blue-600',
            },
            {
              label: 'Profesionales',
              desc: 'Verificar y gestionar cuentas de terapeutas',
              path: '/dashboard/admin/professionals',
              color: 'from-sky-400 to-teal-500',
            },
            {
              label: 'Suscripciones',
              desc: 'Planes activos, pagos y facturación',
              path: '/dashboard/admin/subscriptions',
              color: 'from-violet-500 to-purple-600',
            },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-left bg-linear-to-br ${item.color} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group`}
            >
              <p className="text-white font-bold text-base">{item.label}</p>
              <p className="text-white/70 text-xs mt-1 leading-snug">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">Usuarios Recientes</h2>
            <button
              onClick={() => navigate('/dashboard/admin/users')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Ver todos →
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No hay usuarios para mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <RecentUserRow key={u._id || u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
