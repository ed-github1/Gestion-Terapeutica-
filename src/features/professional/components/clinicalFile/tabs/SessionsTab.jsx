import { Calendar } from 'lucide-react'
import SessionRow from '../cards/SessionRow'

const SessionsTab = ({ sessionHistory }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Historial de sesiones</h3>
      <span className="text-xs text-gray-400 dark:text-gray-500">{sessionHistory.length} sesiones</span>
    </div>
    {sessionHistory.length === 0 ? (
      <div className="text-center py-14">
        <Calendar className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
        <p className="font-semibold text-gray-600 dark:text-gray-400">Sin sesiones completadas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Las sesiones aparecerán aquí cuando se completen</p>
      </div>
    ) : (
      <div>
        {sessionHistory.map((session, i) => (
          <SessionRow
            key={session.id}
            session={session}
            index={i}
            isFirst={i === 0}
            isLast={i === sessionHistory.length - 1}
          />
        ))}
      </div>
    )}
  </div>
)

export default SessionsTab
