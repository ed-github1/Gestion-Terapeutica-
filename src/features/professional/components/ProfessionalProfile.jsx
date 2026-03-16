import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Briefcase, Save, ArrowLeft, Hash, LogOut, Shield } from 'lucide-react'
import { KpiChip, KpiChipSkeleton } from './dashboard'
import { buildKpis } from '../hooks'
import { useDashboardData } from '../dashboard/useDashboard'

// ─── Field helper (dark) ──────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, type = 'text', value, onChange, disabled }) => (
    <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
            {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                       focus:ring-2 focus:ring-sky-500 focus:border-transparent transition outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
        />
    </div>
)

// ─── Component ────────────────────────────────────────────────────────────────
const ProfessionalProfile = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const { stats, loading } = useDashboardData()
    const kpis = buildKpis(stats, 'Esta semana')

    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
        <div className="dark min-h-screen bg-gray-950 p-3 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* ── Page header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-800 transition-all text-gray-500 hover:text-gray-200 border border-transparent hover:border-gray-700 shrink-0"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-white leading-none">Mi Perfil</h1>
                        <p className="text-[11px] text-gray-500 mt-0.5">Gestiona tu información personal</p>
                    </div>
                </motion.div>

                {/* ── Stats KPIs ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* LEFT — identity card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-6 flex flex-col items-center text-center"
                    >
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                            {initials}
                        </div>

                        <h2 className="text-sm font-bold text-white leading-tight">{fullName}</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5 mb-5">
                            {profileData.specialty || 'Profesional de Salud'}
                        </p>

                        {/* Role badge */}
                        <div className="flex items-center gap-1.5 bg-sky-950 border border-sky-800 rounded-lg px-3 py-1.5 mb-5 w-full justify-center">
                            <Shield className="w-3 h-3 text-sky-400" />
                            <span className="text-[11px] font-semibold text-sky-300">Profesional verificado</span>
                        </div>

                        {/* Email quick-view */}
                        <div className="w-full p-3 bg-gray-800 border border-gray-700/50 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Email</p>
                            <p className="text-xs font-medium text-gray-300 truncate">{profileData.email || '—'}</p>
                        </div>

                        {/* Joined */}
                        <div className="w-full p-3 bg-gray-800 border border-gray-700/50 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Miembro desde</p>
                            <p className="text-xs font-medium text-gray-300">{joinDate}</p>
                        </div>

                        {/* License quick-view */}
                        <div className="w-full p-3 bg-gray-800 border border-gray-700/50 rounded-xl text-left mb-5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Licencia</p>
                            <p className="text-xs font-medium text-gray-300">{profileData.licenseNumber || '—'}</p>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-950 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900 transition-colors border border-red-900/60"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Cerrar Sesión
                        </button>
                    </motion.div>

                    {/* RIGHT — editable info */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 }}
                        className="lg:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-6"
                    >
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-white leading-none">Información Personal</h3>
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
                                        className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
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
                        <div className="border-t border-gray-800 mb-5" />

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
                            <p className="text-[10px] text-gray-700 mt-5">
                                Pulsa <span className="font-semibold text-sky-500">Editar</span> para modificar tu información
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalProfile
