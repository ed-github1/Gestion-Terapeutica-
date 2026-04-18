import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Briefcase, Save, ArrowLeft, Hash, LogOut, Shield, Crown, Zap, Settings } from 'lucide-react'
import { KpiChip, KpiChipSkeleton } from './dashboard'
import { buildKpis } from '../hooks'
import { useDashboardData } from '../hooks/useDashboard'

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, type = 'text', value, onChange, disabled }) => (
    <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-1.5">
            {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/60"
        />
    </div>
)

// ─── Component ────────────────────────────────────────────────────────────────
const ProfessionalProfile = ({ embedded = false }) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const { stats, loading } = useDashboardData()
    const kpis = buildKpis(stats, 'Esta semana')

    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const planRaw = (user?.subscriptionPlan || user?.plan || user?.planType || 'GRATUITO').toUpperCase()
    const isPro   = planRaw === 'PRO' || planRaw === 'EMPRESA'
    const joinDate  = user?.joinDate || user?.fechaRegistro
        ? new Date(user.joinDate || user.fechaRegistro).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })

    const [profileData, setProfileData] = useState({
        name:          fullName,
        email:         user?.email         || user?.correo         || '',
        phone:         user?.phone         || user?.telefono       || '',
        specialty:     user?.specialty     || user?.especialidad   || '',
        licenseNumber: user?.licenseNumber || user?.numeroLicencia || '',
        address:       user?.address       || user?.direccion      || '',
    })

    const set = (key) => (e) => setProfileData(prev => ({ ...prev, [key]: e.target.value }))

    const handleSave = () => {
        // TODO: connect to API
        setIsEditing(false)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className={embedded ? 'space-y-4' : 'min-h-screen bg-gray-50 dark:bg-gray-950 p-3 md:p-6 lg:p-8'}>
            <div className={embedded ? 'space-y-4' : 'max-w-5xl mx-auto space-y-4'}>

                {/* ── Page header ── */}
                {!embedded && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shrink-0"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Mi Perfil</h1>
                        <p className="text-[11px] text-gray-500 mt-0.5">Gestiona tu información personal</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/professional/settings')}
                        className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shrink-0"
                        aria-label="Configuración"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </motion.div>
                )}

                {/* ── Stats KPIs ── */}
                {!embedded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>
                )}

                {/* ── Main grid ── */}
                <div className={embedded ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>

                    {/* LEFT — identity card */}
                    {!embedded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-xl p-6 flex flex-col items-center text-center"
                    >
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                            {initials}
                        </div>

                        <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{fullName}</h2>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5 mb-5">
                            <p className="text-[11px] text-gray-500">
                                {profileData.specialty || 'Profesional de Salud'}
                            </p>
                            {isPro && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#0075C9] text-white uppercase tracking-wide leading-none">
                                    {planRaw === 'EMPRESA' ? 'Empresa' : 'Pro'}
                                </span>
                            )}
                        </div>

                        {/* Role badge */}
                        <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-1.5 mb-5 w-full justify-center">
                            <Shield className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">Profesional verificado</span>
                        </div>

                        {/* Email quick-view */}
                        <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Email</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{profileData.email || '—'}</p>
                        </div>

                        {/* Joined */}
                        <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Miembro desde</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{joinDate}</p>
                        </div>

                        {/* License quick-view */}
                        <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Licencia</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{profileData.licenseNumber || '—'}</p>
                        </div>

                        {/* Subscription plan */}
                        {isPro ? (
                            <div className="w-full p-3 rounded-xl text-left mb-5 border border-[#0075C9]/40 bg-[#0075C9]/10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-[#0075C9]/10 to-transparent pointer-events-none" />
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Crown className="w-3 h-3 text-[#54C0E8]" strokeWidth={2} />
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#54C0E8]">Plan activo</p>
                                </div>
                                <p className="text-xs font-bold text-white">{planRaw === 'EMPRESA' ? 'Empresa' : 'Pro'}</p>
                                <p className="text-[10px] text-[#54C0E8]/70 mt-0.5">Todas las funciones desbloqueadas</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/pricing')}
                                className="w-full p-3 rounded-xl text-left mb-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors group select-none"
                            >
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Zap className="w-3 h-3 text-gray-400 dark:text-gray-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" strokeWidth={2} />
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">Plan actual</p>
                                </div>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Gratuito</p>
                                <p className="text-[10px] text-sky-600 dark:text-sky-500 mt-0.5">Actualizar a Pro →</p>
                            </button>
                        )}

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900 transition-colors border border-red-200 dark:border-red-900/60"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Cerrar Sesión
                        </button>
                    </motion.div>
                    )}

                    {/* RIGHT — editable info */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 }}
                        className={`${embedded ? '' : 'lg:col-span-2 '}bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-xl p-6`}
                    >
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Información Personal</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Actualiza tus datos de contacto y profesionales</p>
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <Save className="w-3 h-3" />
                                        Guardar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-800 mb-5" />

                        {/* Fields grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre completo"    icon={User}      value={profileData.name}          onChange={set('name')}          disabled={!isEditing} />
                            <Field label="Correo electrónico" icon={Mail}      type="email" value={profileData.email} onChange={set('email')}     disabled={!isEditing} />
                            <Field label="Teléfono"           icon={Phone}     type="tel"   value={profileData.phone} onChange={set('phone')}     disabled={!isEditing} />
                            <Field label="Especialidad"       icon={Briefcase} value={profileData.specialty}    onChange={set('specialty')}      disabled={!isEditing} />
                            <Field label="Número de licencia" icon={Hash}      value={profileData.licenseNumber} onChange={set('licenseNumber')} disabled={!isEditing} />
                            <Field label="Dirección"          icon={MapPin}    value={profileData.address}       onChange={set('address')}        disabled={!isEditing} />
                        </div>

                        {/* Edit hint */}
                        {!isEditing && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-700 mt-5">
                                Pulsa <span className="font-semibold text-sky-600 dark:text-sky-500">Editar</span> para modificar tu información
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalProfile
