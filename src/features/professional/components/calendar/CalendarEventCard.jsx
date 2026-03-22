import { useDarkModeContext } from '@shared/DarkModeContext'

const TYPE_META = {
  consultation: {
    bg: 'bg-sky-500',          darkBg: 'bg-gray-800/80',
    text: 'text-white',        darkText: 'text-gray-100',
    timeTxt: 'text-sky-100',   darkTimeTxt: 'text-gray-400',
    avatar: 'bg-sky-400 text-white', darkAvatar: 'bg-gray-700 text-gray-300',
    dot: 'bg-sky-500',
    emoji: '💬', label: 'Consulta',
  },
  therapy: {
    bg: 'bg-amber-400',        darkBg: 'bg-gray-800/80',
    text: 'text-gray-900',     darkText: 'text-gray-100',
    timeTxt: 'text-amber-900/70', darkTimeTxt: 'text-gray-400',
    avatar: 'bg-amber-300 text-amber-900', darkAvatar: 'bg-gray-700 text-gray-300',
    dot: 'bg-amber-400',
    emoji: '🧠', label: 'Terapia',
  },
  followup: {
    bg: 'bg-teal-500',         darkBg: 'bg-gray-800/80',
    text: 'text-white',        darkText: 'text-gray-100',
    timeTxt: 'text-teal-100',  darkTimeTxt: 'text-gray-400',
    avatar: 'bg-teal-400 text-white', darkAvatar: 'bg-gray-700 text-gray-300',
    dot: 'bg-teal-500',
    emoji: '🔄', label: 'Seguimiento',
  },
  emergency: {
    bg: 'bg-red-500',          darkBg: 'bg-gray-800/80',
    text: 'text-white',        darkText: 'text-gray-100',
    timeTxt: 'text-red-100',   darkTimeTxt: 'text-gray-400',
    avatar: 'bg-red-400 text-white', darkAvatar: 'bg-gray-700 text-gray-300',
    dot: 'bg-red-500',
    emoji: '🚨', label: 'Emergencia',
  },
  default: {
    bg: 'bg-slate-500',        darkBg: 'bg-gray-800/80',
    text: 'text-white',        darkText: 'text-gray-100',
    timeTxt: 'text-slate-200', darkTimeTxt: 'text-gray-400',
    avatar: 'bg-slate-400 text-white', darkAvatar: 'bg-gray-700 text-gray-300',
    dot: 'bg-slate-400',
    emoji: '📋', label: 'Cita',
  },
}

/** Format a Date into a short time string like "09:00AM" */
function shortTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m}${suffix}`
}

/** Get initials from a name string */
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function CalendarEventCard({ arg }) {
  const { dark } = useDarkModeContext()
  const apt  = arg.event.extendedProps
  const meta = TYPE_META[apt.type] || TYPE_META.default

  const isPaid    = apt.paymentStatus === 'paid' || apt.paymentStatus === 'completed'
  const isPending = !isPaid && (apt.paymentStatus === 'pending' || apt.status === 'reserved' || apt.status === 'accepted')
  const isVideo   = apt.isVideoCall || apt.mode === 'videollamada'

  const timeRange = arg.event.start && arg.event.end
    ? `${shortTime(arg.event.start)} - ${shortTime(arg.event.end)}`
    : arg.timeText || ''

  const patientName = arg.event.title || ''
  const initials    = getInitials(patientName)

  return (
    <div
      className={`
        relative h-full w-full rounded-xl px-2.5 py-1.5 overflow-hidden
        ${dark ? meta.darkBg : meta.bg}
      `}
    >
      {/* Conflict corner triangle */}
      {apt.hasConflict && (
        <span
          title="Conflicto de horario"
          className="absolute top-0 right-0 z-10"
          style={{
            width: 0, height: 0, borderStyle: 'solid',
            borderWidth: '0 10px 10px 0',
            borderColor: 'transparent #ef4444 transparent transparent',
          }}
        />
      )}

      {/* Row 1: Color dot (dark) / emoji (light) + Title + badges */}
      <div className="flex items-center gap-1 min-w-0">
        {dark
          ? <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} aria-hidden />
          : <span className="text-[11px] leading-none shrink-0" aria-hidden>{meta.emoji}</span>
        }
        <p className={`text-[11px] font-bold leading-tight truncate flex-1 ${dark ? meta.darkText : meta.text}`}>
          {patientName}
        </p>

        {/* Video badge */}
        {isVideo && (
          <svg className="w-3 h-3 shrink-0 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        )}

        {/* Paid check */}
        {isPaid && (
          <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500">
            <svg width="8" height="8" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}

        {/* Pending payment */}
        {isPending && (
          <span className="shrink-0 text-[7px] font-bold text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-sm px-1 leading-none py-0.5">
            $?
          </span>
        )}
      </div>

      {/* Row 2: Time range */}
      {timeRange && (
        <p className={`text-[10px] leading-tight mt-0.5 truncate ${dark ? meta.darkTimeTxt : meta.timeTxt}`}>
          {timeRange}
        </p>
      )}

      {/* Row 3: Patient avatar + type label (visible on taller slots) */}
      <div className="flex items-center justify-between mt-1 min-w-0">
        {/* Avatar circle with initials */}
        <div className="flex items-center -space-x-1">
          <span
            className={`
              w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0 ring-1 ring-white dark:ring-gray-800
              ${dark ? meta.darkAvatar : meta.avatar}
            `}
          >
            {initials}
          </span>
          {/* "+1" overflow indicator for multi-attendee scenarios */}
          {apt.hasConflict && (
            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-[8px] font-bold text-gray-500 dark:text-gray-300 flex items-center justify-center ring-1 ring-white dark:ring-gray-800">
              +1
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
