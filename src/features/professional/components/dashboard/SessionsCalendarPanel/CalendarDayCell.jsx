import { motion } from 'motion/react'

const CalendarDayCell = ({ day, cellDate, isToday, isSelected, info, onSelect, cellSize, monthName, hasAvailability }) => {
    const isSmall = cellSize === 'sm'
    const isLarge = cellSize === 'lg'
    const sessionCount = info?.count ?? 0

    let buttonClass = isLarge
        ? 'relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 '
        : isSmall
            ? 'relative flex flex-col items-center justify-center py-0.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 '
            : 'relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 '

    if (!isSelected && !isToday && !info && hasAvailability) {
        buttonClass += ' ring-1 ring-inset ring-sky-200'
    }

    let circleClass = 'flex items-center justify-center rounded-full transition-all leading-none '
    circleClass += isLarge
        ? 'w-12 h-12 text-base font-medium '
        : isSmall
            ? 'w-8 h-8 text-xs font-medium '
            : 'w-9 h-9 text-sm font-medium '

    if (isSelected && isToday) {
        circleClass += 'bg-[#0075C9] text-white font-bold'
    } else if (isSelected) {
        circleClass += 'border-2 border-[#0075C9] text-[#0075C9] font-bold'
    } else if (isToday) {
        circleClass += 'bg-[#0075C9] text-white font-bold'
    } else if (info) {
        circleClass += 'text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700'
    } else {
        circleClass += 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
    }

    const ariaLabel = [
        `${day} de ${monthName}`,
        info ? `, ${info.count} sesión${info.count > 1 ? 'es' : ''}` : '',
        isToday ? ', hoy' : '',
        isSelected ? ', seleccionado' : '',
    ].join('')

    return (
        <motion.button
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => onSelect(cellDate)}
            className={buttonClass}
            aria-label={ariaLabel}
            aria-pressed={isSelected}
        >
            <span className={circleClass}>{day}</span>

            {info ? (
                <span
                    className={`inline-flex items-center justify-center rounded-full px-1.5 mt-1 leading-none font-bold ${
                        isSmall ? 'text-[7px] py-0.5' : 'text-[8px] py-0.5'
                    } ${
                        isToday
                            ? 'bg-white/25 text-white'
                            : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                    }`}
                    aria-hidden="true"
                >
                    {sessionCount}
                </span>
            ) : (
                <span className="h-4" aria-hidden="true" />
            )}
        </motion.button>
    )
}

export default CalendarDayCell
