import SessionRow from '../cards/SessionRow'

const SessionsTab = ({ sessionHistory }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Historial de sesiones</h3>
      <span className="text-xs text-gray-400 dark:text-gray-500">{sessionHistory.length} sesiones</span>
    </div>
    <div className="space-y-2">
      {sessionHistory.map((session, i) => (
        <SessionRow key={session.id} session={session} index={i} />
      ))}
    </div>
  </div>
)

export default SessionsTab
