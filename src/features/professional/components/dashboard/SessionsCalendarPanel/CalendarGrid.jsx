import CalendarDayCell from './CalendarDayCell'
import CalendarGridSkeleton from './CalendarGridSkeleton'
import { DOW_MON, toMondayOffset } from './constants'

const CalendarGrid = ({
    calendarData,
    calendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    onDateSelect,
    cellSize = 'md',
    availabilityDays,
    onEmptyDayClick,
    loading = false,
}) => {
    if (loading) return <CalendarGridSkeleton />

    const isSmall = cellSize === 'sm'
    const isLarge = cellSize === 'lg'
    const offset = toMondayOffset(calendarData.firstDay)

    const handleSelect = (cellDate) => {
        setSelectedDate(cellDate)
        const isEmpty = !calendarData.dayMap?.[cellDate.getDate()]
        if (isEmpty && onEmptyDayClick) {
            onEmptyDayClick(cellDate)
        } else {
            onDateSelect?.()
        }
    }

    return (
        <>
            <div className="grid grid-cols-7 mb-1">
                {DOW_MON.map((d) => (
                    <div
                        key={d}
                        className={`text-center font-bold text-gray-500 dark:text-gray-400 ${
                            isLarge ? 'text-sm py-2.5' : isSmall ? 'text-[10px] py-1' : 'text-xs py-1.5'
                        }`}
                    >
                        {d}
                    </div>
                ))}
            </div>

            <div className={`grid grid-cols-7 ${isLarge ? 'gap-2' : isSmall ? 'gap-0.5' : 'gap-1'}`}>
                {Array.from({ length: offset }).map((_, i) => (
                    <div key={`ep-${i}`} />
                ))}

                {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const cellDate = new Date(calendarMonth.year, calendarMonth.month, day)
                    const isToday =
                        day === currentTime.getDate() &&
                        calendarMonth.month === currentTime.getMonth() &&
                        calendarMonth.year === currentTime.getFullYear()
                    const isSelected =
                        day === selectedDate.getDate() &&
                        calendarMonth.month === selectedDate.getMonth() &&
                        calendarMonth.year === selectedDate.getFullYear()

                    return (
                        <CalendarDayCell
                            key={day}
                            day={day}
                            cellDate={cellDate}
                            isToday={isToday}
                            isSelected={isSelected}
                            info={calendarData.dayMap[day]}
                            onSelect={handleSelect}
                            cellSize={cellSize}
                            monthName={calendarData.monthName}
                            hasAvailability={availabilityDays?.has(day)}
                        />
                    )
                })}
            </div>
        </>
    )
}

export default CalendarGrid
