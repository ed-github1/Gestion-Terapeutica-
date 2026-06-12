import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Mail, Phone, Globe, Calendar, Star } from 'lucide-react'
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

  const name = professional?.name || professional?.nombre
  const spec = professional?.specialty || professional?.specialization || professional?.especialidad
  const email = professional?.email || professional?.correo
  const phone = professional?.phone || professional?.telefono
  const bio = professional?.bio || professional?.description || professional?.descripcion
  const rating = professional?.rating || professional?.calificacion
  const languages = professional?.languages || professional?.idiomas
  const experience = professional?.experience || professional?.experiencia
  const availability = professional?.availability || professional?.disponibilidad
  const picture = professional?.pictureUrl || professional?.photoUrl

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-4/5" />
          </div>
        </div>
      ) : (
        <>
          {/* Header with avatar */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100 dark:border-gray-700">
            {picture ? (
              <img
                src={picture}
                alt={name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-400/20 shrink-0"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              initials && (
                <div className="w-14 h-14 rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold text-lg shrink-0 ring-2 ring-blue-400/20">
                  {initials}
                </div>
              )
            )}
            <div className="flex-1 min-w-0">
              {name && <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>}
              {spec && <p className="text-[11px] text-gray-500 dark:text-gray-400">{spec}</p>}
              {rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[11px] text-gray-600 dark:text-gray-300">{rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {(email || phone) && (
            <div className="space-y-2 mb-4">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="truncate">{phone}</span>
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div className="mb-4 pb-4 border-b border-stone-100 dark:border-gray-700">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">{bio}</p>
            </div>
          )}

          {/* Details Grid */}
          {(experience || languages || availability) && (
            <div className="grid grid-cols-2 gap-3">
              {experience && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Experiencia</p>
                  <p className="text-[12px] text-gray-900 dark:text-white">{experience}</p>
                </div>
              )}
              {languages && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Idiomas</p>
                  </div>
                  <p className="text-[12px] text-gray-900 dark:text-white">
                    {Array.isArray(languages) ? languages.join(', ') : languages}
                  </p>
                </div>
              )}
              {availability && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 col-span-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Disponibilidad</p>
                  </div>
                  <p className="text-[12px] text-gray-900 dark:text-white">
                    {typeof availability === 'string' ? availability : availability?.status || 'Disponible'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default TherapistCard
