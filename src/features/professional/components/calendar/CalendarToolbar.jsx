import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, DollarSign } from 'lucide-react'

const VIEW_OPTIONS = [
  { key: 'timeGridDay',  label: 'Día',    shortLabel: 'Día'  },
  { key: 'timeGridWeek', label: 'Semana', shortLabel: 'Sem'  },
  { key: 'listWeek',     label: 'Lista',  shortLabel: 'Lista' },
  { key: 'dayGridMonth', label: 'Mes',    shortLabel: 'Mes'  },
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
    <div className="flex items-center gap-2 mb-4">
      {/* Month title + nav — flex-1 so it takes leftover space */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize truncate">
          {title}
        </h2>
        <button
          onClick={onPrev}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* View toggle pills */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 rounded-xl p-0.5 shrink-0">
        {VIEW_OPTIONS.map(({ key, label, shortLabel }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Secondary actions — icon-only on mobile */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToday}
          className="hidden sm:block px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={onToggleAvailability}
          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 sm:gap-1.5"
          title="Disponibilidad"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-semibold">Disponibilidad</span>
        </button>
        <button
          onClick={onToggleRates}
          className="w-8 h-8 flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 sm:gap-1.5"
          title="Tarifas"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-semibold">Tarifas</span>
        </button>
        {/* Nueva Sesión — visible on sm+; on mobile it's the FAB */}
        <button
          onClick={onAddEvent}
          className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Sesión
        </button>
      </div>
    </div>
  )
}
