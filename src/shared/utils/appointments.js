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
 *   response.data          → { appointments: Array }
 *   response.data          → { data: { appointments: Array } }
 */
export function unwrapAppointmentsResponse(response) {
  const raw = response?.data ?? response

  if (Array.isArray(raw))                    return raw
  if (Array.isArray(raw?.data))              return raw.data
  if (Array.isArray(raw?.appointments))      return raw.appointments
  if (Array.isArray(raw?.data?.appointments)) return raw.data.appointments

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
    apt.startTime ?? apt.start ?? apt.scheduledAt ?? apt.appointmentDate ?? apt.date ?? null

  let date = null
  let time = null

  if (rawDatetime) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDatetime)) {
      // Already a date-only string — keep as-is
      date = rawDatetime
    } else {
      const dt = new Date(rawDatetime)
      if (!isNaN(dt)) {
        date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
        time = dt.toTimeString().slice(0, 5)
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
    isVideoCall:    apt.isVideoCall ?? apt.videoCall ?? apt.online ?? false,
    professionalName,
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
