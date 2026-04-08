/**
 * shared/utils/appointments.js
 *
 * Single source-of-truth for:
 *  – normalising the various shapes the backend may return for a single
 *    appointment object.
 *  – unwrapping the different Axios-response wrapper shapes.
 *  – timezone-safe date helpers used when comparing appointment dates.
 */

/* ── Response unwrapping ─────────────────────────────────────────────────── */

/**
 * Accepts the raw Axios response (or the already-unwrapped `.data`) and
 * returns a plain array of raw appointment objects.
 *
 * Handles shapes:
 *   response.data          → Array
 *   response.data          → { data: Array }
 *   response.data          → { data: { data: Array } }   (paginated)
 *   response.data          → { appointments: Array }
 *   response.data          → { sessions: Array }
 *   response.data          → { items: Array }
 *   response.data          → { result: Array }
 *   response.data          → { results: Array }
 *   response.data          → { data: { appointments: Array } }
 *   response.data          → { data: { sessions: Array } }
 */
export function unwrapAppointmentsResponse(response) {
  const raw = response?.data ?? response

  if (Array.isArray(raw))                      return raw
  if (Array.isArray(raw?.data))                return raw.data
  if (Array.isArray(raw?.data?.data))          return raw.data.data
  if (Array.isArray(raw?.appointments))        return raw.appointments
  if (Array.isArray(raw?.sessions))            return raw.sessions
  if (Array.isArray(raw?.items))               return raw.items
  if (Array.isArray(raw?.result))              return raw.result
  if (Array.isArray(raw?.results))             return raw.results
  if (Array.isArray(raw?.data?.appointments))  return raw.data.appointments
  if (Array.isArray(raw?.data?.sessions))      return raw.data.sessions
  if (Array.isArray(raw?.data?.items))         return raw.data.items

  return []
}

/* ── Single-appointment normalisation ───────────────────────────────────── */

/**
 * Normalises one raw appointment object so the rest of the UI can rely on
 * stable field names regardless of which backend version produced it.
 *
 * Guaranteed output fields:
 *   id, date (YYYY-MM-DD), time (HH:MM), status, type, duration,
 *   reason, notes, isVideoCall, professionalName
 */
export function normalizeAppointment(apt) {
  if (!apt) return null

  // ── ID ──────────────────────────────────────────────────────────────────
  const id = apt._id ?? apt.id ?? null

  // ── Date / time ─────────────────────────────────────────────────────────
  // Prefer an explicit dateStr field; fall back to ISO datetime variants.
  // We always store the date as a "YYYY-MM-DD" string so downstream filters
  // can parse it reliably in local time (see toLocalDateObj below).
  const rawDatetime =
    apt.startTime ?? apt.start ?? apt.scheduledAt ?? apt.scheduled_at ??
    apt.datetime  ?? apt.dateTime ?? apt.appointmentDatetime ??
    apt.appointmentDate ?? apt.appointment_date ?? apt.date ?? null

  let date = null
  let time = null

  if (rawDatetime) {
    const raw = typeof rawDatetime === 'string' ? rawDatetime : String(rawDatetime)

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      // Already a date-only string — keep as-is
      date = raw
    } else {
      // Try to extract YYYY-MM-DD directly from the ISO string BEFORE parsing.
      // Backend typically stores midnight-UTC dates like "2026-04-05T00:00:00.000Z".
      // Using `new Date().getDate()` would shift the day in negative-UTC timezones.
      const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T/)
      if (isoMatch) {
        date = isoMatch[1]
        // Extract time from the ISO string as a fallback; an explicit `apt.time`
        // field (handled below) takes priority.
        const timePart = raw.slice(11, 16) // "HH:MM"
        if (timePart && timePart !== '00:00') time = timePart
      } else {
        // Non-ISO format — fall back to local Date parsing
        const dt = new Date(raw)
        if (!isNaN(dt)) {
          date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
          time = dt.toTimeString().slice(0, 5)
        }
      }
    }
  }

  // Prefer an explicit time field if one was provided
  if (apt.time && typeof apt.time === 'string') {
    time = apt.time.slice(0, 5)
  }

  // ── Professional name ───────────────────────────────────────────────────
  const prof = apt.professional ?? apt.doctor ?? apt.therapist ?? null
  const professionalName =
    apt.professionalName ??
    apt.doctorName ??
    apt.therapistName ??
    (prof
      ? [prof.firstName ?? prof.nombre, prof.lastName ?? prof.apellido]
          .filter(Boolean)
          .join(' ') || prof.name || prof.nombre || null
      : null)

  return {
    ...apt,
    id,
    date,
    time:           time ?? apt.time ?? null,
    status:         apt.status ?? 'scheduled',
    type:           apt.type ?? apt.appointmentType ?? 'consultation',
    duration:       apt.duration ?? apt.durationMinutes ?? 60,
    reason:         apt.reason ?? apt.motivo ?? apt.notes ?? null,
    notes:          apt.notes ?? apt.notas ?? null,
    isVideoCall:    !!(apt.mode === 'videollamada' || apt.isVideoCall || apt.videoCall || apt.online),
    mode:           apt.mode ?? apt.modalidad ?? ((apt.isVideoCall || apt.videoCall || apt.online) ? 'videollamada' : 'consultorio'),
    professionalName,
    // Extract professional's user account ID (for socket routing) from any shape.
    // Backend may populate: professionalId.userId = { _id: '...', email: '...' }
    professionalUserId: (() => {
      if (apt.professionalUserId && typeof apt.professionalUserId === 'string') return apt.professionalUserId
      if (typeof apt.professionalId === 'object' && apt.professionalId !== null) {
        const uid = apt.professionalId.userId
        if (uid) {
          if (typeof uid === 'string') return uid
          if (typeof uid === 'object') return uid._id || uid.id || null
        }
        return apt.professionalId.user?._id || apt.professionalId.user?.id || null
      }
      return null
    })(),
  }
}

/**
 * Normalises a full API response into a sorted array of normalised appointments.
 * Appointments are sorted ascending by date + time (soonest first).
 */
export function normalizeAppointmentsResponse(response) {
  return unwrapAppointmentsResponse(response)
    .map(normalizeAppointment)
    .filter(Boolean)
    .sort((a, b) => {
      const aTs = toLocalDateObj(a.date, a.time)
      const bTs = toLocalDateObj(b.date, b.time)
      return aTs - bTs
    })
}

/* ── Timezone-safe date helpers ─────────────────────────────────────────── */

/**
 * Parses a "YYYY-MM-DD" date string as a LOCAL date (not UTC midnight).
 * Optionally a "HH:MM" time string can be appended.
 *
 * Use this everywhere when comparing appointment dates to `new Date()`.
 */
export function toLocalDateObj(dateStr, timeStr = '00:00') {
  if (!dateStr) return new Date(NaN)

  // If it already contains a time component (ISO datetime string) just parse it
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    return new Date(dateStr)
  }

  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour = 0, minute = 0] = (timeStr ?? '00:00').split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

/**
 * Returns the local Date object for when an appointment ends.
 * Uses start + duration as a proxy since backends rarely store endTime.
 * Exported so PatientDashboard and other consumers can reuse this.
 */
export function endTimeOf(apt) {
  const start = toLocalDateObj(apt.date, apt.time)
  if (isNaN(start)) return new Date(NaN)
  const duration = apt.duration || 60
  return new Date(start.getTime() + duration * 60_000)
}

/**
 * Returns true when an appointment's date is today (local timezone).
 */
export function isToday(dateStr) {
  if (!dateStr) return false
  const apt = toLocalDateObj(dateStr)
  const now = new Date()
  return (
    apt.getFullYear() === now.getFullYear() &&
    apt.getMonth()    === now.getMonth()    &&
    apt.getDate()     === now.getDate()
  )
}
