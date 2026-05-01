import { useAuth } from '@features/auth/AuthContext'
import { motion } from 'motion/react'
import { LogOut, Mail, User } from 'lucide-react'
import TherapistCard from './components/TherapistCard'

const PatientProfile = () => {
  const { user, logout } = useAuth()

  const fullName = user?.name || user?.nombre || 'Paciente'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const email = user?.email || user?.correo || ''

  const rows = [
    { icon: User, label: 'Nombre', value: fullName },
    { icon: Mail, label: 'Correo', value: email },
  ]

  return (
    <div className="min-h-full p-4 md:p-6 max-w-md mx-auto space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        {/* Avatar header */}
        <div className="bg-[#0075C9] px-6 py-10 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {initials}
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white leading-tight">{fullName}</h1>
            <p className="text-sm text-white/75 mt-0.5">{email}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" strokeWidth={1.8} />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-5">
          <button
            onClick={logout}
            className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </motion.div>

      <TherapistCard />
    </div>
  )
}

export default PatientProfile
