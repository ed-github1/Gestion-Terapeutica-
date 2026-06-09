import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import { professionalsService } from '@shared/services/professionalsService'

// ─── Section ───────────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/40">{children}</div>
    </div>
)

// ─── Row ───────────────────────────────────────────────────────────────────────
const Row = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-6 px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">
        <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {description && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
)

// ─── Main component ────────────────────────────────────────────────────────────
const ProfessionalSettings = ({ embedded = false }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [kycStatus, setKycStatus] = useState(null)

    useEffect(() => {
        professionalsService.getMyProfile()
            .then(res => { if (res?.data) setKycStatus(res.data.kycStatus ?? null) })
            .catch(() => {})
    }, [])

    const fullName = user?.name || user?.nombre || 'Profesional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const isVerified = kycStatus === 'approved'

    return (
        <div className={embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6 lg:p-8'}>
            <div className={embedded ? 'space-y-4' : 'max-w-full space-y-4'}>

                {/* ── Profile card ── */}
                {!embedded && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center gap-4 px-6 py-5"
                    >
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-lg font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{fullName}</p>
                                {isVerified && (
                                    <svg className="w-4 h-4 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.email || user?.correo || ''}</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/professional/profile')}
                            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 shrink-0"
                        >
                            Editar perfil
                        </button>
                    </motion.div>
                )}

                {/* ── Security ── */}
                <Section title="Seguridad" subtitle="Controla el acceso y privacidad de tu cuenta">
                    <Row label="Contraseña" description="Actualiza tu contraseña regularmente">
                        <button
                            onClick={() => setShowPasswordForm(s => !s)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            {showPasswordForm ? 'Cancelar' : 'Cambiar'}
                        </button>
                    </Row>
                    <AnimatePresence>
                        {showPasswordForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-5 pt-1">
                                    <ChangePasswordForm />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Section>

                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalSettings
