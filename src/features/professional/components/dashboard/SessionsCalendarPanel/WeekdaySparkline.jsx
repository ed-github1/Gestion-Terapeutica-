const DOW_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const WeekdaySparkline = ({ calendarData }) => {
    const buckets = [0, 0, 0, 0, 0, 0, 0]
    const { firstDay, daysInMonth, dayMap } = calendarData

    for (let d = 1; d <= daysInMonth; d++) {
        const monIdx = (firstDay + d - 1 + 6) % 7
        buckets[monIdx] += dayMap[d]?.count ?? 0
    }

    const max = Math.max(...buckets, 1)

    return (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 leading-none">
                Carga por día
            </p>
            <div className="flex items-end gap-1" style={{ height: 40 }}>
                {buckets.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                        <div
                            className="w-full rounded-t-sm transition-all duration-500"
                            style={{
                                height: count === 0 ? 3 : `${Math.max(count / max * 100, 12)}%`,
                                backgroundColor: count === 0 ? '#e5e7eb'
                                    : count >= max * 0.75 ? '#0075C9'
                                    : count >= max * 0.4  ? '#54C0E8'
                                    : '#BAE6FD',
                            }}
                        />
                        <span className="text-[9px] text-gray-400 leading-none">{DOW_LABELS[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default WeekdaySparkline
