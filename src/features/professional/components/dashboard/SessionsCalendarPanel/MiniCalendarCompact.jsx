import CalendarGrid from './CalendarGrid'
import CalendarStats from './CalendarStats'
import WeekdaySparkline from './WeekdaySparkline'
import CalendarCardHeader from './CalendarCardHeader'
import MonthNav from './MonthNav'

const MiniCalendarCompact = ({
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    onDateSelect,
    cellSize = 'md',
    profile,
    kpis,
    sessionsSlot,
    quickActionsSlot,
    availabilityDays,
    onEmptyDayClick,
    loading = false,
}) => {
    const handleToday = () => {
        const now = new Date()
        setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() })
        setSelectedDate(now)
    }

    const grid = (
        <CalendarGrid
            calendarData={calendarData}
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentTime={currentTime}
            onDateSelect={onDateSelect}
            cellSize={cellSize}
            availabilityDays={availabilityDays}
            onEmptyDayClick={onEmptyDayClick}
            loading={loading}
        />
    )

    return (
        <div className="flex flex-col xl:h-full" role="region" aria-label="Mini calendario">
            {profile && (
                <CalendarCardHeader
                    profile={profile}
                    calendarData={calendarData}
                    setCalendarMonth={setCalendarMonth}
                    kpis={kpis}
                    kpisLoading={loading}
                    quickActionsSlot={quickActionsSlot}
                    onToday={handleToday}
                />
            )}

            {sessionsSlot ? (
                <>
                    {/* Desktop: grid only, sessions in right column */}
                    <div className="hidden xl:flex xl:flex-col flex-1 overflow-y-auto calendar-scrollbar px-6 py-4">
                        {!profile && (
                            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={false} />
                        )}
                        {grid}
                        <CalendarStats calendarData={calendarData} compact />
                        <WeekdaySparkline calendarData={calendarData} />
                    </div>

                    {/* Mobile: calendar + sessions stacked inline */}
                    <div className="xl:hidden flex flex-col">
                        <div className="px-4 pt-2 pb-1">
                            <CalendarGrid
                                calendarData={calendarData}
                                calendarMonth={calendarMonth}
                                selectedDate={selectedDate}
                                setSelectedDate={(date) => { setSelectedDate(date); onDateSelect?.() }}
                                currentTime={currentTime}
                                cellSize="sm"
                                availabilityDays={availabilityDays}
                                onEmptyDayClick={onEmptyDayClick}
                                loading={loading}
                            />
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            {sessionsSlot}
                        </div>
                    </div>
                </>
            ) : (
                <div className={`flex-1 overflow-hidden ${profile ? 'px-6 py-5' : ''}`}>
                    {!profile && (
                        <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={cellSize === 'md'} />
                    )}
                    {grid}
                </div>
            )}
        </div>
    )
}

export default MiniCalendarCompact
