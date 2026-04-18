import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, Filter, MoreVertical, UserX, UserCheck,
  ChevronLeft, ChevronRight, X, AlertTriangle, Loader2,
  Edit2, Trash2, ShieldCheck,
} from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'health_professional', label: 'Profesional' },
  { value: 'patient', label: 'Paciente' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  health_professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  professional: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  patient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pacient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const ROLE_LABEL = {
  admin: 'Admin',
  health_professional: 'Profesional',
  professional: 'Profesional',
  patient: 'Paciente',
  pacient: 'Paciente',
}

// ── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ user, onToggleStatus, onDelete, onChangeRole, actionLoading }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const role = user.role || user.rol || ''
  const isActive = user.status !== 'inactive' && user.active !== false && user.isActive !== false

  const name =
    user.nombre && user.apellido
      ? `${user.nombre} ${user.apellido}`
      : user.name || '—'

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const id = user._id || user.id

  return (
    <tr className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {name !== '—' ? name[0].toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none">{name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABEL[role] ?? role}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-0.5 rounded-full ${
          isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{createdAt}</td>
      <td className="py-3 px-4 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={actionLoading === id}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
            aria-label="Acciones"
          >
            {actionLoading === id
              ? <Loader2 size={15} className="animate-spin" />
              : <MoreVertical size={15} />
            }
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-9 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl min-w-[180px] py-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onToggleStatus(id, isActive ? 'inactive' : 'active') }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isActive ? <UserX size={14} className="text-rose-500" /> : <UserCheck size={14} className="text-emerald-500" />}
                    {isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onChangeRole(id, role) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ShieldCheck size={14} className="text-violet-500" />
                    Cambiar Rol
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(id, name) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar usuario
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  )
}

// ── Change Role Modal ─────────────────────────────────────────────────────────
const ChangeRoleModal = ({ userId, currentRole, onConfirm, onClose }) => {
  const [role, setRole] = useState(currentRole)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Cambiar Rol</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="space-y-2 mb-6">
          {[
            { value: 'admin', label: 'Admin' },
            { value: 'health_professional', label: 'Profesional de Salud' },
            { value: 'patient', label: 'Paciente' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                role === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                checked={role === opt.value}
                onChange={() => setRole(opt.value)}
                className="accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(userId, role)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ userName, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100">Eliminar usuario</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        ¿Confirmas que quieres eliminar a <strong>{userName}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsers({ initialRoleFilter = '' }) {
  const { dark } = useDarkModeContext()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [roleModal, setRoleModal] = useState(null) // { id, currentRole }
  const [deleteModal, setDeleteModal] = useState(null) // { id, name }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      })
      const d = res.data?.data || res.data
      setUsers(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [])
      setTotal(d?.total ?? d?.count ?? 0)
    } catch {
      setError('No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleToggleStatus = async (id, newStatus) => {
    setActionLoading(id)
    try {
      await adminService.setUserStatus(id, newStatus)
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === id ? { ...u, status: newStatus, active: newStatus === 'active' } : u
        )
      )
      showToast(newStatus === 'active' ? 'Usuario activado.' : 'Usuario desactivado.')
    } catch {
      showToast('Error al cambiar el estado del usuario.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (id, role) => {
    setRoleModal(null)
    setActionLoading(id)
    try {
      await adminService.setUserRole(id, role)
      setUsers((prev) =>
        prev.map((u) => (u._id || u.id) === id ? { ...u, role, rol: role } : u)
      )
      showToast('Rol actualizado correctamente.')
    } catch {
      showToast('Error al cambiar el rol.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    const { id, name } = deleteModal
    setDeleteModal(null)
    setActionLoading(id)
    try {
      await adminService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id))
      setTotal((t) => Math.max(0, t - 1))
      showToast(`${name} eliminado correctamente.`)
    } catch {
      showToast('Error al eliminar el usuario.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} usuarios en total` : 'Listado completo de cuentas'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
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
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </form>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setStatusFilter(''); setPage(1) }}
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
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">No se encontraron usuarios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuario</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registrado</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow
                      key={u._id || u.id}
                      user={u}
                      onToggleStatus={handleToggleStatus}
                      onDelete={(id, name) => setDeleteModal({ id, name })}
                      onChangeRole={(id, role) => setRoleModal({ id, currentRole: role })}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </p>
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

      {/* Modals */}
      <AnimatePresence>
        {roleModal && (
          <ChangeRoleModal
            userId={roleModal.id}
            currentRole={roleModal.currentRole}
            onConfirm={handleChangeRole}
            onClose={() => setRoleModal(null)}
          />
        )}
        {deleteModal && (
          <ConfirmDeleteModal
            userName={deleteModal.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50 ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-800 dark:bg-white text-white dark:text-gray-800'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
