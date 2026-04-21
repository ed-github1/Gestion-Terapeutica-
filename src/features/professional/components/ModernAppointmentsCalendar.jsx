/**
 * ModernAppointmentsCalendar — FullCalendar v6 implementation.
 * Redesigned with custom toolbar, event cards, and clean aesthetic.
 * Self-fetches via appointmentsService.getCalendarEvents on every view/range change.
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin     from '@fullcalendar/daygrid'
import timeGridPlugin    from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin        from '@fullcalendar/list'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { useDarkModeContext } from '@shared/DarkModeContext'
import { resolvePatientName } from '../utils/dashboardUtils'
import CalendarToolbar from './calendar/CalendarToolbar'
import CalendarEventCard from './calendar/CalendarEventCard'

const TYPE_META = {
    consultation: { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', gradient: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', darkGrad: 'linear-gradient(135deg,rgba(59,130,246,.18),rgba(37,99,235,.26))',  darkText: '#93c5fd' },
    therapy:      { bg: '#FAF5FF', border: '#A855F7', text: '#7E22CE', gradient: 'linear-gradient(135deg,#FAF5FF,#F3E8FF)', darkGrad: 'linear-gradient(135deg,rgba(168,85,247,.18),rgba(147,51,234,.26))', darkText: '#d8b4fe' },
    followup:     { bg: '#ECFDF5', border: '#10B981', text: '#065F46', gradient: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', darkGrad: 'linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.26))',   darkText: '#6ee7b7' },
    emergency:    { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', gradient: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', darkGrad: 'linear-gradient(135deg,rgba(239,68,68,.18),rgba(220,38,38,.26))',    darkText: '#fca5a5' },
    default:      { bg: '#F3F4F6', border: '#6B7280', text: '#374151', gradient: 'linear-gradient(135deg,#F3F4F6,#E5E7EB)', darkGrad: 'linear-gradient(135deg,rgba(107,114,128,.18),rgba(75,85,99,.26))',    darkText: '#d1d5db' },
}

function normalizeEvent(apt) {
    // Backend calendar endpoint wraps the real appointment inside appointmentData
    const data = apt.appointmentData ? apt.appointmentData : apt
    const meta = TYPE_META[data.type] || TYPE_META.default
    let start = data.fechaHora || data.start
    if (data.date && data.time) {
        const [yr, mo, dy] = String(data.date).slice(0, 10).split('-').map(Number)
        const [h, m]       = String(data.time).split(':').map(Number)
        start = new Date(yr, mo - 1, dy, h, m, 0)
    }
    const durationMs = (Number(data.duration) || 60) * 60_000
    const end = data.end || (start ? new Date(new Date(start).getTime() + durationMs) : undefined)
    const resolvedId = data._id || apt.id || apt._id
    return {
        id:              String(resolvedId || Math.random()),
        title:           resolvePatientName(data),
        start,
        end,
        backgroundColor: 'transparent',
        borderColor:     'transparent',
        textColor:       meta.text,
        extendedProps:   {
            ...data,
            id:          resolvedId,
            patientName: resolvePatientName(data),
            _meta:       meta,
        },
    }
}

function normalizeEvents(raw = []) {
    const events = (Array.isArray(raw) ? raw : []).map(normalizeEvent)
    // Conflict detection — flag events whose time ranges overlap with another
    return events.map((evt, i) => {
        const aStart = evt.start ? new Date(evt.start) : null
        const aEnd   = evt.end   ? new Date(evt.end)   : null
        if (!aStart || !aEnd) return evt
        const hasConflict = events.some((other, j) => {
            if (i === j || !other.start || !other.end) return false
            return new Date(other.start) < aEnd && new Date(other.end) > aStart
        })
        if (!hasConflict) return evt
        return { ...evt, extendedProps: { ...evt.extendedProps, hasConflict: true } }
    })
}

/** Returns a short countdown string for events starting within 2 hours, or null. */
function getCountdown(start) {
    if (!start) return null
    const diff = Math.round((new Date(start) - Date.now()) / 60000)
    if (diff < 0 || diff > 120) return null
    if (diff === 0) return 'Ahora'
    if (diff < 60) return `en ${diff}min`
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return `en ${h}h${m ? `${m}m` : ''}`
}

// Scoped CSS — clean design matching the new calendar style
const FC_STYLES = `
.fc { font-family: inherit; }
/* Hide default toolbar — we use our own CalendarToolbar */
.fc .fc-toolbar { display: none !important; }
/* Column headers — cleaner style */
.fc .fc-col-header-cell         { padding: 10px 0; border: none !important; }
.fc .fc-col-header-cell-cushion { font-size: .7rem; font-weight: 700; text-transform: uppercase;
                                  letter-spacing: .06em; color: #94a3b8; text-decoration: none; }
/* Today column header highlight */
.fc .fc-day-today .fc-col-header-cell-cushion,
.fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion { color: #3b82f6; }
/* Time labels */
.fc .fc-timegrid-slot-label     { font-size: .65rem; color: #94a3b8; font-weight: 500; padding-right: 12px; }
/* Grid lines — very subtle */
.fc .fc-scrollgrid              { overflow: hidden; border: none !important; }
.fc .fc-scrollgrid td,
.fc .fc-scrollgrid th           { border-color: #f1f5f9 !important; }
.fc .fc-timegrid-slot           { height: 3rem; }
/* Now indicator */
.fc .fc-timegrid-now-indicator-line  { border-color: #3b82f6 !important; border-width: 2px; }
.fc .fc-timegrid-now-indicator-arrow { border-top-color: #3b82f6 !important; }
/* Today bg */
.fc .fc-day-today               { background: rgba(59,130,246,.04) !important; }
/* Events — fully rounded cards, no FC borders */
.fc-event                       { border: none !important; border-radius: .75rem !important; padding: 0 !important; cursor: pointer; overflow: visible; }
.fc-event:hover                 { filter: brightness(.96); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.1) !important; transition: all .15s ease; }
.fc .fc-event-main              { padding: 0 !important; height: 100%; }
.fc .fc-timegrid-event          { border-radius: .75rem !important; overflow: hidden; margin-bottom: 2px; }
.fc .fc-timegrid-event .fc-event-main { padding: 0 !important; height: 100%; }
.fc .fc-daygrid-event .fc-event-main  { padding: 0 !important; }
.fc .fc-daygrid-day-number      { font-size: .72rem; font-weight: 600; color: #475569; text-decoration: none; padding: 8px; }

/* ── List mode ── */
.fc .fc-list                    { border: none !important; }
.fc .fc-list-day-cushion        { background: transparent !important; padding: 12px 16px 4px !important; }
.fc .fc-list-day-text           { font-size: .72rem !important; font-weight: 800 !important; text-transform: uppercase !important;
                                  letter-spacing: .08em !important; color: #3b82f6 !important; text-decoration: none !important; }
.fc .fc-list-day-side-text      { font-size: .7rem !important; font-weight: 500 !important; color: #94a3b8 !important; text-decoration: none !important; }
.fc .fc-list-event > td         { padding: 7px 16px !important; border-bottom: 1px solid #f1f5f9 !important;
                                  background: #fff !important; border-left: none !important; border-top: none !important; border-right: none !important; }
.fc .fc-list-event:hover > td   { background: #f8fafc !important; }
.fc .fc-list-event-time         { font-size: .7rem !important; font-weight: 700 !important; color: #3b82f6 !important; }
.fc .fc-list-event-title        { color: #1e293b !important; font-size: .8rem !important; font-weight: 600 !important; }
.fc .fc-list-empty-cushion      { color: #94a3b8; font-size: .85rem; }

/* ── Dark mode ── */
.dark .fc                       { color: #e5e7eb; }
.dark .fc .fc-col-header-cell-cushion { color: #6b7280; }
.dark .fc .fc-day-today .fc-col-header-cell-cushion,
.dark .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion { color: #60a5fa; }
.dark .fc .fc-timegrid-slot-label     { color: #4b5563; }
.dark .fc .fc-daygrid-day-number      { color: #d1d5db; }
.dark .fc .fc-day-today         { background: rgba(59,130,246,.1) !important; }
.dark .fc .fc-scrollgrid td,
.dark .fc .fc-scrollgrid th     { border-color: #1e293b !important; }
.dark .fc .fc-list-event > td   { background: #111827 !important; border-bottom-color: #1e293b !important; }
.dark .fc .fc-list-event:hover > td { background: #1e293b !important; }
.dark .fc .fc-list-event-time   { color: #60a5fa !important; }
.dark .fc .fc-list-event-title  { color: #e2e8f0 !important; }
.dark .fc .fc-list-day-text     { color: #60a5fa !important; }
.dark .fc-theme-standard td,
.dark .fc-theme-standard th     { background: #111827; border-color: #1e293b !important; }
.dark .fc .fc-col-header-cell   { background: #1a2234 !important; border-color: #1e293b !important; }
.dark .fc .fc-timegrid-col      { background: #111827 !important; }
.dark .fc .fc-timegrid-slot-lane { background: #111827 !important; }
.dark .fc .fc-daygrid-day       { background: #111827 !important; }
.dark .fc .fc-view-harness      { background: #111827; }
.dark .fc .fc-timegrid-axis     { background: #1a2234 !important; border-color: #1e293b !important; }
.dark .fc .fc-scrollgrid-section > td { background: #111827; }
.dark .fc-event:hover           { filter: brightness(1.1); box-shadow: 0 4px 12px rgba(0,0,0,.3) !important; }
.dark .fc .fc-non-business      { background: rgba(0,0,0,.2) !important; }
/* Strip FC's auto-computed event border/bg in ALL modes */
.fc-event, .fc-timegrid-event, .fc-daygrid-event { --fc-event-bg-color: transparent !important; --fc-event-border-color: transparent !important; }
.fc-event .fc-event-main        { background: transparent !important; }
`

export default function ModernAppointmentsCalendar({ onSelectEvent, onDateClick, onEventDrop, onAddEvent, onToggleAvailability, onToggleRates, density = 'spacious' }) {
    const calRef = useRef(null)
    const { dark } = useDarkModeContext()
    const [currentDate, setCurrentDate] = useState(new Date())
    const defaultView = useRef(window.innerWidth < 768 ? 'listWeek' : 'timeGridWeek').current
    const [activeView, setActiveView] = useState(defaultView)

    // Auto-refresh when appointment is paid
    useEffect(() => {
        const unsubscribe = socketNotificationService.on('appointment-paid', () => {
            calRef.current?.getApi().refetchEvents()
        })
        return unsubscribe
    }, [])

    // Sync currentDate from FullCalendar when view changes
    const handleDatesSet = useCallback((dateInfo) => {
        setCurrentDate(dateInfo.view.currentStart)
        setActiveView(dateInfo.view.type)
    }, [])

    // Custom toolbar actions
    const handlePrev  = useCallback(() => { calRef.current?.getApi().prev(); }, [])
    const handleNext  = useCallback(() => { calRef.current?.getApi().next(); }, [])
    const handleToday = useCallback(() => { calRef.current?.getApi().today(); }, [])
    const handleViewChange = useCallback((view) => {
        calRef.current?.getApi().changeView(view)
        setActiveView(view)
    }, [])

    const fetchEvents = useCallback(async (fetchInfo, successCallback) => {
        const startDate = fetchInfo.startStr.slice(0, 10)
        const endDate   = fetchInfo.endStr.slice(0, 10)
        let raw = []

        try {
            const res = await appointmentsService.getCalendarEvents(startDate, endDate)
            const data =
                Array.isArray(res?.data)              ? res.data :
                Array.isArray(res?.data?.data)         ? res.data.data :
                Array.isArray(res?.data?.appointments) ? res.data.appointments :
                []
            if (data.length > 0) raw = data
        } catch { /* fall through */ }

        if (raw.length === 0) {
            try {
                const res = await appointmentsService.getAll({})
                const all =
                    Array.isArray(res?.data)              ? res.data :
                    Array.isArray(res?.data?.data)         ? res.data.data :
                    Array.isArray(res?.data?.appointments) ? res.data.appointments :
                    []
                const start = new Date(startDate)
                const end   = new Date(endDate)
                raw = all.filter(a => {
                    const d = new Date(a.date || a.fechaHora || a.start)
                    return d >= start && d <= end
                })
            } catch { /* continue */ }
        }

        try {
            const saved = localStorage.getItem('professionalAppointments')
            if (saved) {
                const parsed = JSON.parse(saved)
                const start  = new Date(startDate)
                const end    = new Date(endDate)
                const seenIds = new Set(raw.map(a => String(a._id || a.id)))
                parsed.forEach(a => {
                    const d = new Date(a.start || a.date)
                    if (d >= start && d <= end && !seenIds.has(String(a._id || a.id))) {
                        raw.push(a)
                    }
                })
            }
        } catch { /* ignore */ }

        successCallback(normalizeEvents(raw))
    }, [])

    const handleEventDrop = useCallback((info) => {
        onEventDrop?.({
            ...info.event.extendedProps,
            start:  info.event.start,
            end:    info.event.end,
            revert: info.revert,
        })
    }, [onEventDrop])

    // "+N more" clicked — jump to listDay for that date (works great on mobile)
    const handleMoreLinkClick = useCallback((info) => {
        calRef.current?.getApi().changeView('listDay', info.date)
        return 'stop' // prevent default popover
    }, [])

    // Day-number nav link — same behaviour for consistency
    const handleNavLinkDayClick = useCallback((date) => {
        calRef.current?.getApi().changeView('listDay', date)
    }, [])

    return (
        <>
            <style>{FC_STYLES}</style>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 shadow-sm">
                {/* Custom toolbar */}
                <CalendarToolbar
                    currentDate={currentDate}
                    activeView={activeView}
                    onViewChange={handleViewChange}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onToday={handleToday}
                    onAddEvent={() => onAddEvent?.()}
                    onToggleAvailability={() => onToggleAvailability?.()}
                    onToggleRates={() => onToggleRates?.()}
                />

                {/* FullCalendar grid */}
                <FullCalendar
                    key={density}
                    ref={calRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    locale="es"
                    initialView={defaultView}
                    headerToolbar={false}
                    eventBorderColor="transparent"
                    eventBackgroundColor="transparent"
                    slotMinTime="07:00:00"
                    slotMaxTime="23:30:00"
                    slotDuration={density === 'compact' ? '00:15:00' : '00:30:00'}
                    slotLabelInterval="01:00"
                    allDaySlot={false}
                    expandRows
                    height="auto"
                    contentHeight={density === 'compact' ? 520 : 640}
                    editable
                    selectable
                    selectMirror
                    dayMaxEvents={3}
                    weekends
                    nowIndicator
                    navLinks
                    events={fetchEvents}
                    datesSet={handleDatesSet}
                    eventClick={(info)       => onSelectEvent?.(info.event.extendedProps)}
                    dateClick={(info)        => onDateClick?.(info.date)}
                    eventDrop={handleEventDrop}
                    moreLinkClick={handleMoreLinkClick}
                    navLinkDayClick={handleNavLinkDayClick}
                    eventContent={(arg) => <CalendarEventCard arg={arg} />}
                />
            </div>
        </>
    )
}
