import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarCheck, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import TodaysSessions from '../TodaysSessions'
import { formatTime } from '../../dashboard/dashboardUtils'

// 
// Constants
// 

/** Week days starting on Monday (ES locale). */
const DOW_MON = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Convert a Sunday-based `firstDay` (0 = Sun) to a Monday-based grid offset. */
const toMondayOffset = (sundayFirstDay) => (sundayFirstDay + 6) % 7

// 
// Hooks
// 

/**
 * Derives countdown state for the next upcoming session.
 *
 * @param {boolean} isViewingToday
 * @param {object|null} nextUpcomingSession
 * @returns {{ nextTime, minsUntil, nextIsNow, nextIsImminent, nextCountdown, nextTimestamp }}
 */
function useNextSessionCountdown(isViewingToday, nextUpcomingSession) {
    const nextTime =
        isViewingToday && nextUpcomingSession
            ? new Date(nextUpcomingSession.fechaHora)
            : null

    const minsUntil = nextTime
        ? Math.round((nextTime - Date.now()) / 60_000)
        : null

    const nextIsNow = minsUntil !== null && minsUntil <= 0
    const nextIsImminent = minsUntil !== null && minsUntil >= 0 && minsUntil <= 15

    const nextCountdown = nextIsNow
        ? 'Ahora'
        : minsUntil !== null && minsUntil < 60
            ? `${minsUntil} min`
            : minsUntil !== null && minsUntil < 1_440
                ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`
                : nextTime
                    ? formatTime(nextTime)
                    : null

    const nextTimestamp = nextTime ? nextTime.getTime() : null

    return { nextTime, minsUntil, nextIsNow, nextIsImminent, nextCountdown, nextTimestamp }
}

// 
// Primitive icons
// 

// 
// CalendarDayCell
// 

/**
 * A single day button inside the calendar grid.
 *
 * @param {{ day, cellDate, isToday, isSelected, info, onSelect, cellSize, monthName }} props
 */
const CalendarDayCell = ({ day, cellDate, isToday, isSelected, info, onSelect, cellSize, monthName, hasAvailability }) => {
    const isSmall = cellSize === 'sm'
    const isLarge = cellSize === 'lg'

    const sessionCount = info?.count ?? 0

    // Button: no square hover, no bg on selected
    let buttonClass = isLarge
        ? 'relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 '
        : isSmall
            ? 'relative flex flex-col items-center justify-center py-0.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 '
            : 'relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 '

    // Subtle availability ring on empty days that have open slots
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
        // Today + selected: filled bg
        circleClass += 'bg-[#0075C9] text-white font-bold'
    } else if (isSelected) {
        // Other day selected: border only, no fill
        circleClass += 'border-2 border-[#0075C9] text-[#0075C9] font-bold'
    } else if (isToday) {
        // Today not selected: filled bg
        circleClass += 'bg-[#0075C9] text-white font-bold'
    } else if (info) {
        circleClass += 'text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700'
    } else {
        circleClass += 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
    }

    const ariaLabel = [
        `${day} de ${monthName}`,
        info ? `, ${info.count} sesi\u00f3n${info.count > 1 ? 'es' : ''}` : '',
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

            {/* Pill chip session count */}
            {info ? (
                <span
                    className={`inline-flex items-center justify-center rounded-full px-1.5 mt-1 leading-none font-bold ${
                        isSmall ? 'text-[7px] py-0.5' : 'text-[8px] py-0.5'
                    } ${
                        isToday ? 'bg-white/25 text-white' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                    }`}
                    aria-hidden="true"
                >
                    {sessionCount}
                </span>
            ) : (
                <span className={isSmall ? 'h-4' : 'h-4'} aria-hidden="true" />
            )}
        </motion.button>
    )
}

// 
// CalendarGrid
// 

/**
 * Renders the 7-column day grid with weekday headers.
 *
 * @param {{ calendarData, calendarMonth, selectedDate, setSelectedDate, currentTime, onDateSelect?, cellSize?, loading? }} props
 */
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

// 
// CalendarStats
// 

/**
 * Three-column stat strip shown below the calendar grid.
 *
 * @param {{ calendarData, compact? }} props
 */
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

// 
// MonthNav
// 

/**
 * Month navigation header with animated title and prev/next buttons.
 *
 * @param {{ calendarData, setCalendarMonth, compact?, inlineMode? }} props
 */
const MonthNav = ({ calendarData, setCalendarMonth, compact = false, inlineMode = false, onToday }) => {
    const [dir, setDir] = useState(0)

    const navigate = (delta) => {
        setDir(delta)
        setCalendarMonth((prev) => {
            const d = new Date(prev.year, prev.month + delta, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
        })
    }

    const btnClass = `flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors ${compact ? 'w-6 h-6' : 'w-7 h-7'}`

    const AnimatedTitle = ({ className }) => (
        <AnimatePresence mode="wait" initial={false}>
            <motion.span
                key={`${calendarData.monthName}-${calendarData.year}`}
                initial={{ opacity: 0, y: dir > 0 ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: dir > 0 ? -6 : 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={className}
            >
                {calendarData.monthName} {calendarData.year}
            </motion.span>
        </AnimatePresence>
    )

    if (inlineMode) {
        return (
            <div className="flex items-center gap-1 md:gap-1.5">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors" aria-label="Mes anterior">
                    <ChevronLeft size={14} />
                </button>
                <AnimatedTitle className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 leading-none whitespace-nowrap min-w-22.5 md:min-w-0 text-center" />
                <button onClick={() => navigate(1)} className="flex items-center justify-center text-[#0075C9] hover:text-[#54C0E8] transition-colors" aria-label="Mes siguiente">
                    <ChevronRight size={14} />
                </button>
            </div>
        )
    }

    return (
        <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">
                    Calendario
                </p>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={`${calendarData.monthName}-${calendarData.year}`}
                        initial={{ opacity: 0, y: dir > 0 ? 8 : -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: dir > 0 ? -8 : 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5 ${compact ? 'text-base' : 'text-xl'}`}
                    >
                        {calendarData.monthName} {calendarData.year}
                    </motion.p>
                </AnimatePresence>
                {calendarData.totalSessions > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-none">
                        {calendarData.totalSessions} sesiones · {calendarData.completedSessions} completadas
                    </p>
                )}
            </div>
            <div className="flex items-center gap-1.5">
                <button onClick={() => navigate(-1)} className={btnClass} aria-label="Mes anterior">
                    <ChevronLeft size={compact ? 14 : 18} />
                </button>
                <button onClick={() => navigate(1)} className={btnClass} aria-label="Mes siguiente">
                    <ChevronRight size={compact ? 14 : 18} />
                </button>
            </div>
        </div>
    )
}

// 
// KpiChip
// 

/**
 * Single KPI statistic: value + optional trend arrow + label.
 *
 * @param {{ value, label, trend?, trendPos? }} props
 */
const KpiChip = ({ value, label, trend, trendPos, Icon, iconColor = 'text-gray-400' }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                {Icon && <Icon size={12} className={iconColor} strokeWidth={2.5} />}
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">{label}</span>
            </div>
            {trend != null && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    trendPos ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'
                }`}>
                    {trendPos ? '↑' : '↓'}{Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-[22px] font-black text-gray-900 dark:text-white leading-none tabular-nums tracking-tight">{value}</p>
    </div>
)

// 
// KpiChipSkeleton
// 

/** Pulsing placeholder matching KpiChip dimensions */
const KpiChipSkeleton = () => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 animate-pulse w-full flex flex-col gap-1.5">
        <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
    </div>
)

// 
// CalendarGridSkeleton
// 

/** Pulsing 7-column grid mirroring CalendarGrid's day cells */
const CalendarGridSkeleton = () => {
    // 7 weekday headers + 35 day cells (5 weeks)
    const HEADER_CELLS = 7
    const DAY_CELLS    = 35
    return (
        <div className="animate-pulse">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
                {Array.from({ length: HEADER_CELLS }).map((_, i) => (
                    <div key={i} className="flex justify-center py-1.5">
                        <div className="w-4 h-2 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: DAY_CELLS }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center py-1 gap-1">
                        <div
                            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700"
                            style={{ opacity: 0.4 + ((i % 5) * 0.12) }}
                        />
                        <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// 
// CalendarCardHeader
// 

/**
 * Sticky header for the calendar card:
 *   Row 1  profile avatar + name + month nav
 *   Row 2  KPI chips
 *   Row 3  quick actions
 *
 * @param {{ profile, calendarData, setCalendarMonth, kpis, kpisLoading, quickActionsSlot, onToday }} props
 */
const CalendarCardHeader = ({
    profile,
    calendarData,
    setCalendarMonth,
    kpis,
    kpisLoading = false,
    quickActionsSlot,
    onToday,
}) => (
    <div className="border-b border-gray-200 dark:border-gray-700 shrink-0">

        {/* ── Mobile (< md): avatar + name + month nav in one row ── */}
        <div className="flex md:hidden items-center justify-between px-3 pt-2 pb-1.5">
            <div className="flex items-center gap-2">
                <button
                    onClick={profile.onNavigate}
                    className="w-8 h-8 rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold text-[10px] shrink-0 hover:bg-gray-700 transition-colors"
                    title="Ver Perfil"
                >
                    {profile.initials}
                </button>
                <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-none">{profile.name}</p>
            </div>
            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
        </div>

        {/* Mobile KPIs: 2×2 */}
        {kpis?.length > 0 && (
            <div className="md:hidden px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                    {kpisLoading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>
            </div>
        )}

        {/* ── md–lg: single row — avatar/name · KPIs · MonthNav ── */}
        <div className="hidden md:flex xl:hidden items-center gap-3 px-4 lg:px-5 pt-3 pb-3">
            {/* Profile */}
            <div className="flex items-center gap-2.5 shrink-0">
                <button
                    onClick={profile.onNavigate}
                    className="w-10 h-10 rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold text-xs shrink-0 hover:bg-gray-700 transition-colors"
                    title="Ver Perfil"
                >
                    {profile.initials}
                </button>
                <div>
                    <p className="text-[10px] text-gray-400 leading-none">{profile.greeting}</p>
                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5 whitespace-nowrap">{profile.name}</p>
                </div>
            </div>

            {/* KPIs — fill available space */}
            {kpis?.length > 0 && (
                <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
                    {kpisLoading
                        ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
                        : kpis.map((k) => <KpiChip key={k.label} {...k} />)
                    }
                </div>
            )}

            {/* Month nav — far right */}
            <div className="shrink-0">
                <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
            </div>
        </div>

        {/* Quick actions — all sizes below xl */}
        {quickActionsSlot && (
            <div className="xl:hidden px-3 md:px-4 lg:px-5 pb-3">
                {quickActionsSlot}
            </div>
        )}

        {/* ── xl: profile + month nav only (KPIs live in right-col stats bar) ── */}
        <div className="hidden xl:flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
                <button
                    onClick={profile.onNavigate}
                    className="w-10 h-10 rounded-full bg-[#0075C9] flex items-center justify-center text-white font-bold text-xs shrink-0 hover:bg-gray-700 transition-colors"
                    title="Ver Perfil"
                >
                    {profile.initials}
                </button>
                <div>
                    <p className="text-[10px] text-gray-400 leading-none">{profile.greeting}</p>
                    <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">{profile.name}</p>
                </div>
            </div>
            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} inlineMode onToday={onToday} />
        </div>

        {/* Quick actions — xl (below the profile row) */}
        {quickActionsSlot && (
            <div className="hidden xl:block px-5 pb-3">
                {quickActionsSlot}
            </div>
        )}
    </div>
)

// 
// CountdownBadge
// 

/**
 * Coloured pill showing time until the next session.
 * Returns null when there is nothing to display.
 *
 * @param {{ countdown, isNow, isImminent }} props
 */
const CountdownBadge = ({ countdown, isNow, isImminent }) => {
    if (!countdown) return null
    const urgent = isNow || isImminent
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            urgent ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgent ? 'bg-teal-400' : 'bg-sky-400'}`} />
            Próxima: {countdown}
        </span>
    )
}

// 
// SessionsHeader
// 

/**
 * Title row for a sessions panel: heading + stat chips + countdown badge.
 *
 * @param {{ label, visibleCount, completedCount, countdownProps, compact? }} props
 */
const SessionsHeader = ({ label, visibleCount, completedCount, countdownProps, compact = false }) => (
    <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-5'} shrink-0`}>
        <h2 className={`font-bold text-gray-900 dark:text-gray-100 leading-tight ${compact ? 'text-[13px]' : 'text-[15px] font-semibold'}`}>
            {label}
        </h2>
        <CountdownBadge {...countdownProps} />
    </div>
)

// 
// EmptyDayState
// 

/**
 * Shown when a non-today date has no sessions.
 *
 * @param {{ onSchedule }} props
 */
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

// 
// SessionsContent
// 

/**
 * Renders the sessions timeline or the empty-day placeholder.
 *
 * @param {{ isViewingToday, visibleSessions, selectedDateSessions, loading, onJoinVideo, onViewDiary, onSchedule, nextTimestamp, nextCountdown, nextIsImminent, nextIsNow }} props
 */
const SessionsContent = ({
    isViewingToday,
    visibleSessions,
    selectedDateSessions,
    loading,
    onJoinVideo,
    onViewDiary,
    onSchedule,
    nextTimestamp,
    nextCountdown,
    nextIsImminent,
    nextIsNow,
}) => {
    if (!isViewingToday && visibleSessions.length === 0) {
        return <EmptyDayState onSchedule={onSchedule} />
    }

    return (
        <TodaysSessions
            sessions={selectedDateSessions}
            loading={loading}
            onJoinVideo={onJoinVideo}
            onViewDiary={onViewDiary}
            onMessage={(apt) => console.log('Message patient:', apt?.nombrePaciente)}
            nextSessionTime={nextTimestamp}
            nextSessionCountdown={nextCountdown}
            nextIsImminent={nextIsImminent || nextIsNow}
            isViewingToday={isViewingToday}
        />
    )
}

// 
// WeekdaySparkline
// 

/**
 * Bar chart showing aggregated session load per weekday (Mon–Sun) for the viewed month.
 *
 * @param {{ calendarData }} props
 */
const WeekdaySparkline = ({ calendarData }) => {
    const DOW_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    const buckets = [0, 0, 0, 0, 0, 0, 0] // index 0=Mon … 6=Sun
    const { firstDay, daysInMonth, dayMap } = calendarData

    for (let d = 1; d <= daysInMonth; d++) {
        const monIdx = (firstDay + d - 1 + 6) % 7 // convert Sun-based to Mon-based
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

// 
// MiniCalendarFull
// 

/**
 * Standalone calendar panel (used in the mobile animated toggle).
 *
 * @param {{ calendarData, calendarMonth, setCalendarMonth, selectedDate, setSelectedDate, currentTime, onDateSelect? }} props
 */
const MiniCalendarFull = ({
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    onDateSelect,
}) => (
    <div role="region" aria-label="Calendario de sesiones">
        <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={false} />
        <CalendarGrid
            calendarData={calendarData}
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentTime={currentTime}
            onDateSelect={onDateSelect}
            cellSize="md"
        />
        <CalendarStats calendarData={calendarData} compact={false} />
        <WeekdaySparkline calendarData={calendarData} />
    </div>
)

// 
// MiniCalendarCompact  (also exported as MiniCalendarWidget)
// 

/**
 * Hero calendar card.
 *
 * - xl: shows only the grid (sessions are in a separate right-hand column).
 * - smaller: toggles between the grid and the injected sessionsSlot.
 *
 * @param {{ calendarData, calendarMonth, setCalendarMonth, selectedDate, setSelectedDate, currentTime, onDateSelect?, cellSize?, profile?, kpis?, sessionsSlot?, mobileSessionsLabel? }} props
 */
const MiniCalendarCompact = ({
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    onDateSelect,
    cellSize = 'md',
    profile,
    kpis,
    sessionsSlot,
    mobileSessionsLabel,
    quickActionsSlot,
    availabilityDays,
    onEmptyDayClick,
    loading = false,
}) => {
    // Jump back to current month + select today
    const handleToday = () => {
        const now = new Date()
        setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() })
        setSelectedDate(now)
    }

    const grid = (
        <CalendarGrid
            calendarData={calendarData}
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentTime={currentTime}
            onDateSelect={onDateSelect}
            cellSize={cellSize}
            availabilityDays={availabilityDays}
            onEmptyDayClick={onEmptyDayClick}
            loading={loading}
        />
    )

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Mini calendario">
            {profile && (
                <CalendarCardHeader
                    profile={profile}
                    calendarData={calendarData}
                    setCalendarMonth={setCalendarMonth}
                    kpis={kpis}
                    kpisLoading={loading}
                    quickActionsSlot={quickActionsSlot}
                    onToday={handleToday}
                />
            )}

            {sessionsSlot ? (
                <>
                    {/* Desktop: grid only, sessions in right column */}
                    <div className="hidden xl:flex xl:flex-col flex-1 overflow-y-auto calendar-scrollbar px-6 py-4">
                        {!profile && (
                            <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={false} />
                        )}
                        {grid}
                        <CalendarStats calendarData={calendarData} compact />
                        <WeekdaySparkline calendarData={calendarData} />
                    </div>

                    {/* Mobile: calendar + sessions stacked inline */}
                    <div className="xl:hidden flex flex-col">
                        {/* Calendar grid */}
                        <div className="px-4 pt-2 pb-1">
                            <CalendarGrid
                                calendarData={calendarData}
                                calendarMonth={calendarMonth}
                                selectedDate={selectedDate}
                                setSelectedDate={(date) => { setSelectedDate(date); onDateSelect?.() }}
                                currentTime={currentTime}
                                cellSize="sm"
                                availabilityDays={availabilityDays}
                                onEmptyDayClick={onEmptyDayClick}
                                loading={loading}
                            />
                        </div>

                        {/* Sessions for selected date — always visible below calendar */}
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            {sessionsSlot}
                        </div>
                    </div>
                </>
            ) : (
                <div className={`flex-1 overflow-hidden ${profile ? 'px-6 py-5' : ''}`}>
                    {!profile && (
                        <MonthNav calendarData={calendarData} setCalendarMonth={setCalendarMonth} compact={cellSize === 'md'} />
                    )}
                    {grid}
                </div>
            )}
        </div>
    )
}

export { MiniCalendarCompact as MiniCalendarWidget, KpiChip, KpiChipSkeleton, CalendarGridSkeleton }

// 
// SessionsCalendarPanel  (main export)
// 

/**
 * Combined sessions + mini-calendar panel.
 *
 * Modes:
 *   xl+           sessions left | calendar right (two-column grid)
 *   smaller       animated sessions <-> calendar toggle
 *   sessionsOnly  only the sessions pane (calendar lives outside)
 *   bare          like sessionsOnly but without the white card wrapper
 *
 * @param {object}    props
 * @param {string}    props.selectedDateLabel
 * @param {Array}     props.selectedDateSessions
 * @param {boolean}   props.isViewingToday
 * @param {object}    props.nextUpcomingSession
 * @param {object}    props.calendarData
 * @param {object}    props.calendarMonth
 * @param {Function}  props.setCalendarMonth
 * @param {Date}      props.selectedDate
 * @param {Function}  props.setSelectedDate
 * @param {Date}      props.currentTime
 * @param {string}    props.calendarView
 * @param {Function}  props.setCalendarView
 * @param {boolean}   props.loading
 * @param {Function}  props.handleJoinVideo
 * @param {Function}  props.setDiaryPatient
 * @param {Function}  props.setShowCalendar
 * @param {ReactNode} [props.quickActionsSlot]
 * @param {number}    [props.totalPatients]
 * @param {boolean}   [props.sessionsOnly=false]
 * @param {boolean}   [props.bare=false]
 */
const SessionsCalendarPanel = ({
    selectedDateLabel,
    selectedDateSessions,
    isViewingToday,
    nextUpcomingSession,
    calendarData,
    calendarMonth,
    setCalendarMonth,
    selectedDate,
    setSelectedDate,
    currentTime,
    calendarView,
    setCalendarView,
    loading,
    handleJoinVideo,
    setDiaryPatient,
    setShowCalendar,
    quickActionsSlot,
    totalPatients,
    sessionsOnly = false,
    bare = false,
}) => {
    const { nextIsNow, nextIsImminent, nextCountdown, nextTimestamp } =
        useNextSessionCountdown(isViewingToday, nextUpcomingSession)

    const visibleSessions = selectedDateSessions.filter((s) => !s.isUnavailable)
    const countdownProps  = { countdown: nextCountdown, isNow: nextIsNow, isImminent: nextIsImminent }

    const sessionsContent = (
        <SessionsContent
            isViewingToday={isViewingToday}
            visibleSessions={visibleSessions}
            selectedDateSessions={selectedDateSessions}
            loading={loading}
            onJoinVideo={handleJoinVideo}
            onViewDiary={setDiaryPatient}
            onSchedule={() => setShowCalendar(true)}
            nextTimestamp={nextTimestamp}
            nextCountdown={nextCountdown}
            nextIsImminent={nextIsImminent}
            nextIsNow={nextIsNow}
        />
    )

    if (sessionsOnly) {
        const header = (
            <SessionsHeader
                label={selectedDateLabel}
                visibleCount={visibleSessions.length}
                completedCount={calendarData.completedSessions}
                countdownProps={countdownProps}
                compact
            />
        )

        if (bare) {
            return (
                <div className="px-4 pt-2 pb-3 flex flex-col h-full overflow-hidden">
                    {header}
                    {sessionsContent}
                </div>
            )
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm"
            >
                <div className="p-6 flex flex-col h-full overflow-hidden">
                    {header}
                    {sessionsContent}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 xl:mb-0 xl:flex-1 xl:min-h-0 overflow-hidden xl:flex xl:flex-col shadow-sm"
        >
            {/* xl: two-column layout */}
            <div className="hidden xl:grid xl:grid-cols-[1fr_400px] xl:h-full">
                <div className="p-6 flex flex-col border-r border-gray-200 dark:border-gray-700 xl:overflow-hidden">
                    <div className="flex items-center justify-between mb-5 shrink-0">
                        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{selectedDateLabel}</h2>
                        <CountdownBadge {...countdownProps} />
                    </div>
                    {sessionsContent}
                </div>

                <div className="flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto calendar-scrollbar">
                    {quickActionsSlot && (
                        <div className="px-4 pt-4 pb-3 border-b border-sky-100 dark:border-gray-700">
                            {quickActionsSlot}
                        </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                        <MiniCalendarCompact
                            calendarData={calendarData}
                            calendarMonth={calendarMonth}
                            setCalendarMonth={setCalendarMonth}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            currentTime={currentTime}
                        />
                    </div>
                </div>
            </div>

            {/* smaller: animated sessions toggle */}
            <div className="xl:hidden relative overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                    {calendarView === 'sessions' ? (
                        <motion.div
                            key="ses-panel"
                            initial={{ opacity: 0, x: -28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -28 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="p-5 md:p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{selectedDateLabel}</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{visibleSessions.length} citas</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CountdownBadge {...countdownProps} />
                                    <button
                                        onClick={() => setCalendarView('calendar')}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 hover:bg-sky-100 text-sky-400 hover:text-sky-600 transition-colors"
                                        aria-label="Abrir calendario"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {sessionsContent}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cal-panel"
                            initial={{ opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 28 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="p-5 md:p-6"
                        >
                            <MiniCalendarFull
                                calendarData={calendarData}
                                calendarMonth={calendarMonth}
                                setCalendarMonth={setCalendarMonth}
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                                currentTime={currentTime}
                                onDateSelect={() => setCalendarView('sessions')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export default SessionsCalendarPanel
