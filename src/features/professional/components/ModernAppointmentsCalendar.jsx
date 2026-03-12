/**
 * ModernAppointmentsCalendar — FullCalendar v6 implementation.
 * Self-fetches via appointmentsService.getCalendarEvents on every view/range change.
 * Supports event click, date click, and drag-and-drop rescheduling.
 */
import { useRef, useCallback, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin     from '@fullcalendar/daygrid'
import timeGridPlugin    from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin        from '@fullcalendar/list'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { useDarkModeContext } from '@shared/DarkModeContext'
import { resolvePatientName } from '../dashboard/dashboardUtils'

const TYPE_META = {
    consultation: { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', gradient: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', darkGrad: 'linear-gradient(135deg,rgba(59,130,246,.18),rgba(37,99,235,.26))',  darkText: '#93c5fd' },
    therapy:      { bg: '#FAF5FF', border: '#A855F7', text: '#7E22CE', gradient: 'linear-gradient(135deg,#FAF5FF,#F3E8FF)', darkGrad: 'linear-gradient(135deg,rgba(168,85,247,.18),rgba(147,51,234,.26))', darkText: '#d8b4fe' },
    followup:     { bg: '#ECFDF5', border: '#10B981', text: '#065F46', gradient: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', darkGrad: 'linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.26))',   darkText: '#6ee7b7' },
    emergency:    { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', gradient: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', darkGrad: 'linear-gradient(135deg,rgba(239,68,68,.18),rgba(220,38,38,.26))',    darkText: '#fca5a5' },
    default:      { bg: '#F3F4F6', border: '#6B7280', text: '#374151', gradient: 'linear-gradient(135deg,#F3F4F6,#E5E7EB)', darkGrad: 'linear-gradient(135deg,rgba(107,114,128,.18),rgba(75,85,99,.26))',    darkText: '#d1d5db' },
}

function normalizeEvent(apt) {
    const meta = TYPE_META[apt.type] || TYPE_META.default
    let start = apt.fechaHora || apt.start
    if (apt.date && apt.time) {
        const [yr, mo, dy] = String(apt.date).slice(0, 10).split('-').map(Number)
        const [h, m]       = String(apt.time).split(':').map(Number)
        start = new Date(yr, mo - 1, dy, h, m, 0)
    }
    const durationMs = (Number(apt.duration) || 60) * 60_000
    const end = apt.end || (start ? new Date(new Date(start).getTime() + durationMs) : undefined)
    return {
        id:              String(apt._id || apt.id || Math.random()),
        title:           resolvePatientName(apt),
        start,
        end,
        backgroundColor: 'transparent',
        borderColor:     'transparent',
        textColor:       meta.text,
        extendedProps:   { ...apt, _meta: meta },
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

// Scoped CSS — keeps FullCalendar chrome harmonised with Tailwind design tokens
const FC_STYLES = `
.fc { font-family: inherit; }
.fc .fc-toolbar-title           { font-size: 1rem; font-weight: 700; color: #111827; letter-spacing: -.01em; padding: 0 .5rem; }
.fc .fc-button                  { background: #f8fafc !important; border: 1px solid #e5e7eb !important; color: #374151 !important;
                                  font-size: .75rem !important; font-weight: 600 !important;
                                  border-radius: .5rem !important; padding: .45rem .9rem !important;
                                  box-shadow: none !important; transition: all .12s ease; letter-spacing: .01em; }
.fc .fc-button:hover            { background: #f1f5f9 !important; border-color: #d1d5db !important; }
.fc .fc-button-active,
.fc .fc-button-primary:not(:disabled).fc-button-active
                                { background: #0f172a !important; color: #fff !important; border-color: #0f172a !important; }
.fc .fc-button:focus            { box-shadow: 0 0 0 2px #3b82f6 !important; outline: none !important; }
.fc .fc-col-header-cell-cushion { font-size: .65rem; font-weight: 700; text-transform: uppercase;
                                  letter-spacing: .07em; color: #94a3b8; text-decoration: none; }
.fc .fc-timegrid-slot-label     { font-size: .65rem; color: #94a3b8; font-weight: 500; }
.fc .fc-timegrid-now-indicator-line { border-color: #3b82f6 !important; border-width: 2px; }
.fc .fc-timegrid-now-indicator-arrow { border-top-color: #3b82f6 !important; }
.fc-event                       { border-radius: .5rem !important; padding: 1px 3px !important; cursor: pointer; }
.fc-event:hover                 { filter: brightness(.96); }
.fc .fc-daygrid-day-number      { font-size: .72rem; font-weight: 600; color: #475569; text-decoration: none; }
.fc .fc-day-today               { background: #eff6ff !important; }
.fc .fc-scrollgrid              { overflow: hidden; border-color: #e2e8f0 !important; }

/* ── List mode — clean clinical layout ── */
.fc .fc-list                    { border: none !important; }
.fc .fc-list-table              { border: none !important; }
.fc .fc-list-day > td           { padding: 0 !important; border: none !important; }
.fc .fc-list-day-cushion        { background: transparent !important; padding: 14px 16px 4px !important;
                                  border-bottom: none !important; display: flex; align-items: center; gap: 8px; }
.fc .fc-list-day-cushion::before { content: ''; display: inline-block; width: 3px; height: 14px;
                                   background: #3b82f6; border-radius: 2px; margin-right: 2px; }
.fc .fc-list-day-text           { font-size: .72rem !important; font-weight: 800 !important;
                                  text-transform: uppercase !important; letter-spacing: .08em !important;
                                  color: #3b82f6 !important; text-decoration: none !important; }
.fc .fc-list-day-side-text      { font-size: .7rem !important; font-weight: 500 !important;
                                  color: #94a3b8 !important; text-decoration: none !important; }
.fc .fc-list-event              { border: none !important; }
.fc .fc-list-event > td         { padding: 7px 16px !important;
                                  border-bottom: 1px solid #f1f5f9 !important;
                                  background: #fff !important; border-left: none !important; border-top: none !important; border-right: none !important; }
.fc .fc-list-event:hover > td   { background: #f8fafc !important; }
.fc .fc-list-event-time         { font-size: .7rem !important; font-weight: 700 !important;
                                  color: #3b82f6 !important; min-width: 72px !important;
                                  padding-right: 12px !important; white-space: nowrap !important; }
.fc .fc-list-event-graphic      { padding-right: 10px !important; vertical-align: middle !important; }
.fc .fc-list-event-dot          { border-width: 5px !important; border-radius: 50% !important; }
.fc .fc-list-event-title        { color: #1e293b !important; font-size: .8rem !important;
                                  font-weight: 600 !important; }
.fc .fc-list-empty-cushion      { color: #94a3b8; font-size: .85rem; }
.fc .fc-scrollgrid td,
.fc .fc-scrollgrid th           { border-color: #f1f5f9 !important; }
.fc .fc-toolbar                 { gap: .75rem 1rem; flex-wrap: wrap; row-gap: .75rem; padding: .25rem 0; margin-bottom: 1rem !important; }
.fc .fc-toolbar .fc-toolbar-chunk { display: flex; align-items: center; gap: .35rem; }
.fc .fc-button-group             { gap: 2px; }
.fc .fc-button-group > .fc-button { margin: 0 !important; }
/* Event rendering: custom content fills the event cell */
.fc-event                       { border: none !important; border-radius: .625rem !important; padding: 0 !important; cursor: pointer; overflow: visible; }
.fc-event:hover                 { filter: brightness(.95); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08) !important; transition: all .12s ease; }
.fc .fc-event-main              { padding: 0 !important; height: 100%; }
.fc .fc-timegrid-event          { border-radius: .625rem !important; overflow: hidden; }
.fc .fc-timegrid-event .fc-event-main      { padding: 0 !important; height: 100%; }
.fc .fc-daygrid-event .fc-event-main       { padding: 0 !important; }
/* Dark mode overrides */
.dark .fc                       { color: #e5e7eb; }
.dark .fc .fc-toolbar-title     { color: #f3f4f6; }
.dark .fc .fc-button            { background: #374151 !important; color: #d1d5db !important; }
.dark .fc .fc-button:hover      { background: #4b5563 !important; }
.dark .fc .fc-button-active,
.dark .fc .fc-button-primary:not(:disabled).fc-button-active
                                { background: #f9fafb !important; color: #111827 !important; }
.dark .fc .fc-col-header-cell-cushion { color: #9ca3af; }
.dark .fc .fc-timegrid-slot-label     { color: #6b7280; }
.dark .fc .fc-daygrid-day-number      { color: #d1d5db; }
.dark .fc .fc-day-today         { background: rgba(59,130,246,.15) !important; }
.dark .fc .fc-list                    { border: none !important; }
.dark .fc .fc-list-day > td           { border: none !important; }
.dark .fc .fc-list-day-cushion        { background: transparent !important; padding: 14px 16px 4px !important; }
.dark .fc .fc-list-day-cushion::before { background: #60a5fa !important; }
.dark .fc .fc-list-day-text           { color: #60a5fa !important; }
.dark .fc .fc-list-day-side-text      { color: #475569 !important; }
.dark .fc .fc-list-event > td         { background: #0f172a !important; border-bottom: 1px solid #1e293b !important; border-left: none !important; border-top: none !important; border-right: none !important; }
.dark .fc .fc-list-event:hover > td   { background: #1e293b !important; }
.dark .fc .fc-list-event-time         { color: #60a5fa !important; }
.dark .fc .fc-list-event-title  { color: #e2e8f0 !important; }
.dark .fc .fc-list-empty-cushion      { color: #475569; }
.dark .fc .fc-scrollgrid        { border-color: #374151 !important; }
.dark .fc .fc-scrollgrid td,
.dark .fc .fc-scrollgrid th     { border-color: #374151 !important; }
.dark .fc .fc-timegrid-slot     { border-color: #374151; }
.dark .fc .fc-cell-shaded,
.dark .fc .fc-day-disabled      { background: #1f2937 !important; }
.dark .fc .fc-highlight         { background: rgba(59,130,246,.2); }
.dark .fc-event:hover           { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.3) !important; }
.dark .fc .fc-list-day > *      { background: transparent !important; }
.dark .fc .fc-list-empty        { color: #475569; }
.dark .fc .fc-non-business      { background: rgba(0,0,0,.25) !important; }
.dark .fc .fc-daygrid-day.fc-day-other .fc-daygrid-day-number { color: #4b5563; }
/* ── Fill all grid cell backgrounds ── */
.dark .fc-theme-standard td,
.dark .fc-theme-standard th     { background: #111827; border-color: #374151 !important; }
.dark .fc .fc-col-header-cell   { background: #1e2533 !important; border-color: #374151 !important; }
.dark .fc .fc-timegrid-col      { background: #111827 !important; }
.dark .fc .fc-timegrid-slot-lane { background: #111827 !important; }
.dark .fc .fc-daygrid-day       { background: #111827 !important; }
.dark .fc .fc-daygrid-day.fc-day-other { background: #0d1a2b !important; }
.dark .fc .fc-view-harness      { background: #111827; }
.dark .fc .fc-timegrid-axis     { background: #1e2533 !important; border-color: #374151 !important; }
.dark .fc .fc-scrollgrid-section > td { background: #111827; }
`

export default function ModernAppointmentsCalendar({ onSelectEvent, onDateClick, onEventDrop, density = 'spacious' }) {
    const calRef = useRef(null)
    const { dark } = useDarkModeContext()

    // Auto-refresh the calendar whenever the backend reports that an appointment
    // was just paid — this happens when a patient completes checkout.
    useEffect(() => {
        const unsubscribe = socketNotificationService.on('appointment-paid', () => {
            calRef.current?.getApi().refetchEvents()
        })
        return unsubscribe
    }, [])

    // Called by FullCalendar on every view/range change — auto-refresh on month navigation
    const fetchEvents = useCallback(async (fetchInfo, successCallback) => {
        const startDate = fetchInfo.startStr.slice(0, 10)
        const endDate   = fetchInfo.endStr.slice(0, 10)

        let raw = []

        // ── 1. Try the dedicated calendar endpoint ─────────────────────────
        try {
            const res = await appointmentsService.getCalendarEvents(startDate, endDate)
            const data =
                Array.isArray(res?.data)              ? res.data :
                Array.isArray(res?.data?.data)         ? res.data.data :
                Array.isArray(res?.data?.appointments) ? res.data.appointments :
                []
            if (data.length > 0) raw = data
        } catch { /* fall through to getAll */ }

        // ── 2. Fallback: fetch all appointments and date-filter client-side ─
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
            } catch { /* continue to localStorage */ }
        }

        // ── 3. Merge localStorage appointments (created in offline / demo mode) ─
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
        } catch { /* ignore localStorage errors */ }

        successCallback(normalizeEvents(raw))
    }, [])

    const handleEventDrop = useCallback((info) => {
        onEventDrop?.({
            ...info.event.extendedProps,
            start:  info.event.start,
            end:    info.event.end,
            revert: info.revert,   // parent can revert on API error
        })
    }, [onEventDrop])

    return (
        <>
            <style>{FC_STYLES}</style>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 shadow-sm relative">
                <FullCalendar
                    key={density}
                    ref={calRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    locale="es"
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left:   'prev,next today',
                        center: 'title',
                        right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                    }}
                    buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista' }}
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
                    dayMaxEvents={4}
                    weekends
                    nowIndicator
                    navLinks
                    events={fetchEvents}
                    eventClick={(info)  => onSelectEvent?.(info.event.extendedProps)}
                    dateClick={(info)   => onDateClick?.(info.date)}
                    eventDrop={handleEventDrop}
                    eventContent={(arg) => {
                        const apt       = arg.event.extendedProps
                        const meta      = apt._meta || TYPE_META.default
                        const isPaid    = apt.paymentStatus === 'paid' || apt.paymentStatus === 'completed'
                        const isPending = apt.paymentStatus === 'pending' || (!isPaid && (apt.status === 'reserved' || apt.status === 'accepted'))
                        const countdown = getCountdown(arg.event.start)
                        const textColor = dark ? meta.darkText : meta.text
                        const bgStyle   = dark ? meta.darkGrad  : meta.gradient
                        return (
                            <div
                                className="overflow-hidden h-full w-full"
                                style={{ background: bgStyle, borderLeft: `3px solid ${meta.border}`, borderRadius: '6px' }}
                            >
                                <div className="relative px-2 py-1 h-full">
                                    {/* Conflict corner indicator */}
                                    {apt.hasConflict && (
                                        <span
                                            title="Conflicto de horario"
                                            style={{
                                                position: 'absolute', top: 0, right: 0,
                                                width: 0, height: 0, borderStyle: 'solid',
                                                borderWidth: '0 9px 9px 0',
                                                borderColor: `transparent #ef4444 transparent transparent`,
                                            }}
                                        />
                                    )}
                                    <div className="flex items-center gap-1">
                                        {/* Accent dot instead of emoji */}
                                        <span
                                            className="shrink-0 rounded-full"
                                            style={{ width: 5, height: 5, background: meta.border, opacity: 0.8, flexShrink: 0 }}
                                        />
                                        <p className="text-[11px] font-semibold leading-tight truncate flex-1" style={{ color: textColor }}>
                                            {arg.event.title}
                                        </p>
                                        {apt.isVideoCall && (
                                            <svg title="Videollamada" className="shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={meta.border} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                            </svg>
                                        )}
                                        {isPaid && (
                                            <span title="Pagado" className="shrink-0 flex items-center justify-center rounded-full bg-emerald-500" style={{ width: 12, height: 12 }}>
                                                <svg width="7" height="7" fill="none" stroke="white" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                        )}
                                        {isPending && !isPaid && (
                                            <span
                                                title="Pago pendiente"
                                                className="shrink-0 font-bold leading-none"
                                                style={{ fontSize: 8, color: '#d97706', border: '1px solid #fcd34d', background: '#fffbeb', borderRadius: 3, padding: '1px 3px' }}
                                            >
                                                $?
                                            </span>
                                        )}
                                    </div>
                                    {arg.timeText && (
                                        <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: textColor, opacity: 0.65 }}>
                                            {arg.timeText}
                                            {countdown && (
                                                <span className="ml-1 font-bold" style={{ color: meta.border, opacity: 1 }}>{countdown}</span>
                                            )}
                                        </p>
                                    )}
                                    {apt.notes && (
                                        <p
                                            className="text-[9px] leading-tight truncate mt-0.5"
                                            style={{ color: textColor, opacity: 0.45 }}
                                            title={apt.notes}
                                        >
                                            {apt.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    }}
                />

            </div>
        </>
    )
}
