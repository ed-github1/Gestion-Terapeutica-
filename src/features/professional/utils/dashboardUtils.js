/**
 * Strip the literal words "undefined" and "null" that can leak into names
 * when JS values are accidentally coerced to strings.
 *
 * @param {string} raw
 * @returns {string} cleaned name, or '' if nothing useful remains
 */
export const sanitizeName = (raw) => {
    if (!raw || typeof raw !== 'string') return ''
    const cleaned = raw
        .replace(/\bundefined\b/gi, '')
        .replace(/\bnull\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    return cleaned || ''
}

/**
 * Safely resolve a patient display name from an appointment object.
 * Handles populated patientId objects (firstName/lastName or nombre/apellido)
 * and falls back to stored string fields.
 * Always sanitises the result so "undefined" / "null" never leak into the UI.
 *
 * @param {object} apt - Appointment object
 * @returns {string} Patient display name
 */
export const resolvePatientName = (apt) => {
    // 1. Populated patientId object (Patient or User model)
    const pid = apt?.patientId
    if (pid && typeof pid === 'object') {
        const first = sanitizeName(pid.firstName || pid.nombre || '')
        const last  = sanitizeName(pid.lastName  || pid.apellido || '')
        const full  = `${first} ${last}`.trim()
        if (full) return full
        const name = sanitizeName(pid.name || pid.fullName || '')
        if (name) return name
    }

    // 2. Populated patient object (calendar API shape)
    const p = apt?.patient
    if (p && typeof p === 'object') {
        const first = sanitizeName(p.firstName || p.nombre || '')
        const last  = sanitizeName(p.lastName  || p.apellido || '')
        const full  = `${first} ${last}`.trim()
        if (full) return full
        const name = sanitizeName(p.name || p.fullName || '')
        if (name) return name
    }

    // 3. Denormalized string fields on the appointment itself
    for (const field of [apt?.patientName, apt?.nombrePaciente]) {
        const cleaned = sanitizeName(field)
        if (cleaned) return cleaned
    }

    return 'Paciente'
}

/**
 * Get appropriate greeting based on time of day
 * @param {Date} currentTime - Current time
 * @returns {string} Greeting message
 */
export const getGreeting = (currentTime) => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
}

const todayDateParts = () => {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() }
}

const matchesToday = (apt) => {
    const dateField = apt.date || apt.fechaHora
    if (!dateField) return false
    try {
        const dateOnly = String(dateField).slice(0, 10)
        const [year, month, day] = dateOnly.split('-').map(Number)
        const { y, m, d } = todayDateParts()
        return year === y && month === m + 1 && day === d
    } catch { return false }
}

const mapToSession = (apt) => {
    let fechaHora = apt.fechaHora || apt.date
    if (apt.time && apt.date) {
        const dateOnly = String(apt.date).slice(0, 10)
        const [yr, mo, dy] = dateOnly.split('-').map(Number)
        const [hours, minutes] = apt.time.split(':').map(Number)
        fechaHora = new Date(yr, mo - 1, dy, hours, minutes, 0, 0).toISOString()
    }
    const rawPid = apt.patientId || apt.patient
    const patientDocId = (typeof rawPid === 'object' && rawPid !== null)
        ? (rawPid._id || rawPid.id || null)
        : (rawPid || null)
    const patientUserId = apt.patientUserId
        || (typeof rawPid === 'object' && rawPid !== null ? (rawPid.userId || rawPid.user) : null)
        || null
    return {
        id: apt._id || apt.id,
        patientId: patientDocId,
        patientUserId,
        nombrePaciente: resolvePatientName(apt),
        fechaHora,
        estado: apt.estado || apt.status,
        type: apt.type || 'Consulta',
        riskLevel: apt.riskLevel || 'low',
        lastSessionNote: apt.lastSessionNote || '',
        treatmentGoal: apt.treatmentGoal || '',
        homeworkCompleted: apt.homeworkCompleted || false,
        ultimaVisita: apt.ultimaVisita || null,
        isVideoCall: apt.isVideoCall || apt.mode === 'videollamada' || false,
        mode: apt.mode ?? (apt.isVideoCall ? 'videollamada' : 'consultorio'),
        duration: apt.duration || 60,
        paymentStatus: apt.paymentStatus || null,
    }
}

/**
 * Today's appointments that are confirmed/paid — safe to show in the active sessions list.
 */
export const getTodayAppointments = (appointments) => {
    if (!Array.isArray(appointments) || appointments.length === 0) return []
    return appointments
        .filter(apt => {
            if (!matchesToday(apt)) return false
            const status = apt.status || apt.estado || ''
            if (status === 'cancelled' || status === 'no-show') return false
            if (status === 'reserved') return false
            if (status === 'accepted' && apt.paymentStatus !== 'completed') return false
            if (status === 'confirmed' && apt.paymentStatus === 'pending') return false
            return true
        })
        .map(mapToSession)
}

/**
 * Today's appointments hidden from the active session list that the professional
 * should still have visibility of: pending payment/acceptance and cancelled/rejected.
 */
export const getPendingPaymentAppointments = (appointments) => {
    if (!Array.isArray(appointments) || appointments.length === 0) return []
    return appointments
        .filter(apt => {
            if (!matchesToday(apt)) return false
            const status = apt.status || apt.estado || ''
            return (
                status === 'cancelled' ||
                status === 'no-show' ||
                status === 'reserved' ||
                (status === 'accepted' && apt.paymentStatus !== 'completed') ||
                (status === 'confirmed' && apt.paymentStatus === 'pending')
            )
        })
        .map(mapToSession)
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
}

/**
 * Get patient initials from name
 * @param {string} name - Patient full name
 * @returns {string} Initials (max 2 characters)
 */
export const getPatientInitials = (name) => {
    if (!name) return '??'
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }
    return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options })
}

/**
 * Format time for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calculate progress percentage
 * @param {number} completed - Completed count
 * @param {number} total - Total count
 * @returns {number} Percentage (0-100)
 */
export const calculateProgress = (completed, total) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
}
