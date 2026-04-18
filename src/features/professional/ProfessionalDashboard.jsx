import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, CheckCircle2, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@features/auth'
import { subscriptionService } from '@shared/services/subscriptionService'
import ModernProfessionalDashboard from './components/ModernProfessionalDashboard'
import AppointmentsCalendar from './components/AppointmentsCalendar'
import PatientClinicalFile from './components/PatientClinicalFile'

// Max time to poll for plan activation (45 seconds), interval every 3s
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS  = 45000

/**
 * Wrapper component to switch between dashboard, calendar, and diary views
 * Maintains navigation state and routing between different views
 */
const ProfessionalDashboardWrapper = () => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [diaryPatient, setDiaryPatient] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams()
    const { refreshUser, user } = useAuth()
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(
        () => searchParams.get('subscription') === 'success'
    )
    // 'activating' | 'active' | 'timeout'
    const [planStatus, setPlanStatus] = useState('activating')
    const pollRef    = useRef(null)
    const timeoutRef = useRef(null)
    const sessionIdRef = useRef(searchParams.get('session_id'))

    const isPro = (u) => ['PRO', 'EMPRESA'].includes((u?.subscriptionPlan || u?.plan || u?.planType || '').toUpperCase())

    /** Try to verify the Stripe session + refresh user, return true if plan is now Pro */
    const tryActivate = useCallback(async () => {
        // 1. If we have a Stripe session ID, ask the backend to verify & activate
        if (sessionIdRef.current) {
            try { await subscriptionService.verifyCheckoutSession(sessionIdRef.current) } catch { /* ignore */ }
        }
        // 2. Refresh user profile to get updated plan
        const updated = await refreshUser?.()
        return isPro(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshUser])

    /** Manual retry (shown after timeout) */
    const handleRetryActivation = useCallback(async () => {
        setPlanStatus('activating')
        const activated = await tryActivate()
        setPlanStatus(activated ? 'active' : 'timeout')
    }, [tryActivate])

    useEffect(() => {
        if (searchParams.get('subscription') !== 'success') return

        // Capture session_id before cleaning params
        sessionIdRef.current = searchParams.get('session_id')

        // Clean query params immediately
        setSearchParams((prev) => {
            prev.delete('subscription')
            prev.delete('session_id')
            return prev
        }, { replace: true })

        // If user is already marked as Pro (e.g. webhook was instant), skip polling
        if (isPro(user)) { setPlanStatus('active'); return }

        // First attempt: verify session immediately
        ;(async () => {
            const activated = await tryActivate()
            if (activated) { setPlanStatus('active'); return }

            // Poll until plan is confirmed or we time out
            pollRef.current = setInterval(async () => {
                const updated = await refreshUser?.()
                if (isPro(updated)) {
                    clearInterval(pollRef.current)
                    clearTimeout(timeoutRef.current)
                    setPlanStatus('active')
                }
            }, POLL_INTERVAL_MS)

            timeoutRef.current = setTimeout(() => {
                clearInterval(pollRef.current)
                setPlanStatus('timeout')
            }, POLL_TIMEOUT_MS)
        })()

        return () => {
            clearInterval(pollRef.current)
            clearTimeout(timeoutRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // If a patient clinical file is open, render it statically
    if (diaryPatient) {
        return (
            <PatientClinicalFile
                patient={diaryPatient}
                onClose={() => setDiaryPatient(null)}
            />
        )
    }

    // Dashboard + slide-over drawer for the full calendar
    return (
        <>
            {/* ── Subscription payment success modal ── */}
            <AnimatePresence>
                {showPaymentSuccess && (
                    <>
                        <motion.div
                            key="pay-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowPaymentSuccess(false)}
                        />
                        <motion.div
                            key="pay-modal"
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                                {/* Top accent bar */}
                                <div className={`h-1.5 w-full transition-all duration-700 ${planStatus === 'active' ? 'bg-linear-to-r from-emerald-400 to-teal-500' : 'bg-linear-to-r from-sky-400 to-blue-500'}`} />

                                <div className="p-8 text-center">
                                    {/* Icon */}
                                    <div className="mx-auto mb-5 relative w-20 h-20">
                                        {planStatus === 'activating' ? (
                                            <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                                                <Loader2 className="w-10 h-10 text-sky-500 animate-spin" strokeWidth={1.8} />
                                            </div>
                                        ) : planStatus === 'active' ? (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 animate-ping opacity-40" />
                                                <div className="relative w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.8} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                                <CheckCircle2 className="w-10 h-10 text-amber-500" strokeWidth={1.8} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Text */}
                                    {planStatus === 'activating' ? (
                                        <>
                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                                                Activando tu plan...
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Pago recibido. Estamos confirmando tu suscripción <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span>.
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-7">
                                                Esto tarda unos segundos...
                                            </p>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-7">
                                                <div className="h-full bg-sky-400 rounded-full animate-pulse w-2/3" />
                                            </div>
                                        </>
                                    ) : planStatus === 'active' ? (
                                        <>
                                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                                    ¡Plan Pro activo!
                                                </h2>
                                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Tu suscripción <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span> ya está activa.
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-7">
                                                Recibirás una confirmación por email en breve.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                                                ¡Pago recibido!
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Tu pago fue procesado. La activación puede tardar unos minutos.
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                                                Pulsa reintentar o recarga la página si tu plan no aparece actualizado.
                                            </p>
                                            <button
                                                onClick={handleRetryActivation}
                                                className="w-full py-2.5 rounded-xl font-semibold text-sm mb-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-sky-500 hover:bg-sky-600 text-white"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Reintentar activación
                                            </button>
                                        </>
                                    )}

                                    {/* CTA */}
                                    <button
                                        onClick={() => setShowPaymentSuccess(false)}
                                        disabled={planStatus === 'activating'}
                                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 text-white"
                                    >
                                        {planStatus === 'activating' ? 'Activando...' : 'Empezar a usar Pro'}
                                    </button>
                                </div>

                                {/* Close button — only when not activating */}
                                {planStatus !== 'activating' && (
                                    <button
                                        onClick={() => setShowPaymentSuccess(false)}
                                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        aria-label="Cerrar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <ModernProfessionalDashboard
                setShowCalendar={setShowCalendar}
                setDiaryPatient={setDiaryPatient}
            />

            {/* ── Full-calendar slide-over drawer ── */}
            <AnimatePresence>
                {showCalendar && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="cal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setShowCalendar(false)}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            key="cal-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-5xl  z-50 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col"
                        >
                            {/* Drawer header */}
                            <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 shrink-0">
                                <button
                                    onClick={() => setShowCalendar(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                    aria-label="Cerrar agenda"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <h2 className="text-sm font-bold text-gray-900">Agenda completa</h2>
                            </div>

                            {/* Calendar content */}
                            <div className="flex-1 p-4 md:p-6">
                                <AppointmentsCalendar />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default ProfessionalDashboardWrapper