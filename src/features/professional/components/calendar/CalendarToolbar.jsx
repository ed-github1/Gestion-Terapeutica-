import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Search, Plus, Clock, DollarSign } from 'lucide-react'

const VIEW_OPTIONS = [
  { key: 'timeGridDay',   label: 'Día' },
  { key: 'timeGridWeek',  label: 'Semana' },
  { key: 'dayGridMonth',  label: 'Mes' },
]

export default function CalendarToolbar({
  currentDate,
  activeView,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onAddEvent,
  onToggleAvailability,
  onToggleRates,
}) {
  const title = format(currentDate, "MMMM yyyy", { locale: es })

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      {/* Left — Month / nav */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {title}
        </h2>
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center — View toggle pills */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 rounded-xl p-0.5">
        {VIEW_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={onToggleAvailability}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Disponibilidad</span>
        </button>
        <button
          onClick={onToggleRates}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tarifas</span>
        </button>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Sesión
        </button>
      </div>
    </div>
  )
}
