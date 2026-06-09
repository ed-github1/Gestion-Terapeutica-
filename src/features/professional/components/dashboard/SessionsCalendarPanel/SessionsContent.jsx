import TodaysSessions from '../../TodaysSessions'
import EmptyDayState from './EmptyDayState'

const SessionsContent = ({
    isViewingToday,
    visibleSessions,
    selectedDateSessions,
    pendingPayments,
    loading,
    onJoinVideo,
    onViewDiary,
    onSchedule,
    onMarkComplete,
    onRequestPayment,
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
            pendingPayments={isViewingToday ? pendingPayments : []}
            loading={loading}
            onJoinVideo={onJoinVideo}
            onViewDiary={onViewDiary}
            onMessage={(apt) => console.log('Message patient:', apt?.nombrePaciente)}
            onMarkComplete={onMarkComplete}
            onRequestPayment={onRequestPayment}
            nextSessionTime={nextTimestamp}
            nextSessionCountdown={nextCountdown}
            nextIsImminent={nextIsImminent || nextIsNow}
            isViewingToday={isViewingToday}
        />
    )
}

export default SessionsContent
