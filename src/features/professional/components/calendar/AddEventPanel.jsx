import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { X, User, Clock, FileText, Video, Building2, Euro } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { showToast } from '@shared/ui/Toast'
import { appointmentsService } from '@shared/services/appointmentsService'
import { patientsService } from '@shared/services/patientsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { useAuth } from '@features/auth/AuthContext'

const buildPatientName = (pt) => {
  if (!pt) return ''
  const raw = pt.name || `${pt.firstName || ''} ${pt.lastName || ''}`.trim()
  return raw.replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '').replace(/\s{2,}/g, ' ').trim() || pt.email || ''
}

const TYPE_OPTIONS = [
  { value: 'consultation', label: 'Consulta', color: 'bg-blue-500' },
  { value: 'therapy',      label: 'Terapia',  color: 'bg-purple-500' },
  { value: 'followup',     label: 'Seguimiento', color: 'bg-emerald-500' },
  { value: 'emergency',    label: 'Emergencia', color: 'bg-rose-500' },
]

const getSavedPriceForType = (type) => {
  try {
    const saved = JSON.parse(localStorage.getItem('professionalSettings') || '{}')
    return saved.sessionTypePrices?.[type] ?? null
  } catch {
    return null
  }
}

export default function AddEventPanel({ appointment, slotDate, onClose, onSave, onDelete }) {
  const { user } = useAuth()
  const isEdit = !!appointment?.id
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || '',
    patientId:   appointment?.patientId || '',
    patientUserId: appointment?.patientUserId || '',
    type:     appointment?.type || 'consultation',
    date:     appointment?.start ? new Date(appointment.start) : (slotDate || new Date()),
    time:     appointment?.start ? format(new Date(appointment.start), 'HH:mm') : '09:00',
    duration: appointment?.duration || '60',
    notes:    appointment?.notes || '',
    mode:     appointment?.mode ?? (appointment?.isVideoCall ? 'videollamada' : 'consultorio'),
    price:    appointment?.price ?? getSavedPriceForType(appointment?.type || 'consultation') ?? 50,
  })

  useEffect(() => {
    const loadPatients = async () => {
      setLoadingPatients(true)
      try {
        const res = await patientsService.getAll({})
        const list = res.data?.data || res.data?.patients || res.data || []
        setPatients(Array.isArray(list) ? list : [])
      } catch {
        setPatients([])
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [])

  const updateField = (field, value) => {
    if (field === 'type' && !isEdit) {
      const savedPrice = getSavedPriceForType(value)
      setFormData(prev => ({
        ...prev,
        type: value,
        ...(savedPrice !== null ? { price: savedPrice } : {}),
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId && !isEdit) {
      showToast('Selecciona un paciente', 'error')
      return
    }

    setSaving(true)
    try {
      const [hours, minutes] = formData.time.split(':')
      const startDate = new Date(formData.date)
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + parseInt(formData.duration))

      if (isEdit) {
        onSave({
          id: appointment.id,
          patientName: formData.patientName,
          patientId: formData.patientId || appointment.patientId,
          type: formData.type, start: startDate, end: endDate,
          duration: formData.duration, notes: formData.notes,
          mode: formData.mode, isVideoCall: formData.mode === 'videollamada',
          status: appointment.status, price: formData.price,
        })
      } else {
        let created = null
        try {
          const res = await appointmentsService.createForPatient({
            patientId: formData.patientId,
            patientUserId: formData.patientUserId,
            professionalId: user?._id || user?.id,
            patientName: formData.patientName,
            date: format(formData.date, 'yyyy-MM-dd'),
            time: formData.time,
            type: formData.type,
            duration: parseInt(formData.duration),
            notes: formData.notes,
            mode: formData.mode,
            isVideoCall: formData.mode === 'videollamada',
            price: formData.price,
          })
          created = res.data?.data || res.data

          const targetUserId = formData.patientUserId ||
            created?.patientUserId || created?.patient?.userId || created?.patient?.user
          if (targetUserId) {
            const proToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || ''
            const proUserId = user?._id || user?.id
            socketNotificationService.connect(proUserId, proToken)
            socketNotificationService.sendAppointmentNotification(targetUserId, {
              appointmentId: created?._id || created?.id,
              professionalUserId: proUserId,
              patientName: formData.patientName,
              date: format(formData.date, 'yyyy-MM-dd'),
              time: formData.time,
              type: formData.type,
              mode: formData.mode,
              isVideoCall: formData.mode === 'videollamada',
            })
          }
        } catch (err) {
          const errMsg = err?.data?.message || err?.data?.error || err?.message || 'Error desconocido'
          showToast(`No se pudo crear la cita: ${errMsg}`, 'error')
          setSaving(false)
          return
        }

        const appointmentId = created?._id || created?.id || Date.now()
        onSave({
          id: appointmentId, patientName: formData.patientName,
          patientId: formData.patientId, type: formData.type,
          start: startDate, end: endDate, duration: formData.duration,
          notes: formData.notes, mode: formData.mode,
          isVideoCall: formData.mode === 'videollamada',
          status: 'reserved', price: formData.price,
        })
        showToast('Cita creada. El paciente recibirá una notificación.', 'success')
      }
    } catch {
      showToast('Error al guardar la cita', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition'
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
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Sesión' : 'Nueva Sesión'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-5 py-4 space-y-5">

            {/* Title / type quick-pick */}
            <div>
              <label className={labelCls}>Tipo de sesión</label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('type', value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      formData.type === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient */}
            <div>
              <label className={labelCls}>
                <User className="w-3 h-3 inline mr-1" />
                Paciente
              </label>
              {isEdit ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                    {formData.patientName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{formData.patientName}</span>
                </div>
              ) : (
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => {
                    const p = patients.find(p => (p._id || p.id) === e.target.value)
                    updateField('patientId', e.target.value)
                    updateField('patientUserId', p?.userId || p?.user_id || p?.user || '')
                    updateField('patientName', buildPatientName(p))
                  }}
                  className={inputCls}
                >
                  <option value="">{loadingPatients ? 'Cargando…' : 'Seleccionar paciente'}</option>
                  {patients.map((p) => {
                    const pid = p._id || p.id
                    return <option key={pid} value={pid}>{buildPatientName(p)}</option>
                  })}
                </select>
              )}
            </div>

            {/* Date — mini calendar */}
            <div>
              <label className={labelCls}>
                <Clock className="w-3 h-3 inline mr-1" />
                Fecha
              </label>
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-800/40">
                <MiniCalendar
                  selectedDate={formData.date}
                  onSelectDate={(d) => updateField('date', d)}
                />
              </div>
            </div>

            {/* Time + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Hora</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Duración</label>
                <select
                  value={formData.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  className={inputCls}
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hora</option>
                  <option value="90">1h 30min</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className={labelCls}>Modalidad</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'consultorio', label: 'Presencial', Icon: Building2, active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                  { value: 'videollamada', label: 'Videollamada', Icon: Video, active: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
                ].map(({ value, label, Icon, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('mode', value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.mode === value
                        ? active
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>
                <Euro className="w-3 h-3 inline mr-1" />
                Precio
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                className={inputCls}
                placeholder="50.00"
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>
                <FileText className="w-3 h-3 inline mr-1" />
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Motivo de consulta, indicaciones…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-100 dark:border-gray-700/60 px-5 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {isEdit ? (
              <button
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                Eliminar
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition shadow-sm disabled:cursor-not-allowed flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Guardando…
                  </>
                ) : isEdit ? 'Actualizar' : 'Crear sesión'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </>
  )
}
