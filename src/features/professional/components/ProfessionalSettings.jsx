import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrencyForCountry } from '@shared/constants/subscriptionPlans'
import { professionalsService } from '@shared/services/professionalsService'
import { statsService } from '@shared/services/statsService'
import { showToast } from '@shared/ui/Toast'
import apiClient, { safeRedirect } from '@shared/api/client'
import mpLogo from '@assets/LOGO_MP.svg'

// ─── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
)

// ─── Select ────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
    >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
)

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

const inputCls = `text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5
  text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition`

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const FlagImg = ({ code, size = 28 }) => {
    if (!code || code === 'OTHER') return <span style={{ fontSize: size }} className="leading-none">🌎</span>
    return (
        <img
            src={`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@2.6.0/flags/${code.toLowerCase()}.svg`}
            width={size}
            height={size}
            alt={code}
            className="shrink-0"
        />
    )
}

// ─── Main component ────────────────────────────────────────────────────────────
const ProfessionalSettings = ({ embedded = false }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [saved, setSaved] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [kycStatus, setKycStatus] = useState(null)
    const [mpConnected, setMpConnected] = useState(false)
    const [mpConnecting, setMpConnecting] = useState(false)
    const [mpMenuOpen, setMpMenuOpen] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const mp = params.get('mp')
        if (!mp) return
        if (mp === 'connected') {
            setMpConnected(true)
            showToast('Cuenta de MercadoPago conectada', 'success')
        } else if (mp === 'error') {
            showToast('Error al conectar MercadoPago, intenta de nuevo', 'error')
        }
        window.history.replaceState({}, '', location.pathname)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const countryInfo = getCurrencyForCountry(user?.country)

    const [notif, setNotif] = useState({
        emailAppointments: true,
        emailReminders: true,
        push: true,
    })

    const [practice, setPractice] = useState(() => {
        try {
            const saved = sessionStorage.getItem('professionalSettings')
            if (saved) {
                const parsed = JSON.parse(saved)
                return {
                    ...{
                        videoCallEnabled: true,
                        autoConfirm: false,
                        reminderHours: '24',
                        sessionDuration: '60',
                        currency: 'MXN',
                        sessionTypePrices: { primeraSesion: 50, seguimiento: 40, extraordinaria: 70 },
                    }, ...parsed
                }
            }
        } catch { /* ignore */ }
        const defaultCurrency = getCurrencyForCountry(user?.country).currency
        return {
            videoCallEnabled: true,
            autoConfirm: false,
            reminderHours: '24',
            sessionDuration: '60',
            currency: defaultCurrency,
            sessionTypePrices: { primeraSesion: 50, seguimiento: 40, extraordinaria: 70 },
        }
    })

    const [contacto, setContacto] = useState({
        telefono: '', calle: '', ciudad: '', estado: '', codigoPostal: '',
    })

    const [horario, setHorario] = useState({
        dias: [], horaInicio: '09:00', horaFin: '18:00',
    })

    useEffect(() => {
        Promise.allSettled([
            professionalsService.getMyTarifas(),
            statsService.getProfessionalSettings(),
            professionalsService.getMyProfile(),
        ]).then(([tarifasResult, settingsResult, profileResult]) => {
            if (tarifasResult.status === 'fulfilled' && tarifasResult.value?.data) {
                const t = tarifasResult.value.data
                setPractice(prev => ({
                    ...prev,
                    sessionTypePrices: {
                        primeraSesion:  t.primeraSesion  ?? prev.sessionTypePrices.primeraSesion,
                        seguimiento:    t.seguimiento    ?? prev.sessionTypePrices.seguimiento,
                        extraordinaria: t.extraordinaria ?? prev.sessionTypePrices.extraordinaria,
                    },
                }))
            }
            if (settingsResult.status === 'fulfilled' && settingsResult.value?.data) {
                const s = settingsResult.value.data
                if (s.notifications) setNotif(s.notifications)
                setPractice(prev => ({
                    ...prev,
                    videoCallEnabled: s.videoCallEnabled ?? prev.videoCallEnabled,
                    autoConfirm:      s.autoConfirm      ?? prev.autoConfirm,
                    reminderHours:    s.reminderHours    ?? prev.reminderHours,
                    sessionDuration:  s.sessionDuration  ?? prev.sessionDuration,
                }))
            }
            if (profileResult.status === 'fulfilled' && profileResult.value?.data) {
                const p = profileResult.value.data
                const dp = p.datosPersonales || {}
                const dir = dp.direccionConsultorio || {}
                const ha = p.horarioAtencion || {}
                setKycStatus(p.kycStatus ?? null)
                setContacto({
                    telefono:     dp.telefono      || '',
                    calle:        dir.calle        || '',
                    ciudad:       dir.ciudad       || '',
                    estado:       dir.estado       || '',
                    codigoPostal: dir.codigoPostal || '',
                })
                setHorario({
                    dias:       ha.dias       || [],
                    horaInicio: ha.horaInicio || '09:00',
                    horaFin:    ha.horaFin    || '18:00',
                })
            }
        })
    }, [])

    useEffect(() => {
        setMpConnected(user?.mpConnected ?? false)
    }, [user])

    const handleConnectMP = async () => {
        setMpConnecting(true)
        try {
            const res = await apiClient.get('/auth/mercadopago/connect')
            safeRedirect(res.data?.url)
        } catch {
            showToast('No se pudo iniciar la conexión con MercadoPago.', 'error')
            setMpConnecting(false)
        }
    }

    const handleDisconnectMP = async () => {
        setMpMenuOpen(false)
        try {
            await apiClient.post('/auth/mercadopago/disconnect')
            setMpConnected(false)
            showToast('Cuenta de MercadoPago desconectada', 'success')
        } catch {
            showToast('No se pudo desconectar MercadoPago.', 'error')
        }
    }

    const setN = (key) => (val) => setNotif(prev => ({ ...prev, [key]: val }))
    const setP = (key) => (val) => setPractice(prev => ({ ...prev, [key]: val }))

    const handleSave = async () => {
        sessionStorage.setItem('professionalSettings', JSON.stringify(practice))
        localStorage.setItem('professionalSettings', JSON.stringify({
            currency: practice.currency,
            sessionTypePrices: practice.sessionTypePrices,
        }))
        await Promise.allSettled([
            professionalsService.updateMyTarifas(practice.sessionTypePrices),
            statsService.updateProfessionalSettings({
                notifications: notif,
                videoCallEnabled: practice.videoCallEnabled,
                autoConfirm: practice.autoConfirm,
                reminderHours: practice.reminderHours,
                sessionDuration: practice.sessionDuration,
            }),
            professionalsService.updateProfile({
                datosPersonales: {
                    telefono: contacto.telefono,
                    direccionConsultorio: {
                        calle:        contacto.calle,
                        ciudad:       contacto.ciudad,
                        estado:       contacto.estado,
                        codigoPostal: contacto.codigoPostal,
                    },
                },
                horarioAtencion: horario,
            }),
        ])
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

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
