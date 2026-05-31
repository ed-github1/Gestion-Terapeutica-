import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { ChangePasswordForm } from '@features/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrencyForCountry } from '@shared/constants/subscriptionPlans'
import { professionalsService } from '@shared/services/professionalsService'
import { statsService } from '@shared/services/statsService'
import { showToast } from '@shared/ui/Toast'
import apiClient from '@shared/api/client'
import mpLogo from '@assets/LOGO_MP.png'

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
            window.location.href = res.data?.url
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

                {/* ── Notifications ── */}
                <Section title="Notificaciones" subtitle="Elige cómo y cuándo recibir alertas">
                    <Row label="Nuevas citas por correo" description="Recibe un correo cuando un paciente agende">
                        <Toggle checked={notif.emailAppointments} onChange={setN('emailAppointments')} />
                    </Row>
                    <Row label="Recordatorios por correo" description="24 h antes de cada sesión programada">
                        <Toggle checked={notif.emailReminders} onChange={setN('emailReminders')} />
                    </Row>
                    <Row label="Notificaciones push" description="Citas, sesiones y mensajes de pacientes">
                        <Toggle checked={notif.push} onChange={setN('push')} />
                    </Row>
                </Section>

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

                {/* ── Practice ── */}
                <Section title="Mi consulta" subtitle="Opciones de tu práctica clínica">
                    <Row label="Videollamadas" description="Permitir sesiones de videollamada con pacientes">
                        <Toggle checked={practice.videoCallEnabled} onChange={setP('videoCallEnabled')} />
                    </Row>
                    <Row label="Confirmar citas automáticamente" description="Sin requerir tu aprobación manual">
                        <Toggle checked={practice.autoConfirm} onChange={setP('autoConfirm')} />
                    </Row>
                    <Row label="Recordatorio antes de la cita">
                        <Select
                            value={practice.reminderHours}
                            onChange={setP('reminderHours')}
                            options={[
                                { value: '1',  label: '1 hora antes' },
                                { value: '2',  label: '2 horas antes' },
                                { value: '24', label: '24 horas antes' },
                                { value: '48', label: '48 horas antes' },
                            ]}
                        />
                    </Row>
                    <Row label="Duración de sesión">
                        <Select
                            value={practice.sessionDuration}
                            onChange={setP('sessionDuration')}
                            options={[
                                { value: '30', label: '30 min' },
                                { value: '45', label: '45 min' },
                                { value: '60', label: '60 min' },
                                { value: '90', label: '90 min' },
                            ]}
                        />
                    </Row>
                    <Row label="Moneda">
                        <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FlagImg code={user?.country} />
                            <span>{countryInfo.symbol} {countryInfo.currency}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{countryInfo.currencyLabel}</span>
                        </span>
                    </Row>

                    {/* Prices */}
                    <div className="px-6 py-4 space-y-3">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Precio por tipo de sesión</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Valor predeterminado al crear una cita</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            {[
                                { key: 'primeraSesion',  label: 'Primera consulta' },
                                { key: 'seguimiento',    label: 'Seguimiento' },
                                { key: 'extraordinaria', label: 'Extraordinaria' },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                            {countryInfo.symbol}
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={String(practice.sessionTypePrices?.[key] ?? '')}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    setPractice(prev => ({
                                                        ...prev,
                                                        sessionTypePrices: {
                                                            ...prev.sessionTypePrices,
                                                            [key]: val === '' ? 0 : parseFloat(val) || 0,
                                                        },
                                                    }))
                                                }
                                            }}
                                            className="w-full pl-6 pr-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Contact & office ── */}
                <Section title="Contacto y consultorio" subtitle="Teléfono y dirección de tu consultorio">
                    <Row label="Teléfono">
                        <input
                            type="tel"
                            value={contacto.telefono}
                            onChange={(e) => setContacto(prev => ({ ...prev, telefono: e.target.value }))}
                            placeholder="+52 55 0000 0000"
                            className={`${inputCls} w-44`}
                        />
                    </Row>
                    <div className="px-6 py-4 space-y-2.5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dirección del consultorio</p>
                        <input
                            type="text"
                            value={contacto.calle}
                            onChange={(e) => setContacto(prev => ({ ...prev, calle: e.target.value }))}
                            placeholder="Calle y número"
                            className={`${inputCls} w-full`}
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                            <input
                                type="text"
                                value={contacto.ciudad}
                                onChange={(e) => setContacto(prev => ({ ...prev, ciudad: e.target.value }))}
                                placeholder="Ciudad"
                                className={`${inputCls} w-full`}
                            />
                            <input
                                type="text"
                                value={contacto.estado}
                                onChange={(e) => setContacto(prev => ({ ...prev, estado: e.target.value }))}
                                placeholder="Estado"
                                className={`${inputCls} w-full`}
                            />
                        </div>
                        <input
                            type="text"
                            value={contacto.codigoPostal}
                            onChange={(e) => setContacto(prev => ({ ...prev, codigoPostal: e.target.value }))}
                            placeholder="Código postal"
                            className={`${inputCls} w-36`}
                        />
                    </div>
                </Section>

                {/* ── Schedule ── */}
                <Section title="Horario de atención" subtitle="Días y horas en que atiendes pacientes">
                    <div className="px-6 py-4 space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Días de atención</p>
                        <div className="flex flex-wrap gap-2">
                            {DIAS.map(dia => {
                                const active = horario.dias.includes(dia)
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setHorario(prev => ({
                                            ...prev,
                                            dias: active
                                                ? prev.dias.filter(d => d !== dia)
                                                : [...prev.dias, dia],
                                        }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {dia.slice(0, 3)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <Row label="Hora de inicio">
                        <input
                            type="time"
                            value={horario.horaInicio}
                            onChange={(e) => setHorario(prev => ({ ...prev, horaInicio: e.target.value }))}
                            className={inputCls}
                        />
                    </Row>
                    <Row label="Hora de fin">
                        <input
                            type="time"
                            value={horario.horaFin}
                            onChange={(e) => setHorario(prev => ({ ...prev, horaFin: e.target.value }))}
                            className={inputCls}
                        />
                    </Row>
                </Section>

                {/* ── Payments ── */}
                <Section title="Cobros" subtitle="Conecta tu cuenta de MercadoPago para recibir pagos de tus pacientes">
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 transition-colors">
                            {/* Icon */}
                            <div className="rounded-xl shrink-0 overflow-hidden bg-white border border-gray-200 dark:border-gray-600 p-2 flex items-center justify-center">
                                <img src={mpLogo} alt="MercadoPago" className="h-10 w-auto" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mercado Pago</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {mpConnected ? 'Los pagos se depositan directamente en tu cuenta.' : 'Conecta tu cuenta para recibir pagos automáticamente.'}
                                </p>
                            </div>

                            {/* Action */}
                            {mpConnected ? (
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/40 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Conectado
                                    </span>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setMpMenuOpen(o => !o)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base leading-none font-bold tracking-widest"
                                        >
                                            ···
                                        </button>
                                        {mpMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setMpMenuOpen(false)} />
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg z-20 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={handleDisconnectMP}
                                                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    >
                                                        Desconectar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={mpConnecting}
                                    onClick={handleConnectMP}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                                >
                                    {mpConnecting ? 'Redirigiendo...' : 'Conectar'}
                                </button>
                            )}
                        </div>
                    </div>
                </Section>

                <div className="h-4" />
            </div>
        </div>
    )
}

export default ProfessionalSettings
