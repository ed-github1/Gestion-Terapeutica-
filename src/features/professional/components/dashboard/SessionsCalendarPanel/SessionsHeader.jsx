import CountdownBadge from './CountdownBadge'

const SessionsHeader = ({ label, sessionCount, countdownProps, compact = false }) => (
    <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-5'} shrink-0`}>
        <div>
            <h2 className={`font-bold leading-tight text-gray-900 dark:text-white ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
                {label}
            </h2>
            {sessionCount != null && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                    {sessionCount} {sessionCount === 1 ? 'cita' : 'citas'}
                </p>
            )}
        </div>
        <CountdownBadge {...countdownProps} />
    </div>
)

export default SessionsHeader
