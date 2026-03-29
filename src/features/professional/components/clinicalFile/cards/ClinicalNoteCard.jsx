import { motion } from 'motion/react'
import { FileText, Hash } from 'lucide-react'
import { rel } from '../constants'

const ClinicalNoteCard = ({ note, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
    className="bg-white dark:bg-[#1a2234] rounded-2xl border border-sky-100 dark:border-sky-900/30 p-5"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Sesión #{note.sessionNumber}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{note.author}</p>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{rel(note.date)}</span>
    </div>
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.text}</p>
    {note.tags?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {note.tags.map(tag => (
          <span key={tag} className="flex items-center gap-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full">
            <Hash className="w-2.5 h-2.5" /> {tag}
          </span>
        ))}
      </div>
    )}
  </motion.div>
)

export default ClinicalNoteCard
