import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, X, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const KYC_STATUS_OPTIONS = [
  { value: '', label: 'Todos los KYC' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'declined', label: 'Rechazado' },
  { value: 'pending', label: 'Pendiente' },
]

const CONTRACT_OPTIONS = [
  { value: '', label: 'Todos los contratos' },
  { value: 'true', label: 'Firmado' },
  { value: 'false', label: 'Pendiente' },
]

const ACTIVO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Suspendidos' },
]

const KYC_BADGE = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  declined: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  pending: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const KYC_LABEL = {
  approved: 'Aprobado',
  in_review: 'En revisión',
  declined: 'Rechazado',
  pending: 'Pendiente',
}

export default function AdminProfessionals() {
  const { dark } = useDarkModeContext()
  const [professionals, setProfessionals] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [activoFilter, setActivoFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters = search || kycFilter || contractFilter || activoFilter

  const fetchProfessionals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getProfessionals({
        page,
        limit,
        search: search || undefined,
        kycStatus: kycFilter || undefined,
        contractSigned: contractFilter !== '' ? contractFilter : undefined,
        activo: activoFilter !== '' ? activoFilter : undefined,
      })
      const d = res.data?.data || res.data
      setProfessionals(Array.isArray(d?.professionals) ? d.professionals : Array.isArray(d) ? d : [])
      setTotal(d?.total ?? d?.count ?? 0)
    } catch {
      setError('No se pudo cargar la lista de profesionales.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, kycFilter, contractFilter, activoFilter])

  useEffect(() => { fetchProfessionals() }, [fetchProfessionals])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setKycFilter('')
    setContractFilter('')
    setActivoFilter('')
    setPage(1)
  }

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profesionales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} profesionales en total` : 'Listado de profesionales registrados'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              Buscar
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {KYC_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={contractFilter}
              onChange={(e) => { setContractFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CONTRACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={activoFilter}
              onChange={(e) => { setActivoFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTIVO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X size={13} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {error ? (
            <div className="flex items-center gap-3 m-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
              No se encontraron profesionales.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Especialidad</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">KYC</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contrato</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suscripción</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((prof) => {
                    const id = prof._id || prof.id
                    const nombre = prof.userId?.nombre || prof.nombre || ''
                    const apellido = prof.userId?.apellido || prof.apellido || ''
                    const name = [nombre, apellido].filter(Boolean).join(' ') || '—'
                    const email = prof.userId?.email || prof.email || '—'
                    const especialidad = prof.datosPersonales?.especialidad || prof.especialidad || '—'
                    const kycStatus = prof.kycStatus || 'pending'
                    const contractSigned = prof.contractSigned ?? false
                    const activo = prof.activo ?? prof.isActive ?? true
                    const plan = prof.userId?.subscriptionPlan || prof.subscriptionPlan || '—'

                    return (
                      <tr key={id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-200">{name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{email}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{especialidad}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${KYC_BADGE[kycStatus] ?? KYC_BADGE.pending}`}>
                            {KYC_LABEL[kycStatus] ?? kycStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            contractSigned
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {contractSigned ? 'Firmado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-0.5 rounded-full ${
                            activo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {activo ? 'Activo' : 'Suspendido'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{plan}</td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/dashboard/admin/professionals/${id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline whitespace-nowrap"
                          >
                            Ver detalle <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
