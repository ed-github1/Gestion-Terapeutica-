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
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()

    return appointments
        .filter(apt => {
            // Support both 'date' and 'fechaHora' fields
            const dateField = apt.fechaHora || apt.date
            
            if (!dateField) return false
            
            // Parse the date - use UTC date parts to avoid timezone conversion issues
            try {
                const aptDateObj = new Date(dateField)
                
                if (isNaN(aptDateObj.getTime())) {
                    return false
                }
                
                // Use LOCAL date parts to compare so the appointment date
                // matches what the user sees on their device's calendar.
                const isToday = (
                    aptDateObj.getFullYear() === todayYear &&
                    aptDateObj.getMonth() === todayMonth &&
                    aptDateObj.getDate() === todayDate
                )
                
                return isToday
                
            } catch (error) {
                return false
            }
        })
        .map(apt => {
            // Combine date and time fields if they exist separately
            let fechaHora = apt.fechaHora || apt.date
            if (apt.time && apt.date) {
                // If we have separate date and time, create a combined ISO string
                const dateObj = new Date(apt.date)
                const [hours, minutes] = apt.time.split(':').map(Number)
                dateObj.setHours(hours, minutes, 0, 0)
                fechaHora = dateObj.toISOString()
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
