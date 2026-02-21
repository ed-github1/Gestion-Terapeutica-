import { useState, useEffect } from 'react'
import apiClient from '@shared/api/client'

/**
 * Derive a recent-activity feed from already-fetched appointments and patients.
 * Returns up to 15 items sorted newest-first, covering the last 30 days.
 *
 * @param {Array} appointments
 * @param {Array} patients
 * @returns {Array}
 */
const buildActivitiesFromData = (appointments = [], patients = []) => {
    const activities = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

    // ── From appointments ──────────────────────────────────────────────────────
    appointments.forEach(apt => {
        const aptDate = new Date(apt.fechaHora || apt.date)
        if (isNaN(aptDate) || aptDate < thirtyDaysAgo) return

        const patientName =
            apt.nombrePaciente ||
            apt.patientName ||
            apt.patient?.name ||
            apt.patient?.nombre ||
            'Paciente'

        if (apt.status === 'completed') {
            activities.push({
                id: `session-${apt.id}`,
                type: 'homework_complete',
                patientName,
                title: 'Sesión completada',
                description: `Sesión completada con ${patientName}`,
                timestamp: aptDate,
                priority: 'normal',
            })
        } else if (apt.status === 'cancelled') {
            activities.push({
                id: `cancel-${apt.id}`,
                type: 'appointment_cancelled',
                patientName,
                title: 'Cita cancelada',
                description: `${patientName} canceló la cita`,
                timestamp: aptDate,
                priority: 'medium',
            })
        } else if (apt.status === 'no-show' || apt.status === 'no_show') {
            activities.push({
                id: `noshow-${apt.id}`,
                type: 'crisis_alert',
                patientName,
                title: 'Paciente no se presentó',
                description: `${patientName} no asistió a la sesión programada`,
                timestamp: aptDate,
                priority: 'high',
            })
        } else if (apt.status === 'confirmed' || apt.status === 'reserved') {
            // Only show upcoming confirmations from the last 3 days
            const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)
            if (aptDate >= threeDaysAgo && aptDate >= now) {
                activities.push({
                    id: `confirm-${apt.id}`,
                    type: 'mood_log',
                    patientName,
                    title: 'Cita confirmada',
                    description: `${patientName} confirmó su próxima cita`,
                    timestamp: new Date(apt.updatedAt || apt.createdAt || aptDate),
                    priority: 'normal',
                })
            }
        }
    })

    // ── From patients – new registrations ────────────────────────────────────
    patients.forEach(patient => {
        const createdAt = new Date(patient.createdAt || patient.created_at || patient.fechaRegistro)
        if (isNaN(createdAt) || createdAt < thirtyDaysAgo) return

        const patientName =
            patient.name ||
            patient.nombre ||
            `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
            `${patient.nombre || ''} ${patient.apellido || ''}`.trim() ||
            'Nuevo paciente'

        activities.push({
            id: `patient-${patient.id}`,
            type: 'outcome_improvement',
            patientName,
            title: 'Nuevo paciente registrado',
            description: `${patientName} se registró como nuevo paciente`,
            timestamp: createdAt,
            priority: 'normal',
        })
    })

    // Sort newest first, cap at 15
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return activities.slice(0, 15)
}

/**
 * Custom hook for fetching and managing dashboard data
 * Handles patients, appointments, stats and activity feed
 *
 * @returns {Object} Dashboard data and loading states
 */
export const useDashboardData = () => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        weekAppointments: 0,
        activeTreatments: 0,
        completedThisWeek: 0,
        pendingTasks: 0,
        pendingNotes: 0,
        noShowCount: 0,
        unreadMessages: 0
    })
    const [patients, setPatients] = useState([])
    const [appointments, setAppointments] = useState([])
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/patients')
            const { data } = response

            const patientsList = data?.data?.data || data?.data || []
            const list = Array.isArray(patientsList) ? patientsList : []
            setPatients(list)

            const activePatients = list.filter(p => p.status === 'active').length

            setStats(prev => ({
                ...prev,
                totalPatients: list.length,
                activeTreatments: activePatients
            }))

            return list
        } catch (error) {
            console.error('Error fetching patients:', error)
            throw error
        }
    }

    const fetchAppointments = async () => {
        try {
            const response = await apiClient.get('/appointments')
            const { data } = response
            console.log('[useDashboard] /appointments raw response:', JSON.stringify(data))

            // Handle all common backend envelope shapes
            let appointmentsList =
                Array.isArray(data)              ? data :
                Array.isArray(data?.data)        ? data.data :
                Array.isArray(data?.appointments)? data.appointments :
                Array.isArray(data?.data?.data)  ? data.data.data :
                []

            console.log('[useDashboard] appointments resolved:', appointmentsList.length, appointmentsList)
            setAppointments(Array.isArray(appointmentsList) ? appointmentsList : [])

                // Compare date-only strings to avoid UTC-vs-local day shift
                const now = new Date()
                const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
                // Slice first 10 chars of any date/ISO field to get "YYYY-MM-DD"
                const toDateStr = (d) => d ? String(d).slice(0, 10) : ''
                const todayApts = appointmentsList.filter(apt =>
                    toDateStr(apt.date || apt.fechaHora) === todayStr
                )

                const startOfWeek = new Date()
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
                const weekApts = appointmentsList.filter(apt =>
                    new Date(apt.date || apt.fechaHora) >= startOfWeek && apt.status !== 'cancelled'
                )

                const completed = appointmentsList.filter(apt =>
                    new Date(apt.date || apt.fechaHora) >= startOfWeek && apt.status === 'completed'
                )

                const noShows = appointmentsList.filter(apt =>
                    apt.status === 'no-show' || apt.status === 'no_show'
                )

                const pendingNotes = appointmentsList.filter(apt =>
                    apt.status === 'completed' && !apt.sessionNotes && !apt.notes
                )

                setStats(prev => ({
                    ...prev,
                    todayAppointments: todayApts.length,
                    weekAppointments: weekApts.length,
                    completedThisWeek: completed.length,
                    pendingTasks: appointmentsList.filter(a => a.status === 'pending').length,
                    pendingNotes: pendingNotes.length,
                    noShowCount: noShows.length
                }))

            return appointmentsList
        } catch (error) {
            console.log('Appointments endpoint not available:', error)
            return []
        }
    }


    const loadDashboardData = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const [fetchedPatients, fetchedAppointments] = await Promise.all([
                fetchPatients().catch(() => []),
                fetchAppointments().catch(() => []),
            ])
            setActivities(buildActivitiesFromData(
                Array.isArray(fetchedAppointments) ? fetchedAppointments : [],
                Array.isArray(fetchedPatients)     ? fetchedPatients     : []
            ))
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            setError('No se pudo cargar la información. Mostrando datos locales.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()
    }, [])

    return {
        stats,
        patients,
        appointments,
        activities,
        loading,
        error,
        setError,
        refreshData: loadDashboardData
    }
}

/**
 * Custom hook for managing dashboard view state
 * Handles navigation between dashboard, calendar, and diary views
 * 
 * @returns {Object} View state and navigation handlers
 */

export const useDashboardView = () => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [diaryPatient, setDiaryPatient] = useState(null)
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    return {
        showCalendar,
        setShowCalendar,
        diaryPatient,
        setDiaryPatient,
        showPatientForm,
        setShowPatientForm,
        selectedAppointment,
        setSelectedAppointment
    }
}

/**
 * Custom hook for current time display
 * Updates every second for real-time clock
 * 
 * @returns {Date} Current time
 */
export const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return currentTime
}
