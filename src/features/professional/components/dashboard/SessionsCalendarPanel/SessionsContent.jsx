import TodaysSessions from '../../TodaysSessions'
import EmptyDayState from './EmptyDayState'

const SessionsContent = ({
    isViewingToday,
    visibleSessions,
    selectedDateSessions,
    loading,
    onJoinVideo,
    onViewDiary,
    onSchedule,
    onMarkComplete,
    nextTimestamp,
    nextCountdown,
    nextIsImminent,
    nextIsNow,
}) => {
    if (!isViewingToday && visibleSessions.length === 0) {
        return <EmptyDayState onSchedule={onSchedule} />
    }

    return (
        <TodaysSessions
            sessions={selectedDateSessions}
            loading={loading}
            onJoinVideo={onJoinVideo}
            onViewDiary={onViewDiary}
            onMessage={(apt) => console.log('Message patient:', apt?.nombrePaciente)}
            onMarkComplete={onMarkComplete}
            nextSessionTime={nextTimestamp}
            nextSessionCountdown={nextCountdown}
            nextIsImminent={nextIsImminent || nextIsNow}
            isViewingToday={isViewingToday}
        />
    )
}

export default SessionsContent
