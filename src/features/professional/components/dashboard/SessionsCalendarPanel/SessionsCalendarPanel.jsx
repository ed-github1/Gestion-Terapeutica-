import { motion, AnimatePresence } from 'motion/react'
import { CalendarCheck } from 'lucide-react'
import { useNextSessionCountdown } from './hooks/useNextSessionCountdown'
import CountdownBadge from './CountdownBadge'
import SessionsHeader from './SessionsHeader'
import SessionsContent from './SessionsContent'
import MiniCalendarFull from './MiniCalendarFull'
import MiniCalendarCompact from './MiniCalendarCompact'

const SessionsCalendarPanel = ({
    selectedDateLabel,
    selectedDateSessions,
    isViewingToday,
    nextUpcomingSession,
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    calendarView,
    setCalendarView,
    loading,
    handleJoinVideo,
    setDiaryPatient,
    setShowCalendar,
    handleMarkComplete,
    quickActionsSlot,
    totalPatients,
    sessionsOnly = false,
    bare = false,
}) => {
    const { nextIsNow, nextIsImminent, nextCountdown, nextTimestamp } =
        useNextSessionCountdown(isViewingToday, nextUpcomingSession)

    const visibleSessions = selectedDateSessions.filter((s) => !s.isUnavailable)
    const countdownProps  = { countdown: nextCountdown, isNow: nextIsNow, isImminent: nextIsImminent }

    const sessionsContent = (
        <SessionsContent
            isViewingToday={isViewingToday}
            visibleSessions={visibleSessions}
            selectedDateSessions={selectedDateSessions}
            loading={loading}
            onJoinVideo={handleJoinVideo}
            onViewDiary={setDiaryPatient}
            onSchedule={() => setShowCalendar(true)}
            onMarkComplete={handleMarkComplete}
            nextTimestamp={nextTimestamp}
            nextCountdown={nextCountdown}
            nextIsImminent={nextIsImminent}
            nextIsNow={nextIsNow}
        />
    )

    if (sessionsOnly) {
        const header = (
            <SessionsHeader
                label={selectedDateLabel}
                sessionCount={visibleSessions.length}
                countdownProps={countdownProps}
                compact
            />
        )

        if (bare) {
            return (
                <div className="px-4 pt-2 pb-3 flex flex-col">
                    {header}
                    {sessionsContent}
                </div>
            )
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm"
            >
                <div className="p-6 flex flex-col h-full overflow-hidden">
                    {header}
                    {sessionsContent}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 xl:mb-0 xl:flex-1 xl:min-h-0 overflow-hidden xl:flex xl:flex-col shadow-sm"
        >
            {/* xl: two-column layout */}
            <div className="hidden xl:grid xl:grid-cols-[1fr_400px] xl:h-full">
                <div className="p-6 flex flex-col border-r border-gray-200 dark:border-gray-700 xl:overflow-hidden">
                    <div className="flex items-center justify-between mb-5 shrink-0">
                        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            {selectedDateLabel}
                        </h2>
                        <CountdownBadge {...countdownProps} />
                    </div>
                    {sessionsContent}
                </div>

                <div className="flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto calendar-scrollbar">
                    {quickActionsSlot && (
                        <div className="px-4 pt-4 pb-3 border-b border-sky-100 dark:border-gray-700">
                            {quickActionsSlot}
                        </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                        <MiniCalendarCompact
                            calendarData={calendarData}
                            calendarMonth={calendarMonth}
                            setCalendarMonth={setCalendarMonth}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            currentTime={currentTime}
                        />
                    </div>
                </div>
            </div>

            {/* smaller: animated sessions/calendar toggle */}
            <div className="xl:hidden relative overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                    {calendarView === 'sessions' ? (
                        <motion.div
                            key="ses-panel"
                            initial={{ opacity: 0, x: -28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -28 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="p-5 md:p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                                        {selectedDateLabel}
                                    </h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{visibleSessions.length} citas</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CountdownBadge {...countdownProps} />
                                    <button
                                        onClick={() => setCalendarView('calendar')}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 hover:bg-sky-100 text-sky-400 hover:text-sky-600 transition-colors"
                                        aria-label="Abrir calendario"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {sessionsContent}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cal-panel"
                            initial={{ opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 28 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="p-5 md:p-6"
                        >
                            <MiniCalendarFull
                                calendarData={calendarData}
                                calendarMonth={calendarMonth}
                                setCalendarMonth={setCalendarMonth}
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                                currentTime={currentTime}
                                onDateSelect={() => setCalendarView('sessions')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export default SessionsCalendarPanel
