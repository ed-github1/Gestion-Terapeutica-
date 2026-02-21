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

/**
 * Filter appointments for today
 * @param {Array} appointments - All appointments
 * @returns {Array} Today's appointments
 */
export const getTodayAppointments = (appointments) => {
    if (!Array.isArray(appointments) || appointments.length === 0) {
        return []
    }

    const now = new Date()
    const todayYear  = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate  = now.getDate()

    return appointments
        .filter(apt => {
            const dateField = apt.fechaHora || apt.date
            if (!dateField) return false

            try {
                // Always extract the YYYY-MM-DD portion first (handles both
                // plain "2026-02-18" and ISO "2026-02-18T00:00:00.000Z").
                // Parsing just the date part avoids the UTC-vs-local day shift.
                const dateOnly = String(dateField).slice(0, 10) // "2026-02-18"
                const [year, month, day] = dateOnly.split('-').map(Number)

                return (
                    year  === todayYear &&
                    month === todayMonth + 1 && // slice gives 1-based month
                    day   === todayDate
                )
            } catch {
                return false
            }
        })
        .map(apt => {
            // Combine date and time fields if they exist separately
            let fechaHora = apt.fechaHora || apt.date
            if (apt.time && apt.date) {
                // Parse the YYYY-MM-DD portion directly to avoid UTC→local day shift.
                // e.g. "2026-02-20T00:00:00.000Z" slice(0,10) → "2026-02-20"
                // Using new Date(isoString) in UTC-6 gives Feb 19, not Feb 20.
                const dateOnly = String(apt.date).slice(0, 10)
                const [yr, mo, dy] = dateOnly.split('-').map(Number)
                const [hours, minutes] = apt.time.split(':').map(Number)
                fechaHora = new Date(yr, mo - 1, dy, hours, minutes, 0, 0).toISOString()
            }
            
            return {
                id: apt._id || apt.id,
                patientId: apt.patientId?._id || apt.patientId,
                nombrePaciente: apt.patientName || apt.nombrePaciente || (apt.patientId?.nombre 
                    ? `${apt.patientId.nombre} ${apt.patientId.apellido}` 
                    : 'Paciente'),
                fechaHora: fechaHora,
                estado: apt.estado || apt.status,
                type: apt.type || 'Consulta',
                riskLevel: apt.riskLevel || 'low',
                lastSessionNote: apt.lastSessionNote || '',
                treatmentGoal: apt.treatmentGoal || '',
                homeworkCompleted: apt.homeworkCompleted || false,
                ultimaVisita: apt.ultimaVisita || null
            }
        })
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
