import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

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

    </div>
  )
}
