/**
 * ModernAppointmentsCalendar — FullCalendar v6 implementation.
 * Self-fetches via appointmentsService.getCalendarEvents on every view/range change.
 * Supports event click, date click, and drag-and-drop rescheduling.
 */
import { useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin     from '@fullcalendar/daygrid'
import timeGridPlugin    from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin        from '@fullcalendar/list'
import { appointmentsService } from '@shared/services/appointmentsService'

const TYPE_COLORS = {
    consultation: { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA' },
    therapy:      { bg: '#FAF5FF', border: '#A855F7', text: '#7E22CE' },
    followup:     { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
    emergency:    { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
    default:      { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
}

function normalizeEvent(apt) {
    const colors = TYPE_COLORS[apt.type] || TYPE_COLORS.default
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
        title:           apt.patientName || apt.nombrePaciente || 'Paciente',
        start,
        end,
        backgroundColor: colors.bg,
        borderColor:     colors.border,
        textColor:       colors.text,
        extendedProps:   apt,
    }
}

function normalizeEvents(raw = []) {
    return (Array.isArray(raw) ? raw : []).map(normalizeEvent)
}

// Scoped CSS — keeps FullCalendar chrome harmonised with Tailwind design tokens
const FC_STYLES = `
.fc { font-family: inherit; }
.fc .fc-toolbar-title           { font-size: 1rem; font-weight: 700; color: #111827; }
.fc .fc-button                  { background: #f3f4f6 !important; border: none !important; color: #374151 !important;
                                  font-size: .75rem !important; font-weight: 600 !important;
                                  border-radius: .5rem !important; padding: .35rem .75rem !important;
                                  box-shadow: none !important; transition: background .15s; }
.fc .fc-button:hover            { background: #e5e7eb !important; }
.fc .fc-button-active,
.fc .fc-button-primary:not(:disabled).fc-button-active
                                { background: #111827 !important; color: #fff !important; }
.fc .fc-button:focus            { box-shadow: 0 0 0 2px #6366f1 !important; outline: none !important; }
.fc .fc-col-header-cell-cushion { font-size: .68rem; font-weight: 700; text-transform: uppercase;
                                  letter-spacing: .06em; color: #6b7280; text-decoration: none; }
.fc .fc-timegrid-slot-label     { font-size: .68rem; color: #9ca3af; font-weight: 500; }
.fc .fc-timegrid-now-indicator-line { border-color: #6366f1 !important; border-width: 2px; }
.fc .fc-timegrid-now-indicator-arrow { border-top-color: #6366f1 !important; }
.fc-event                       { border-radius: .5rem !important; padding: 1px 3px !important; cursor: pointer; }
.fc-event:hover                 { filter: brightness(.96); }
.fc .fc-daygrid-day-number      { font-size: .75rem; font-weight: 600; color: #374151; text-decoration: none; }
.fc .fc-day-today               { background: #f5f3ff !important; }
.fc .fc-list-event:hover td     { background: #f9fafb !important; }
.fc .fc-list-day-cushion        { background: #f3f4f6 !important; }
.fc .fc-list-event-title        { color: #111827; font-size: .8rem; font-weight: 600; }
.fc .fc-scrollgrid              { overflow: hidden; border-color: #e5e7eb !important; }
.fc .fc-scrollgrid td,
.fc .fc-scrollgrid th           { border-color: #f3f4f6 !important; }
.fc .fc-toolbar                 { gap: .5rem; flex-wrap: wrap; }
`

export default function ModernAppointmentsCalendar({ onSelectEvent, onDateClick, onEventDrop }) {
    const calRef = useRef(null)

    // Called by FullCalendar on every view/range change — auto-refresh on month navigation
    const fetchEvents = useCallback(async (fetchInfo, successCallback, failureCallback) => {
        try {
            const res = await appointmentsService.getCalendarEvents(
                fetchInfo.startStr.slice(0, 10),
                fetchInfo.endStr.slice(0, 10),
            )
            const raw =
                Array.isArray(res?.data)               ? res.data :
                Array.isArray(res?.data?.data)          ? res.data.data :
                Array.isArray(res?.data?.appointments)  ? res.data.appointments :
                []
            successCallback(normalizeEvents(raw))
        } catch {
            successCallback([])
            failureCallback?.(new Error('Could not load calendar events'))
        }
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
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
                <FullCalendar
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
                    slotMaxTime="21:00:00"
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00"
                    allDaySlot={false}
                    expandRows
                    height="auto"
                    contentHeight={620}
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
                    eventContent={(arg) => (
                        <div className="overflow-hidden px-1 py-0.5 h-full">
                            <p className="text-[11px] font-bold leading-tight truncate" style={{ color: arg.event.textColor }}>
                                {arg.event.title}
                            </p>
                            {arg.timeText && (
                                <p className="text-[10px] leading-tight opacity-70 truncate" style={{ color: arg.event.textColor }}>
                                    {arg.timeText}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>
        </>
    )
}
