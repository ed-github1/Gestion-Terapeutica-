import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { adminService } from '@shared/services/adminService'
import { useDarkModeContext } from '@shared/DarkModeContext'

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

const KYC_STATUS_OPTIONS = [
  { value: 'approved', label: 'Aprobado' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'declined', label: 'Rechazado' },
  { value: 'pending', label: 'Pendiente' },
]

const ConfirmSuspendModal = ({ activo, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          activo ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'
        }`}>
          <AlertTriangle size={18} className={activo ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100">
          {activo ? 'Suspender profesional' : 'Reactivar profesional'}
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {activo
          ? '¿Confirmás que querés suspender este profesional? No podrá acceder a la plataforma.'
          : '¿Confirmás que querés reactivar este profesional? Recuperará acceso a la plataforma.'}
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
          className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${
            activo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {activo ? 'Suspender' : 'Reactivar'}
        </button>
      </div>
    </motion.div>
  </div>
)

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value || '—'}</p>
  </div>
)

export default function AdminProfessionalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dark } = useDarkModeContext()
  const [prof, setProf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [kycSelect, setKycSelect] = useState('pending')
  const [kycLoading, setKycLoading] = useState(false)
  const [kycSuccess, setKycSuccess] = useState(false)
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProfessional = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getProfessionalById(id)
      const d = res.data?.data || res.data
      setProf(d)
      setKycSelect(d?.kycStatus || 'pending')
    } catch {
      setError('No se pudo cargar la información del profesional.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProfessional() }, [fetchProfessional])

  const handleKycConfirm = async () => {
    setKycLoading(true)
    try {
      await adminService.setKycStatus(id, kycSelect)
      setProf((p) => ({ ...p, kycStatus: kycSelect }))
      setKycSuccess(true)
      showToast('Estado KYC actualizado.')
      setTimeout(() => setKycSuccess(false), 2500)
    } catch {
      showToast('Error al actualizar el KYC.', 'error')
    } finally {
      setKycLoading(false)
    }
  }

  const handleSuspend = async () => {
    setShowSuspendConfirm(false)
    setSuspendLoading(true)
    const newActivo = !(prof?.activo ?? true)
    try {
      await adminService.setProfessionalSuspend(id, newActivo)
      setProf((p) => ({ ...p, activo: newActivo }))
      showToast(newActivo ? 'Profesional reactivado.' : 'Profesional suspendido.')
    } catch {
      showToast('Error al cambiar el estado del profesional.', 'error')
    } finally {
      setSuspendLoading(false)
    }
  }

  const activo = prof?.activo ?? true

  return (
    <div className={`${dark ? 'dark' : ''} min-h-full`}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/admin/professionals')}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Detalle Profesional</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Información y acciones de gestión</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-2xl px-4 py-3">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-5 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                style={{ width: `${55 + (i % 3) * 15}%`, opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ) : prof ? (
          <>
            {/* Detail Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {[prof.userId?.nombre || prof.nombre, prof.userId?.apellido || prof.apellido].filter(Boolean).join(' ') || '—'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{prof.userId?.email || prof.email || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${KYC_BADGE[prof.kycStatus] ?? KYC_BADGE.pending}`}>
                    KYC: {KYC_LABEL[prof.kycStatus] ?? prof.kycStatus ?? 'Pendiente'}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    activo
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {activo ? 'Activo' : 'Suspendido'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    prof.contractSigned
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    Contrato: {prof.contractSigned ? 'Firmado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Especialidad" value={prof.datosPersonales?.especialidad || prof.especialidad} />
                <Field label="Matrícula" value={prof.datosPersonales?.matricula || prof.matricula} />
                <Field label="Teléfono" value={prof.datosPersonales?.telefono || prof.telefono} />
                <Field label="País" value={prof.datosPersonales?.pais || prof.pais} />
                <Field label="Provincia" value={prof.datosPersonales?.provincia || prof.provincia} />
                <Field label="Plan suscripción" value={prof.userId?.subscriptionPlan || prof.subscriptionPlan} />
                <Field
                  label="Contrato firmado el"
                  value={prof.contractSignedAt ? new Date(prof.contractSignedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined}
                />
                <Field
                  label="Fecha de registro"
                  value={prof.userId?.createdAt ? new Date(prof.userId.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined}
                />
                <Field label="ID" value={prof._id || prof.id} />
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* KYC Action */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Estado KYC</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Estado actual: <span className={`font-medium ${KYC_BADGE[prof.kycStatus]?.split(' ')[1]}`}>{KYC_LABEL[prof.kycStatus] ?? '—'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={kycSelect}
                    onChange={(e) => setKycSelect(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {KYC_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button
                    onClick={handleKycConfirm}
                    disabled={kycLoading || kycSelect === prof.kycStatus}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {kycLoading
                      ? <Loader2 size={14} className="animate-spin" />
                      : kycSuccess
                        ? <CheckCircle size={14} />
                        : null}
                    {kycSuccess ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
                {kycSelect === 'declined' && kycSelect !== prof.kycStatus && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Esto rechazará la verificación del profesional.
                  </p>
                )}
              </div>

              {/* Suspend / Reactivate */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Estado de cuenta</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {activo
                      ? 'El profesional tiene acceso activo a la plataforma.'
                      : 'El profesional está actualmente suspendido.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  disabled={suspendLoading}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    activo
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  {suspendLoading && <Loader2 size={14} className="animate-spin" />}
                  {activo ? 'Suspender profesional' : 'Reactivar profesional'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <AnimatePresence>
        {showSuspendConfirm && (
          <ConfirmSuspendModal
            activo={activo}
            onConfirm={handleSuspend}
            onClose={() => setShowSuspendConfirm(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50 ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-gray-800 dark:bg-white text-white dark:text-gray-800'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
