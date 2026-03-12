import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Briefcase, Save, ArrowLeft, Hash, LogOut, Shield } from 'lucide-react'

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, type = 'text', value, onChange, disabled }) => (
    <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
            {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-gray-200 rounded-lg text-gray-900
                       focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50"
        />
    </div>
)

// ─── KPI chip ─────────────────────────────────────────────────────────────────
const KpiItem = ({ value, label, border }) => (
    <div className={`flex-1 flex flex-col gap-0.5 px-4 py-2 ${border ? 'border-l border-gray-200' : ''}`}>
        <span className="text-[15px] font-bold text-gray-900 leading-none">{value}</span>
        <span className="text-[11px] text-gray-500 leading-none">{label}</span>
    </div>
)

// ─── Component ────────────────────────────────────────────────────────────────
const ProfessionalProfile = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)

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
        <div className="min-h-screen bg-stone-50 p-3 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* ── Page header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-gray-700 border border-transparent hover:border-gray-200 shrink-0"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-none">Mi Perfil</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5">Gestiona tu información personal</p>
                    </div>
                </motion.div>

                {/* ── KPI bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center overflow-hidden"
                >
                    <KpiItem value={initials}       label="Iniciales"       border={false} />
                    <KpiItem value="—"              label="Pacientes"       border />
                    <KpiItem value="—"              label="Sesiones"        border />
                    <KpiItem value={joinDate}       label="Miembro desde"   border />
                </motion.div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* LEFT — identity card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center"
                    >
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-700 to-sky-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                            {initials}
                        </div>

                        <h2 className="text-sm font-bold text-gray-900 leading-tight">{fullName}</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5 mb-5">
                            {profileData.specialty || 'Profesional de Salud'}
                        </p>

                        {/* Role badge */}
                        <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5 mb-5 w-full justify-center">
                            <Shield className="w-3 h-3 text-sky-500" />
                            <span className="text-[11px] font-semibold text-sky-700">Profesional verificado</span>
                        </div>

                        {/* Email quick-view */}
                        <div className="w-full p-3 bg-stone-50 border border-gray-100 rounded-xl text-left mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Email</p>
                            <p className="text-xs font-medium text-gray-700 truncate">{profileData.email || '—'}</p>
                        </div>

                        {/* License quick-view */}
                        <div className="w-full p-3 bg-stone-50 border border-gray-100 rounded-xl text-left mb-5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Licencia</p>
                            <p className="text-xs font-medium text-gray-700">{profileData.licenseNumber || '—'}</p>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
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
                        className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
                    >
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 leading-none">Información Personal</h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">Actualiza tus datos de contacto y profesionales</p>
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 bg-stone-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <Save className="w-3 h-3" />
                                        Guardar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 mb-5" />

                        {/* Fields grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre completo"    icon={User}     value={profileData.name}          onChange={set('name')}          disabled={!isEditing} />
                            <Field label="Correo electrónico" icon={Mail}     type="email" value={profileData.email} onChange={set('email')}     disabled={!isEditing} />
                            <Field label="Teléfono"           icon={Phone}    type="tel"   value={profileData.phone} onChange={set('phone')}     disabled={!isEditing} />
                            <Field label="Especialidad"       icon={Briefcase} value={profileData.specialty}    onChange={set('specialty')}     disabled={!isEditing} />
                            <Field label="Número de licencia" icon={Hash}     value={profileData.licenseNumber} onChange={set('licenseNumber')} disabled={!isEditing} />
                            <Field label="Dirección"          icon={MapPin}   value={profileData.address}       onChange={set('address')}       disabled={!isEditing} />
                        </div>

                        {/* Edit hint */}
                        {!isEditing && (
                            <p className="text-[10px] text-gray-300 mt-5">
                                Pulsa <span className="font-semibold text-sky-400">Editar</span> para modificar tu información
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalProfile
