const HEADER_CELLS = 7
const DAY_CELLS = 35

const CalendarGridSkeleton = () => (
    <div>
        <div className="grid grid-cols-7 mb-1">
            {Array.from({ length: HEADER_CELLS }).map((_, i) => (
                <div key={i} className="flex justify-center py-1.5">
                    <div className="skeleton w-4 h-2 rounded" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: DAY_CELLS }).map((_, i) => (
                <div key={i} className="flex flex-col items-center py-1 gap-1">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </div>
            ))}
        </div>
    </div>
)

export default CalendarGridSkeleton
