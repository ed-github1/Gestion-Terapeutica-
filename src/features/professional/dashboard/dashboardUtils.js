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
    const now = new Date()
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()

    return appointments
        .filter(apt => {
            let isToday = false
            if (/^\d{4}-\d{2}-\d{2}$/.test(apt.date)) {
                const [y, m, d] = apt.date.split('-').map(Number)
                const aptDateObj = new Date(todayYear, m - 1, d)
                isToday = (
                    aptDateObj.getFullYear() === todayYear &&
                    aptDateObj.getMonth() === todayMonth &&
                    aptDateObj.getDate() === todayDate
                )
            } else {
                const aptDateObj = new Date(apt.date)
                isToday = (
                    aptDateObj.getFullYear() === todayYear &&
                    aptDateObj.getMonth() === todayMonth &&
                    aptDateObj.getDate() === todayDate
                )
            }
            return isToday
        })
        .map(apt => ({
            id: apt._id || apt.id,
            patientId: apt.patientId?._id || apt.patientId,
            patientName: apt.patientId?.nombre 
                ? `${apt.patientId.nombre} ${apt.patientId.apellido}` 
                : 'Paciente',
            dateTime: apt.date,
            status: apt.status,
            type: apt.type || 'Consulta'
        }))
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
