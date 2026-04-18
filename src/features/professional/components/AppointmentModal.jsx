import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import VideoCallLauncher from './VideoCall'
import { showToast } from '@shared/ui/Toast'
import { appointmentsService } from '@shared/services/appointmentsService'
import { patientsService } from '@shared/services/patientsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { useAuth } from '@features/auth/AuthContext'
import { professionalsService } from '@shared/services/professionalsService'

const buildPatientName = (pt) => {
  if (!pt) return ''
  const raw = pt.name || `${pt.firstName || ''} ${pt.lastName || ''}`.trim()
  const cleaned = raw.replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '').replace(/\s{2,}/g, ' ').trim()
  return cleaned || pt.email || ''
}

const cleanDisplayName = (name) =>
  (name || '').replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '').replace(/\s{2,}/g, ' ').trim() || name

const getSavedPriceForType = (type) => {
  try {
    const saved = JSON.parse(localStorage.getItem('professionalSettings') || '{}')
    // Support both new (primeraSesion) and legacy (primera_consulta) keys
    return saved.sessionTypePrices?.[type] ?? null
  } catch {
    return null
  }
}

// Map display type labels to backend tarifa keys
const TYPE_TO_TARIFA_KEY = {
  primera_consulta: 'primeraSesion',
  primeraSesion: 'primeraSesion',
  seguimiento: 'seguimiento',
  extraordinaria: 'extraordinaria',
}

// Map internal type values to the backend Appointment.sessionType enum
// (['Primera Sesión', 'Seguimiento', 'Extraordinaria']).
const TYPE_TO_SESSION_TYPE = {
  primera_consulta: 'Primera Sesión',
  primeraSesion: 'Primera Sesión',
  seguimiento: 'Seguimiento',
  extraordinaria: 'Extraordinaria',
}

const AppointmentModal = ({ appointment, onClose, onSave, onDelete }) => {
  const { user } = useAuth()
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || '',
    patientId: appointment?.patientId || '',
    patientUserId: appointment?.patientUserId || '',
    type: appointment?.type || 'primera_consulta',
    date: appointment?.start ? format(appointment.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: appointment?.start ? format(appointment.start, 'HH:mm') : '09:00',
    duration: appointment?.duration || '60',
    notes: appointment?.notes || '',
    mode: appointment?.mode ?? (appointment?.isVideoCall ? 'videollamada' : 'consultorio'),
    price: appointment?.price ?? getSavedPriceForType(appointment?.type || 'consultation') ?? 50,
  })

  // Fetch tarifas from backend and update price for selected type
  useEffect(() => {
    if (appointment?.id) return // editing existing — keep stored price
    let cancelled = false
    professionalsService.getMyTarifas()
      .then(res => {
        if (cancelled) return
        const t = res.data?.data?.tarifas || res.data?.tarifas || res.data?.data || {}
        const tarifaKey = TYPE_TO_TARIFA_KEY[formData.type] || formData.type
        const price = t[tarifaKey]
        if (price != null) setFormData(prev => ({ ...prev, price }))
      })
      .catch(() => { /* fallback to localStorage value already set */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const loadPatients = async () => {
      setLoadingPatients(true)
      try {
        const res = await patientsService.getAll({})
        const list = res.data?.data || res.data?.patients || res.data || []
        setPatients(Array.isArray(list) ? list : [])
      } catch (err) {
        console.warn('Could not load patients:', err?.message)
        setPatients([])
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [])

  const copyVideoLink = () => {
    if (appointment) {
      const videoLink = `${window.location.origin}/video/join/${appointment.id}?name=${encodeURIComponent(formData.patientName)}`
      navigator.clipboard.writeText(videoLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
      showToast('Enlace de videollamada copiado', 'success')
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointment?.id) return
    if (!confirm('¿Cancelar esta cita? El paciente será notificado.')) return
    setCancelling(true)
    try {
      await appointmentsService.cancel(appointment.id, 'Cancelada por el profesional')
      showToast('Cita cancelada exitosamente', 'success')
      onSave({
        id: appointment.id,
        patientName: formData.patientName,
        patientId: formData.patientId || appointment.patientId,
        type: formData.type,
        start: appointment.start,
        end: appointment.end,
        duration: formData.duration,
        notes: formData.notes,
        mode: formData.mode,
        isVideoCall: formData.mode === 'videollamada',
        status: 'cancelled',
        price: formData.price,
      })
    } catch (err) {
      console.error('Cancel error:', err)
      showToast('No se pudo cancelar la cita. Intenta de nuevo.', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const sendNotification = async () => {
    if (!appointment) return
    setSendingNotification(true)
    try {
      await appointmentsService.updateStatus(appointment.id, 'notified')
      showToast('Notificación enviada exitosamente', 'success')
    } catch (error) {
      console.error('Error sending notification:', error)
      showToast('Error al enviar la notificación', 'error')
    } finally {
      setSendingNotification(false)
    }
  }

  if (showVideoCall && appointment) {
    return (
      <VideoCallLauncher
        appointmentId={appointment.id}
        patientName={appointment.patientName}
        patientId={appointment.patientId}
        onClose={() => setShowVideoCall(false)}
      />
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId && !appointment?.id) {
      showToast('Selecciona un paciente', 'error')
      return
    }

    setSaving(true)
    try {
      const [hours, minutes] = formData.time.split(':')
      const startDate = new Date(`${formData.date}T00:00:00`)
      startDate.setHours(parseInt(hours), parseInt(minutes), 0)
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + parseInt(formData.duration))

      if (appointment?.id) {
        onSave({
          id: appointment.id,
          patientName: formData.patientName,
          patientId: formData.patientId || appointment.patientId,
          type: formData.type,
          start: startDate,
          end: endDate,
          duration: formData.duration,
          notes: formData.notes,
          mode: formData.mode,
          isVideoCall: formData.mode === 'videollamada',
          status: appointment.status,
          price: formData.price,
        })
      } else {
        let created = null
        try {
          const res = await appointmentsService.createForPatient({
            patientId: formData.patientId,
            patientUserId: formData.patientUserId,
            professionalId: user?._id || user?.id,
            patientName: formData.patientName,
            date: formData.date,
            time: formData.time,
            type: formData.type,
            sessionType: TYPE_TO_SESSION_TYPE[formData.type] || formData.type,
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
            const proUserId = user?._id || user?.id
            socketNotificationService.connect(proUserId)
            socketNotificationService.sendAppointmentNotification(targetUserId, {
              appointmentId: created?._id || created?.id,
              professionalUserId: proUserId,
              patientName: formData.patientName,
              date: formData.date,
              time: formData.time,
              type: formData.type,
              mode: formData.mode,
              isVideoCall: formData.mode === 'videollamada',
            })
          } else {
            console.warn('[AppointmentModal] patientUserId not available — socket notification skipped; patient will see it via polling')
          }
        } catch (backendErr) {
          const errMsg = backendErr?.data?.message || backendErr?.data?.error || backendErr?.message || 'Error desconocido'
          console.error('Backend create failed (400 detail):', errMsg, '| full:', JSON.stringify(backendErr?.data))
          showToast(`No se pudo crear la cita: ${errMsg}`, 'error')
          setSaving(false)
          return
        }

        const appointmentId = created?._id || created?.id || Date.now()
        onSave({
          id: appointmentId,
          patientName: formData.patientName,
          patientId: formData.patientId,
          type: formData.type,
          start: startDate,
          end: endDate,
          duration: formData.duration,
          notes: formData.notes,
          mode: formData.mode,
          isVideoCall: formData.mode === 'videollamada',
          status: 'reserved',
          price: formData.price,
        })
        showToast('Cita creada. El paciente recibirá una notificación para aceptarla.', 'success')
      }
    } catch (err) {
      console.error('Error saving appointment:', err)
      showToast('Error al guardar la cita', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusMeta = {
    scheduled:   { label: 'Programada',              cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    completed:   { label: 'Completada',              cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
    cancelled:   { label: 'Cancelada',               cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    reserved:    { label: 'Pendiente de aceptación', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    rescheduled: { label: 'Reprogramada',            cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'no-show':   { label: 'No asistió',              cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  }
  const status = statusMeta[appointment?.status] ?? { label: 'Reservada', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }

  const inputCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5'

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
        className="bg-white dark:bg-gray-850 dark:bg-gray-900 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35)] max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header band ── */}
        <div className="relative bg-gray-800 dark:bg-gray-900 border-b border-gray-700 px-6 pt-6 pb-5">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {appointment?.id ? (
              /* Patient avatar with initials */
              <div className="w-14 h-14 rounded-2xl bg-gray-700 border border-gray-600 flex items-center justify-center text-white text-xl font-bold shadow-inner shrink-0">
                {formData.patientName.charAt(0).toUpperCase() || '?'}
              </div>
            ) : (
              /* New session icon */
              <div className="w-14 h-14 rounded-2xl bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                {appointment?.id ? 'Editar sesión' : 'Nueva sesión terapéutica'}
              </p>
              <h2 className="text-lg font-bold text-white truncate leading-tight">
                {appointment?.id ? formData.patientName : 'Agendar cita'}
              </h2>
              {appointment?.id && (
                <span className={`inline-flex mt-1.5 items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.cls}`}>
                  {status.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-5 space-y-6">

            {/* ─ Section: Patient & type ─ */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Paciente y tipo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Paciente *</label>
                  {appointment?.id ? (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {formData.patientName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{formData.patientName}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <select
                        required
                        value={formData.patientId}
                        onChange={(e) => {
                          const p = patients.find(p => (p._id || p.id) === e.target.value)
                          setFormData({
                            ...formData,
                            patientId: e.target.value,
                            patientUserId: p?.userId || p?.user_id || p?.user || '',
                            patientName: buildPatientName(p),
                          })
                        }}
                        className={`${inputCls} pl-9`}
                      >
                        <option value="">{loadingPatients ? 'Cargando…' : 'Seleccionar paciente'}</option>
                        {patients.map((p) => {
                          const pid = p._id || p.id
                          return <option key={pid} value={pid}>{cleanDisplayName(buildPatientName(p))}</option>
                        })}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Tipo de cita *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value
                        const savedPrice = !appointment?.id ? getSavedPriceForType(newType) : null
                        setFormData(prev => ({
                          ...prev,
                          type: newType,
                          ...(savedPrice !== null ? { price: savedPrice } : {}),
                        }))
                      }}
                      className={`${inputCls} pl-9`}
                    >
                      <option value="primera_consulta">Primera consulta</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="extraordinaria">Extraordinaria</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* ─ Divider ─ */}
            <div className="border-t border-dashed border-gray-100 dark:border-gray-700/60" />

            {/* ─ Section: Date / Time / Duration ─ */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Fecha y hora
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={labelCls}>Fecha *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className={labelCls}>Hora *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className={labelCls}>Duración *</label>
                  <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className={inputCls}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 h 30 min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ─ Divider ─ */}
            <div className="border-t border-dashed border-gray-100 dark:border-gray-700/60" />

            {/* ─ Section: Modalidad ─ */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                Modalidad *
              </p>
              <div className="flex gap-3">
                {[
                  { value: 'consultorio', label: 'Consultorio', sub: 'Presencial', activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>) },
                  { value: 'videollamada', label: 'Videollamada', sub: 'Virtual', activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>) },
                ].map(({ value, label, sub, activeColor, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: value })}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.mode === value
                        ? activeColor
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 bg-transparent'
                    }`}
                  >
                    <span className="shrink-0">{icon}</span>
                    <span className="text-left">
                      <span className="block text-sm font-semibold leading-tight">{label}</span>
                      <span className="block text-[11px] opacity-60 mt-0.5">{sub}</span>
                    </span>
                    {formData.mode === value && (
                      <svg className="w-4 h-4 ml-auto shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fillRule="evenodd" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* ─ Divider ─ */}
            <div className="border-t border-dashed border-gray-100 dark:border-gray-700/60" />

            {/* ─ Section: Notes & Price ─ */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Notas y precio
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notas adicionales</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Motivo de consulta, indicaciones previas…"
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio de la sesión *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">€</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} pl-7`}
                      placeholder="50.00"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ─ Video call actions (edit mode only) ─ */}
            {appointment?.id && (appointment.isVideoCall || appointment.mode === 'videollamada') && (
              <>
                <div className="border-t border-dashed border-gray-100 dark:border-gray-700/60" />
                <section>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Videollamada
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => setShowVideoCall(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      Iniciar videollamada
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={copyVideoLink}
                      title={linkCopied ? '¡Copiado!' : 'Copiar enlace'}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition border ${linkCopied ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      {linkCopied ? '¡Copiado!' : 'Copiar enlace'}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={sendNotification} disabled={sendingNotification}
                      title="Enviar notificación al paciente"
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {sendingNotification ? 'Enviando…' : 'Notificar'}
                    </motion.button>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* ── Sticky footer ── */}
          <div className="sticky bottom-0 border-t border-gray-100 dark:border-gray-700/60 px-6 py-4 flex items-center justify-between bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm gap-3">
            {appointment?.id ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onDelete(appointment.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Eliminar
              </motion.button>
            ) : <div />}

            {/* ── Cancel appointment (edit mode, not already cancelled/completed) ── */}
            {appointment?.id && !['cancelled', 'completed'].includes(appointment.status) && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition disabled:opacity-50"
              >
                {cancelling ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                )}
                {cancelling ? 'Cancelando…' : 'Cancelar cita'}
              </motion.button>
            )}

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Guardando…
                  </>
                ) : appointment?.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    Actualizar sesión
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    Crear y notificar
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AppointmentModal
