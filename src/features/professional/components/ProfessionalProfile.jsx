import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth'
import { EditProfileForm } from '@features/auth'
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
</div>
      
                {/* ── Account fields (nombre, apellido, email) ── */}
                <EditProfileForm />
            </div>
        </div>
    )
}

export default ProfessionalProfile
