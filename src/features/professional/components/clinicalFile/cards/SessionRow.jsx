import { motion } from 'motion/react'
import { Video, MapPin, Clock } from 'lucide-react'

const SHORT_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const SessionRow = ({ session, index, isFirst, isLast }) => {
  const d = new Date(session.date)
  const day = d.getDate()
  const month = SHORT_MONTHS[d.getMonth()]
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' })
  const isVideo = session.type === 'Videollamada'

  const dotClass = isVideo
    ? 'w-2 h-2 rounded-full bg-sky-400 dark:bg-sky-500'
    : 'w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500'
  const spineColor = 'border-gray-300/60 dark:border-gray-600/40'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.055, duration: 0.28 }}
      className="flex items-stretch gap-2"
    >
      {/* Date stamp */}
      <div className="w-10 shrink-0 text-right pt-3">
        <div className="text-sm font-bold leading-none text-gray-700 dark:text-gray-300">{day}</div>
        <div className="text-[10px] uppercase text-gray-400 dark:text-gray-500 mt-0.5">{month}</div>
      </div>

      {/* Timeline spine */}
      <div className="relative flex flex-col items-center shrink-0 self-stretch" style={{ width: '10px' }}>
        {isFirst ? (
          <div style={{ height: '15px' }} />
        ) : (
          <div className={`w-0 border-l-2 border-dashed ${spineColor}`} style={{ height: '15px' }} />
        )}
        <div className={`rounded-full shrink-0 z-10 transition-all ${dotClass}`} />
        {!isLast && <div className={`w-0 border-l-2 border-dashed flex-1 ${spineColor}`} />}
      </div>

      {/* Session card */}
      <div className="flex-1 pb-1.5">
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-2xl px-4 py-3 group hover:shadow-sm transition-shadow duration-200">
          <div className="flex items-start gap-3">
            {/* Session number badge */}
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-xs font-black text-blue-700 dark:text-sky-400 shrink-0">
              #{session.number}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{weekday}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  {session.duration} min
                </span>
                <span className={`flex items-center gap-0.5 text-[10px] border px-1.5 py-0.5 rounded-full font-medium ${
                  isVideo
                    ? 'border-sky-200 dark:border-sky-700/60 text-sky-600 dark:text-sky-400'
                    : 'border-amber-200 dark:border-amber-700/60 text-amber-600 dark:text-amber-400'
                }`}>
                  {isVideo ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {session.type}
                </span>
              </div>
            </div>

            {/* Mood */}
            {session.mood && session.mood !== '—' && (
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{session.mood}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SessionRow
