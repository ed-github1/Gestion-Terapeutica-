import MonthNav from './MonthNav'
import CalendarGrid from './CalendarGrid'
import CalendarStats from './CalendarStats'
import WeekdaySparkline from './WeekdaySparkline'

const MiniCalendarFull = ({
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    onDateSelect,
}) => (
    <div role="region" aria-label="Calendario de sesiones">
        <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={false} />
        <CalendarGrid
            calendarData={calendarData}
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentTime={currentTime}
            onDateSelect={onDateSelect}
            cellSize="md"
        />
        <CalendarStats calendarData={calendarData} compact={false} />
        <WeekdaySparkline calendarData={calendarData} />
    </div>
)

export default MiniCalendarFull
