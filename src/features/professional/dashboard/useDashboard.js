import { useState, useEffect } from 'react'
import apiClient from '@shared/api/client'

/**
 * Custom hook for fetching and managing dashboard data
 * Handles patients, appointments, and stats calculation
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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/patients')
            const { data } = response

            const patientsList = data?.data?.data || data?.data || []
            setPatients(Array.isArray(patientsList) ? patientsList : [])

            const activePatients = patientsList.filter(p => p.status === 'active').length

            setStats(prev => ({
                ...prev,
                totalPatients: patientsList.length,
                activeTreatments: activePatients
            }))
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
        } catch (error) {
            console.log('Appointments endpoint not available:', error)
        }
    }


    const loadDashboardData = async () => {
        setLoading(true)
        setError(null)
        
        try {
            await Promise.all([fetchPatients(), fetchAppointments()])
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
        activities: [],
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
