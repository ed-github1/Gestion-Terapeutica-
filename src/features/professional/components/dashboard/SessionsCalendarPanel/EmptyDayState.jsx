import { CalendarCheck } from 'lucide-react'

const EmptyDayState = ({ onSchedule }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
        <CalendarCheck className="w-8 h-8 mb-3 text-sky-200" />
        <p className="text-sm font-medium text-gray-500">Sin sesiones este día</p>
        <button
            onClick={onSchedule}
            className="mt-4 text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
        >
            + Agendar cita
        </button>
    </div>
)

export default EmptyDayState
