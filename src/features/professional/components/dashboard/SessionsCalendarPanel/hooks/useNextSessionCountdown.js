import { formatTime } from '../../../../utils/dashboardUtils'

export function useNextSessionCountdown(isViewingToday, nextUpcomingSession) {
    const nextTime =
        isViewingToday && nextUpcomingSession
            ? new Date(nextUpcomingSession.fechaHora)
            : null

    const minsUntil = nextTime
        ? Math.round((nextTime - Date.now()) / 60_000)
        : null

    const nextIsNow = minsUntil !== null && minsUntil <= 0
    const nextIsImminent = minsUntil !== null && minsUntil >= 0 && minsUntil <= 15

    const nextCountdown = nextIsNow
        ? 'Ahora'
        : minsUntil !== null && minsUntil < 60
            ? `${minsUntil} min`
            : minsUntil !== null && minsUntil < 1_440
                ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`
                : nextTime
                    ? formatTime(nextTime)
                    : null

    const nextTimestamp = nextTime ? nextTime.getTime() : null

    return { nextTime, minsUntil, nextIsNow, nextIsImminent, nextCountdown, nextTimestamp }
}
