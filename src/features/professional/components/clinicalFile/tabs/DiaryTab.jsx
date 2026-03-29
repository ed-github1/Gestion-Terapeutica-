import { BookOpen } from 'lucide-react'
import DiaryCard from '../cards/DiaryCard'

const DiaryTab = ({ diaryEntries, patientId, authorName, handleEntryUpdate }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Entradas del diario</h3>
      <span className="text-xs text-gray-400 dark:text-gray-500">{diaryEntries.length} {diaryEntries.length === 1 ? 'entrada' : 'entradas'}</span>
    </div>
    {diaryEntries.length === 0 ? (
      <div className="text-center py-14">
        <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-7 h-7 text-sky-300 dark:text-sky-600" />
        </div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Sin entradas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">El paciente aún no ha escrito en su diario</p>
      </div>
    ) : (
      diaryEntries.map((entry, i) => (
        <DiaryCard
          key={entry._id || entry.id || i}
          entry={entry}
          index={i}
          expanded
          patientId={patientId}
          authorName={authorName}
          onUpdate={handleEntryUpdate}
        />
      ))
    )}
  </div>
)

export default DiaryTab
