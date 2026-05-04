import { motion } from 'motion/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Video, Building2, CheckCircle2, XCircle, AlertCircle, Timer, CalendarDays } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, '0')
const resolveStart = (apt) => apt.start ? new Date(apt.start) : apt.fechaHora ? new Date(apt.fechaHora) : null
const fmtTime  = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const fmtEnd   = (s, dur) => fmtTime(new Date(s.getTime() + (Number(dur) || 60) * 60_000))
const fmtDate  = (d) => format(d, "EEEE d 'de' MMMM", { locale: es })
const initials = (name = '') => {
    const p = name.trim().split(' ').filter(Boolean)
    return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase() || '?'
}

// ── Type accent colors ────────────────────────────────────────────────────────
const TYPE_ACCENT = {
    primera_consulta:  '#3B82F6', 'Primera consulta': '#3B82F6',
    seguimiento:       '#10B981', Seguimiento:        '#10B981',
    extraordinaria:    '#F59E0B', Extraordinaria:     '#F59E0B',
}
const TYPE_LABEL = {
    primera_consulta: 'Primera consulta', 'Primera consulta': 'Primera consulta',
    seguimiento: 'Seguimiento', Seguimiento: 'Seguimiento',
    extraordinaria: 'Extraordinaria', Extraordinaria: 'Extraordinaria',
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
    completed:  { label: 'Completada', Icon: CheckCircle2, color: 'text-emerald-500' },
    completada: { label: 'Completada', Icon: CheckCircle2, color: 'text-emerald-500' },
    cancelled:  { label: 'Cancelada',  Icon: XCircle,      color: 'text-rose-500'    },
    cancelada:  { label: 'Cancelada',  Icon: XCircle,      color: 'text-rose-500'    },
    reserved:   { label: 'Reservada',  Icon: CalendarDays, color: 'text-sky-500'     },
    confirmed:  { label: 'Confirmada', Icon: CalendarDays, color: 'text-sky-500'     },
    'no-show':  { label: 'No asistió', Icon: AlertCircle,  color: 'text-amber-500'   },
    'no_show':  { label: 'No asistió', Icon: AlertCircle,  color: 'text-amber-500'   },
}
const getStatus = (s) => STATUS_MAP[s] || { label: s || 'Pendiente', Icon: Timer, color: 'text-gray-400' }

// ── Component ─────────────────────────────────────────────────────────────────
export default function AppointmentDetailPanel({ appointment, onClose }) {
    if (!appointment) return null

    const name    = appointment.patientName || appointment.nombrePaciente || 'Paciente'
    const type    = appointment.type || appointment.appointmentType || appointment.sessionType || ''
    const status  = appointment.status || appointment.estado || 'pending'
    const isVideo = appointment.isVideoCall || appointment.mode === 'videollamada'
    const notes   = appointment.notes || appointment.reason || ''
    const price   = appointment.price ?? appointment.amount ?? null
    const duration = appointment.duration || 60
    const start   = resolveStart(appointment)

    const accent     = TYPE_ACCENT[type] || '#6B7280'
    const typeLabel  = TYPE_LABEL[type]  || type || 'Sesión'
    const { label: statusLabel, Icon: StatusIcon, color: statusColor } = getStatus(status)
    const isPaid     = appointment.paymentStatus === 'paid' || appointment.paymentStatus === 'completed'

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="bg-white dark:bg-[#111827] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
                style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
                translate="no"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* ── Accent bar + header ── */}
                <div className="px-5 pt-4 pb-5" style={{ borderTop: `3px solid ${accent}` }}>
                    <div className="flex items-start justify-between mb-4">
                        {/* Type chip */}
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                            style={{ background: `${accent}18`, color: accent }}>
                            {typeLabel}
                        </span>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Patient */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
                            {initials(name)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{name}</p>
                            <div className={`flex items-center gap-1 mt-0.5 text-xs font-semibold ${statusColor}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

                {/* ── Info grid ── */}
                <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-4">

                    {start && (
                        <InfoCell label="Fecha">
                            <span className="capitalize">{fmtDate(start)}</span>
                        </InfoCell>
                    )}

                    {start && (
                        <InfoCell label="Horario">
                            {fmtTime(start)} – {fmtEnd(start, duration)}
                            <span className="block text-gray-400 text-[11px]">{duration} min</span>
                        </InfoCell>
                    )}

                    <InfoCell label="Modalidad">
                        <span className="flex items-center gap-1.5">
                            {isVideo
                                ? <><Video className="w-3.5 h-3.5 text-blue-400" /> Videollamada</>
                                : <><Building2 className="w-3.5 h-3.5 text-emerald-400" /> Presencial</>
                            }
                        </span>
                    </InfoCell>

                    {price != null && Number(price) > 0 && (
                        <InfoCell label="Honorario">
                            <span className="font-bold text-gray-900 dark:text-white">
                                ${Number(price).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 20 })}
                            </span>
                            {appointment.paymentStatus && (
                                <span className={`block text-[11px] font-semibold mt-0.5 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {isPaid ? '✓ Pagado' : '· Pendiente'}
                                </span>
                            )}
                        </InfoCell>
                    )}
                </div>

                {/* ── Notes ── */}
                {notes && (
                    <>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />
                        <div className="px-5 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Notas</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{notes}</p>
                        </div>
                    </>
                )}

                {/* ── Close button ── */}
                <div className="px-5 pb-6 pt-1">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── InfoCell ──────────────────────────────────────────────────────────────────
function InfoCell({ label, children }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">{children}</div>
        </div>
    )
}
