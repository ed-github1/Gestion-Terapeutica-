import { Mic } from 'lucide-react'
import SessionSummaryCard from '../cards/SessionSummaryCard'

const SummariesTab = ({ sessionSummaries, navigate }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Resúmenes de sesión</h3>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {sessionSummaries.length} {sessionSummaries.length === 1 ? 'sesión' : 'sesiones'}
      </span>
    </div>
    {sessionSummaries.length === 0 ? (
      <div className="text-center py-14">
        <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Mic className="w-7 h-7 text-sky-300 dark:text-sky-600" />
        </div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Sin resúmenes de sesión</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Los resúmenes aparecerán aquí cuando completes sesiones con este paciente
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {sessionSummaries.map((appt, i) => (
          <SessionSummaryCard
            key={appt._id || appt.id || i}
            appointment={appt}
            index={i}
            onOpen={() => navigate(`/professional/session-summary/${appt._id || appt.id}`)}
          />
        ))}
      </div>
    )}
  </div>
)

export default SummariesTab
