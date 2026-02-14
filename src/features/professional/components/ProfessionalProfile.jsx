import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Save, ArrowLeft } from 'lucide-react'

const ProfessionalProfile = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)

    // Extract user data with fallbacks
    const fullName = user?.name || user?.nombre || 'Professional'
    const firstName = fullName.split(' ')[0]
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const [profileData, setProfileData] = useState({
        name: fullName,
        email: user?.email || user?.correo || '',
        phone: user?.phone || user?.telefono || '',
        specialty: user?.specialty || user?.especialidad || '',
        licenseNumber: user?.licenseNumber || user?.numeroLicencia || '',
        address: user?.address || user?.direccion || '',
        joinDate: user?.joinDate || user?.fechaRegistro || new Date().toLocaleDateString(),
    })

    const handleSave = () => {
        // TODO: Implement API call to update profile
        setIsEditing(false)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Volver</span>
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
                            {/* Avatar */}
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white text-4xl font-bold mb-4 shadow-xl">
                                {initials}
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h2>
                            <p className="text-gray-600 mb-6">{profileData.specialty || 'Profesional de Salud'}</p>

                            {/* Stats */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-600">Pacientes Activos</span>
                                    <span className="text-lg font-bold text-gray-900">-</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-600">Sesiones Totales</span>
                                    <span className="text-lg font-bold text-gray-900">-</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-600">Miembro Desde</span>
                                    <span className="text-sm font-semibold text-gray-900">{profileData.joinDate}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.div>

                    {/* Information Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-gray-900">Información Personal</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                                    >
                                        Editar Perfil
                                    </button>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <User className="w-4 h-4" />
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Mail className="w-4 h-4" />
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Phone className="w-4 h-4" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Specialty */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Briefcase className="w-4 h-4" />
                                        Especialidad
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.specialty}
                                        onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* License Number */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        Número de Licencia
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.licenseNumber}
                                        onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.address}
                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ProfessionalProfile
