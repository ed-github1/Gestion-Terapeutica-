import { motion } from 'motion/react'
import { FileText, AlertCircle, Send } from 'lucide-react'
import ClinicalNoteCard from '../cards/ClinicalNoteCard'

const NotesTab = ({ pFirstName, clinicalNotes, newNote, setNewNote, isSubmitting, handleAddNote, error, setError }) => (
  <div className="space-y-4">
    {/* Add note form */}
    <form onSubmit={handleAddNote} className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nueva nota clínica</p>
      <div className="flex gap-2 items-end">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder={`Añadir nota sobre ${pFirstName || 'el paciente'}…`}
          rows={2}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#2d3748] rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-[#0f1623] dark:text-gray-100 dark:placeholder-gray-500"
        />
        <motion.button
          type="submit"
          disabled={isSubmitting || !newNote.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="shrink-0 p-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send className="w-4 h-4" />}
        </motion.button>
      </div>
      {error && (
        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto underline">Cerrar</button>
        </p>
      )}
    </form>

    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Notas clínicas</h3>
      <span className="text-xs text-gray-400 dark:text-gray-500">{clinicalNotes.length} {clinicalNotes.length === 1 ? 'nota' : 'notas'}</span>
    </div>
    {clinicalNotes.length === 0 ? (
      <div className="text-center py-10">
        <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <FileText className="w-7 h-7 text-sky-300 dark:text-sky-600" />
        </div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Sin notas clínicas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Usa el formulario de arriba para añadir la primera nota</p>
      </div>
    ) : (
      clinicalNotes.map((note, i) => (
        <ClinicalNoteCard key={note._id || note.id || i} note={note} index={i} />
      ))
    )}
  </div>
)

export default NotesTab
