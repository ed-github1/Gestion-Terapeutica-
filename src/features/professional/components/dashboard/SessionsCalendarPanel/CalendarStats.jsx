const CalendarStats = ({ calendarData, compact = false }) => {
    const items = [
        { label: 'Sesiones',    value: calendarData.totalSessions },
        { label: 'Completadas', value: calendarData.completedSessions },
        { label: 'Canceladas',  value: calendarData.cancelledSessions },
    ]
    const pct = calendarData.totalSessions > 0
        ? Math.round(calendarData.completedSessions / calendarData.totalSessions * 100)
        : 0

    return (
        <div className={`${compact ? 'mt-3 pt-3' : 'mt-5 pt-4'} border-t border-gray-100 dark:border-gray-700`}>
            <div className="grid grid-cols-3 gap-2">
                {items.map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 text-center border border-gray-100 dark:border-gray-700">
                        <p className={`${compact ? 'text-base' : 'text-xl'} font-bold text-gray-900 dark:text-white leading-none`}>
                            {value}
                        </p>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-none">{label}</p>
                    </div>
                ))}
            </div>
            {calendarData.totalSessions > 0 && (
                <div className="mt-2.5">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 text-right leading-none">{pct}% completado</p>
                </div>
            )}
        </div>
    )
}

export default CalendarStats
