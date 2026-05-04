import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { CalendarPlus, UserRound } from 'lucide-react'
import { patientsService } from '@shared/services/patientsService'

const TherapistCard = ({ onRequestNew }) => {
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientsService.getMyProfessional()
      .then(res => {
        const p = res?.data?.data || res?.data
        setProfessional(p || null)
      })
      .catch(() => setProfessional(null))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !professional) return null

  const name = professional?.name || professional?.nombre || 'Tu profesional'
  const spec = professional?.specialty || professional?.specialization || professional?.especialidad || 'Psicología clínica'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-white dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 shadow-sm p-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
        Tu Terapeuta
      </p>

      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {professional?.photoUrl ? (
              <img
                src={professional.photoUrl}
                alt={name}
                className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-400/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-blue-400/20">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{spec}</p>
            </div>
            <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
              <UserRound className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>


        </>
      )}
    </motion.div>
  )
}

export default TherapistCard
