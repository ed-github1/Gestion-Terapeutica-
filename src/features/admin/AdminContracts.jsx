import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2, FileText, Download } from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

export default function AdminContracts() {
  const { dark } = useDarkModeContext()
  const [contracts, setContracts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getContracts({ page, limit })
      const d = res.data?.data || res.data
      setContracts(Array.isArray(d?.contracts) ? d.contracts : Array.isArray(d) ? d : [])
      setTotal(d?.total ?? d?.count ?? 0)
    } catch {
      setError('No se pudieron cargar los contratos.')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contratos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} contratos firmados` : 'Contratos firmados por profesionales'}
          </p>
        </div>

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
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText size={36} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No hay contratos firmados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Profesional</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha de firma</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Versión</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">IP</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descargar</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => {
                    const nombre = c.user?.nombre || ''
                    const apellido = c.user?.apellido || ''
                    const name = [nombre, apellido].filter(Boolean).join(' ') || '—'
                    const email = c.user?.email || '—'
                    const signedAt = c.contractSignedAt
                      ? new Date(c.contractSignedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    return (
                      <tr
                        key={c._id || c.id || i}
                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-200">{name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{email}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{signedAt}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{c.contractVersion || '—'}</td>
                        <td className="py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-mono">{c.contractIp || '—'}</td>
                        <td className="py-3 px-4">
                          {c.downloadUrl ? (
                            <a
                              href={c.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                              <Download size={13} />
                              Descargar
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
