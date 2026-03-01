/**
 * SessionNotesFeed.jsx
 * Shows professional-written notes/summaries for completed sessions
 * fetched from the diary (type === 'professional-note').
 * Falls back to a friendly empty-state when no notes exist.
 */
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@features/auth/AuthContext'
import { diaryService } from '@shared/services/diaryService'

const SessionNotesFeed = () => {
  const { user } = useAuth()
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const patientId = user?._id || user?.id
      if (!patientId) return
      const res  = await diaryService.getNotes(patientId)
      const all  = res.data?.data || res.data || []
      const prof = all.filter((n) => n.type === 'professional-note' || n.author === 'professional')
      setNotes(prof.slice(0, 3)) // latest 3
    } catch {
      setNotes([]) // silent fail — backend may not have notes yet
    } finally {
      setLoading(false)
    }
  }

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
          Notas de sesión
        </p>
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-stone-100 rounded-xl animate-pulse mb-2" />
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
          Notas de sesión
        </p>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <svg className="w-8 h-8 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs text-stone-400">
            Las notas de tu profesional aparecerán aquí después de cada sesión.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
        Notas de sesión
      </p>
      <ul className="space-y-3">
        {notes.map((note, i) => (
          <motion.li
            key={note._id || i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 p-3 bg-sky-50 border border-sky-100 rounded-xl"
          >
            <div className="mt-0.5 w-6 h-6 rounded-lg bg-sky-200 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-sky-400 font-medium mb-0.5">
                {note.date ? fmtDate(note.date) : 'Reciente'} · {note.authorName || 'Tu profesional'}
              </p>
              <p className="text-xs text-stone-700 leading-snug line-clamp-3">{note.content}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export default SessionNotesFeed
