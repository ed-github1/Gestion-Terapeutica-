import { useState, useEffect } from 'react'

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
        pendingTasks: 0
    })
    const [patients, setPatients] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${apiUrl}/patients`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })

            if (response.ok) {
                const data = await response.json()
                const patientsList = data.data?.data || data.data || []
                setPatients(Array.isArray(patientsList) ? patientsList : [])

                const activePatients = patientsList.filter(p => p.status === 'active').length

                setStats(prev => ({
                    ...prev,
                    totalPatients: patientsList.length,
                    activeTreatments: activePatients
                }))
            }
        } catch (error) {
            console.error('Error fetching patients:', error)
            throw error
        }
    }

    const fetchAppointments = async () => {
        try {
            const response = await fetch(`${apiUrl}/appointments`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })

            if (response.ok) {
                const data = await response.json()
                const appointmentsList = data.data || []
                setAppointments(Array.isArray(appointmentsList) ? appointmentsList : [])

                // Calculate stats
                const today = new Date().toDateString()
                const todayApts = appointmentsList.filter(apt =>
                    new Date(apt.date).toDateString() === today
                )

                const startOfWeek = new Date()
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
                const weekApts = appointmentsList.filter(apt =>
                    new Date(apt.date) >= startOfWeek && apt.status !== 'cancelled'
                )

                const completed = appointmentsList.filter(apt =>
                    new Date(apt.date) >= startOfWeek && apt.status === 'completed'
                )

                setStats(prev => ({
                    ...prev,
                    todayAppointments: todayApts.length,
                    weekAppointments: weekApts.length,
                    completedThisWeek: completed.length,
                    pendingTasks: appointmentsList.filter(a => a.status === 'pending').length
                }))
            }
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
