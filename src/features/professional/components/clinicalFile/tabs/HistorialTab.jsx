import { useMemo } from 'react'
import { motion } from 'motion/react'
import {
  FileText, Mic, Video, User as UserIcon,
  Clock, CheckCircle2, ExternalLink, Hash,
} from 'lucide-react'
import { rel } from '../constants'

// ── Inline note entry ─────────────────────────────────────────────────────────
const NoteEntry = ({ note, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, delay: Math.min(index, 8) * 0.03 }}
    className="flex gap-3"
  >
    {/* Left accent */}
    <div className="flex flex-col items-center shrink-0 pt-1">
      <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
        <FileText className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
      </div>
      <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700/50 mt-2" />
    </div>

    {/* Content */}
    <div className="flex-1 pb-5 min-w-0">
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-sky-100 dark:border-sky-900/30 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Nota clínica{note.sessionNumber ? ` · Sesión #${note.sessionNumber}` : ''}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{note.author}</p>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{rel(note.date)}</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.text || note.notes}</p>
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full">
                <Hash className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </motion.div>
)

// ── Inline session entry ──────────────────────────────────────────────────────
const SessionEntry = ({ appt, index, navigate }) => {
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 8) * 0.03 }}
      className="flex gap-3"
    >
      {/* Left accent */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
          isVideoCall ? 'bg-sky-50 dark:bg-sky-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          {isVideoCall
            ? <Video className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            : <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        </div>
        <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700/50 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div
          className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/professional/session-summary/${appt._id || appt.id}`)}
        >
          <div className="px-4 pt-3.5 pb-2.5 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{formattedDate}</p>
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
            <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
          </div>
          {notePreview && (
            <div className="px-4 pb-2.5">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                {notePreview}{notePreview.length >= 120 ? '…' : ''}
              </p>
            </div>
          )}
          <div className="px-4 pb-3.5 flex flex-wrap items-center gap-1.5">
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
        </div>
      </div>
    </motion.div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
const HistorialTab = ({
  clinicalNotes,
  sessionSummaries, navigate,
}) => {
  // Merge notes + sessions into one chronological feed (newest first)
  const feed = useMemo(() => {
    const notes = clinicalNotes.map(n => ({
      _type: 'note',
      _date: new Date(n.date || 0).getTime(),
      data: n,
    }))
    const sessions = sessionSummaries.map(a => ({
      _type: 'session',
      _date: new Date(a.callStartedAt || a.fechaHora || a.date || 0).getTime(),
      data: a,
    }))
    return [...notes, ...sessions].sort((a, b) => b._date - a._date)
  }, [clinicalNotes, sessionSummaries])

  return (
    <div className="space-y-4">
      {/* ── Unified feed ── */}
      <div className="flex items-center justify-between px-0.5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Actividad clínica</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">{feed.length} {feed.length === 1 ? 'entrada' : 'entradas'}</span>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-sky-300 dark:text-sky-600" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-400">Sin actividad registrada</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Las notas y sesiones aparecerán aquí</p>
        </div>
      ) : (
        <div>
          {feed.map((item, i) =>
            item._type === 'note'
              ? <NoteEntry key={item.data._id || item.data.id || `n${i}`} note={item.data} index={i} />
              : <SessionEntry key={item.data._id || item.data.id || `s${i}`} appt={item.data} index={i} navigate={navigate} />
          )}
        </div>
      )}
    </div>
  )
}

export default HistorialTab
