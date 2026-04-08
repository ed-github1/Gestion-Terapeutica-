import { motion } from 'motion/react'
import { Clock, Video, User, ExternalLink, FileText, CheckCircle2, Mic } from 'lucide-react'

const SessionSummaryCard = ({ appointment, index, onOpen }) => {
  const appt = appointment
  const dateStr = appt.callStartedAt || appt.fechaHora || appt.date
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const formattedTime = dateStr
    ? new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : ''
  const duration = appt.callDuration
    ? (appt.callDuration >= 60
        ? `${Math.floor(appt.callDuration / 60)}h ${Math.round(appt.callDuration % 60)}min`
        : `${Math.round(appt.callDuration)} min`)
    : appt.duration ? `${appt.duration} min` : null
  const isVideoCall = appt.isVideoCall || appt.mode === 'videollamada'
  const hasNotes = !!(appt.sessionNotes || appt.notes)
  const hasTranscript = !!(appt.transcript || appt.transcriptStatus === 'ready')
  const notePreview = (appt.sessionNotes || appt.notes || '').slice(0, 120)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.04 }}
      className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      {/* Header */}
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-start gap-2.5 sm:gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isVideoCall ? 'bg-sky-50 dark:bg-sky-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          {isVideoCall
            ? <Video className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            : <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
            {formattedDate}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {formattedTime && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" /> {formattedTime}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" /> {duration}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isVideoCall
                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                : 'bg-gray-100 dark:bg-[#0f1623] text-gray-500 dark:text-gray-400'
            }`}>
              {isVideoCall ? 'Videollamada' : 'Presencial'}
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
      </div>

      {/* Note preview */}
      {notePreview && (
        <div className="px-3 sm:px-5 pb-2 sm:pb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{notePreview}{notePreview.length >= 120 ? '…' : ''}</p>
        </div>
      )}

      {/* Footer badges */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {hasNotes && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
            <FileText className="w-2.5 h-2.5" /> Notas
          </span>
        )}
        {hasTranscript && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Mic className="w-2.5 h-2.5" /> Transcripción
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-2.5 h-2.5" /> Completada
        </span>
      </div>
    </motion.div>
  )
}

export default SessionSummaryCard
