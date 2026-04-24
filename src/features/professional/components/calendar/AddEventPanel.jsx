import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { X, User, Clock, FileText, Video, Building2, Banknote } from 'lucide-react'
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
  { value: 'primera_consulta', label: 'Primera consulta', dot: 'bg-blue-400',    gradient: 'from-blue-600 to-blue-500'      },
  { value: 'seguimiento',      label: 'Seguimiento',      dot: 'bg-emerald-400', gradient: 'from-emerald-600 to-emerald-500' },
  { value: 'extraordinaria',   label: 'Extraordinaria',   dot: 'bg-amber-400',   gradient: 'from-amber-500 to-orange-500'   },
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
  const isEdit = !!(appointment?.id || appointment?._id)
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || appointment?.nombrePaciente || '',
    patientId:   appointment?.patientId || '',
    patientUserId: appointment?.patientUserId || '',
    type:     appointment?.type || appointment?.appointmentType || 'primera_consulta',
    date:     appointment?.start ? new Date(appointment.start) : (appointment?.fechaHora ? new Date(appointment.fechaHora) : (slotDate || new Date())),
    time:     appointment?.start ? format(new Date(appointment.start), 'HH:mm') : (appointment?.fechaHora ? format(new Date(appointment.fechaHora), 'HH:mm') : '09:00'),
    duration: appointment?.duration || '60',
    notes:    appointment?.notes || '',
    mode:     appointment?.mode ?? (appointment?.isVideoCall ? 'videollamada' : 'consultorio'),
    price:    String(appointment?.price ?? getSavedPriceForType(appointment?.type || 'primera_consulta') ?? 50),
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
        ...(savedPrice !== null ? { price: String(savedPrice) } : {}),
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
      const priceNum = parseFloat(formData.price) || 0

      if (isEdit) {
        onSave({
          id: appointment.id || appointment._id,
          patientName: formData.patientName,
          patientId: formData.patientId || appointment.patientId,
          type: formData.type, start: startDate, end: endDate,
          duration: formData.duration, notes: formData.notes,
          mode: formData.mode, isVideoCall: formData.mode === 'videollamada',
          status: appointment.status, price: priceNum,
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
            price: priceNum,
          })
          created = res.data?.data || res.data

          const targetUserId = formData.patientUserId ||
            created?.patientUserId || created?.patient?.userId || created?.patient?.user
          if (targetUserId) {
            const proUserId = user?._id || user?.id
            socketNotificationService.connect(proUserId)
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
          status: 'reserved', price: priceNum,
        })
        showToast('Cita creada. El paciente recibirá una notificación.', 'success')
      }
    } catch {
      showToast('Error al guardar la cita', 'error')
    } finally {
      setSaving(false)
    }
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === formData.type) || TYPE_OPTIONS[0]
  const inputCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition'
  const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.18 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header ── */}
        <div className={`px-6 pt-5 pb-5 shrink-0`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">
                {isEdit ? 'Editar sesión' : 'Nueva sesión terapéutica'}
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">{selectedType.label}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {TYPE_OPTIONS.map(({ value, label, dot }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField('type', value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  formData.type === value
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'bg-white/15 text-white/80 hover:bg-white/25'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body: two-column layout ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">

              {/* ── Left col ── */}
              <div className="px-6 py-5 space-y-5">

                {/* Patient */}
                <div>
                  <label className={labelCls}><User className="w-3 h-3 inline mr-1" />Paciente</label>
                  {isEdit ? (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
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

                {/* Modalidad */}
                <div>
                  <label className={labelCls}>Modalidad</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'consultorio',  label: 'Presencial',   Icon: Building2, active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                      { value: 'videollamada', label: 'Videollamada', Icon: Video,      active: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
                    ].map(({ value, label, Icon, active }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateField('mode', value)}
                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.mode === value
                            ? active
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300'
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
                  <label className={labelCls}><Banknote className="w-3 h-3 inline mr-1" />Precio</label>
                  <div className={`flex items-center rounded-2xl border-2 overflow-hidden transition-all ${
                    selectedType.value === 'primera_consulta' ? 'border-blue-200 dark:border-blue-800/60 focus-within:border-blue-500'
                    : selectedType.value === 'seguimiento'    ? 'border-emerald-200 dark:border-emerald-800/60 focus-within:border-emerald-500'
                    :                                           'border-amber-200 dark:border-amber-800/60 focus-within:border-amber-500'
                  } bg-white dark:bg-gray-800`}>
                    <div className={`flex items-center justify-center self-stretch px-4 text-sm font-black border-r-2 ${
                      selectedType.value === 'primera_consulta' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                      : selectedType.value === 'seguimiento'    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      :                                           'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}>$</div>
                    <input
                      type="number" min="0" step="0.01" required
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      className="flex-1 px-4 py-3.5 text-2xl font-bold bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={labelCls}><FileText className="w-3 h-3 inline mr-1" />Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Motivo de consulta, indicaciones…"
                  />
                </div>
              </div>

              {/* ── Right col ── */}
              <div className="px-6 py-5 space-y-5">

                {/* Calendar */}
                <div>
                  <label className={labelCls}><Clock className="w-3 h-3 inline mr-1" />Fecha</label>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3">
                    <MiniCalendar selectedDate={formData.date} onSelectDate={(d) => updateField('date', d)} />
                  </div>
                </div>

                {/* Time + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hora</label>
                    <input type="time" required value={formData.time} onChange={(e) => updateField('time', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Duración</label>
                    <select value={formData.duration} onChange={(e) => updateField('duration', e.target.value)} className={inputCls}>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hora</option>
                      <option value="90">1h 30 min</option>
                      <option value="120">2 horas</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {isEdit ? (
              <button
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Eliminar
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 bg-linear-to-r ${selectedType.gradient} hover:shadow-md hover:brightness-105`}
              >
                {saving ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Guardando…</>
                ) : isEdit ? 'Actualizar sesión' : 'Crear sesión'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
