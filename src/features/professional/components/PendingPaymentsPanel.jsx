/**
 * PendingPaymentsPanel.jsx
 *
 * Shows the professional a live list of appointments that are still waiting
 * for payment from the patient.  The panel:
 *   • fetches appointments on mount and every 30 s
 *   • re-fetches immediately when a `appointment-paid` socket event arrives
 *   • shows a green confirmation row for 5 s when a payment comes in, then
 *     removes the row from the "pending" list automatically
 */
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short',
    })
}

function fmtTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PendingPaymentsPanel({ className = '' }) {
    const [pending, setPending]           = useState([])
    const [loading, setLoading]           = useState(true)
    const [justPaid, setJustPaid]         = useState([]) // IDs recently marked paid
    const [collapsed, setCollapsed]       = useState(false)

    const load = useCallback(async () => {
        try {
            // Fetch all appointments and filter pending-payment client-side,
            // since not all backends honour the paymentStatus query param.
            const res = await appointmentsService.getAll({})
            const raw = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.data?.data)
                    ? res.data.data
                    : Array.isArray(res?.data?.appointments)
                        ? res.data.appointments
                        : []

            // Keep only rows where payment is outstanding and appt is not cancelled
            const filtered = raw.filter(a =>
                a.status !== 'cancelled' &&
                (a.paymentStatus === 'pending' || a.paymentStatus == null || a.paymentStatus === '')
            )
            setPending(filtered)
        } catch {
            // silently fail — panel is informational only
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial load + 30-second polling
    useEffect(() => {
        load()
        const interval = setInterval(load, 30_000)
        return () => clearInterval(interval)
    }, [load])

    // Real-time: react when a patient pays
    useEffect(() => {
        const unsubscribe = socketNotificationService.on('appointment-paid', (data) => {
            const paidId = String(data.appointmentId || '')
            // Mark as just-paid → shows green flash for 5 s then removes
            setJustPaid(prev => [...prev, paidId])
            setTimeout(() => {
                setJustPaid(prev => prev.filter(id => id !== paidId))
                setPending(prev => prev.filter(a => String(a._id || a.id) !== paidId))
            }, 5000)
            // Also re-fetch to keep the list accurate
            load()
        })
        return unsubscribe
    }, [load])

    const pendingCount = pending.length
    const hasItems     = pendingCount > 0 || justPaid.length > 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden ${className}`}
        >
            {/* Header */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-stone-50 transition-colors"
            >
                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
                <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-stone-800 leading-none">Pagos pendientes</p>
                    {!loading && (
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-none">
                            {pendingCount > 0
                                ? `${pendingCount} cita${pendingCount > 1 ? 's' : ''} esperando pago`
                                : 'Todo al día'}
                        </p>
                    )}
                </div>
                {pendingCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {pendingCount}
                    </span>
                )}
                <svg
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform shrink-0 ${collapsed ? '' : 'rotate-180'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Body */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {loading ? (
                            <div className="px-4 pb-3 flex flex-col gap-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-10 bg-stone-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="px-3 pb-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                                <AnimatePresence mode="popLayout">
                                    {/* Just-paid flash rows */}
                                    {justPaid.map(id => (
                                        <motion.div
                                            key={`paid-${id}`}
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-semibold text-emerald-700 flex-1">¡Pago confirmado!</p>
                                            <span className="text-[10px] text-emerald-500 font-medium">ahora</span>
                                        </motion.div>
                                    ))}

                                    {/* Pending rows */}
                                    {pending.length === 0 && justPaid.length === 0 && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-stone-400 text-center py-4"
                                        >
                                            Sin citas pendientes de pago
                                        </motion.p>
                                    )}

                                    {pending.map(apt => {
                                        const id = String(apt._id || apt.id || Math.random())
                                        const isPaid = justPaid.includes(id)
                                        if (isPaid) return null
                                        const dateStr = fmtDate(apt.date)
                                        const timeStr = fmtTime(apt.time)
                                        const name    = apt.patientName || apt.nombrePaciente || 'Paciente'

                                        return (
                                            <motion.div
                                                key={id}
                                                layout
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 group"
                                            >
                                                {/* Avatar placeholder */}
                                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-amber-700 uppercase">
                                                        {name.charAt(0)}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-stone-800 truncate leading-none">{name}</p>
                                                    <p className="text-[10px] text-stone-400 mt-0.5 leading-none truncate">
                                                        {dateStr}{timeStr ? ` · ${timeStr}` : ''}{apt.duration ? ` · ${apt.duration} min` : ''}
                                                    </p>
                                                </div>

                                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                                                    Pendiente
                                                </span>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
