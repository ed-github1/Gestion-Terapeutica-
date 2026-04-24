import { useState, useEffect } from 'react'
import apiClient from '@shared/api/client'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { resolvePatientName, sanitizeName } from '../utils/dashboardUtils'

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

        const patientName = resolvePatientName(apt)

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

        const patientName = sanitizeName(
            patient.name ||
            patient.nombre ||
            `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
            `${patient.nombre || ''} ${patient.apellido || ''}`.trim()
        ) || 'Nuevo paciente'

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
        unreadMessages: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        outstandingAmount: 0,
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
            const response = await appointmentsService.getAllAsProf({})
            const raw = response?.data

            // Handle all common backend envelope shapes
            let appointmentsList =
                Array.isArray(raw)              ? raw :
                Array.isArray(raw?.data)        ? raw.data :
                Array.isArray(raw?.appointments)? raw.appointments :
                Array.isArray(raw?.data?.data)  ? raw.data.data :
                []

            // Normalise each appointment so it always has a combined `fechaHora`
            // (same logic as AppointmentsCalendar which is known to work)
            appointmentsList = appointmentsList.map(apt => {
                let fechaHora = apt.fechaHora || apt.date
                if (apt.time && apt.date && !apt.fechaHora) {
                    const dateOnly = String(apt.date).slice(0, 10)
                    const [yr, mo, dy] = dateOnly.split('-').map(Number)
                    const [hours, minutes] = apt.time.split(':').map(Number)
                    fechaHora = new Date(yr, mo - 1, dy, hours, minutes, 0, 0).toISOString()
                }
                return {
                    ...apt,
                    id: apt._id || apt.id,
                    fechaHora,
                    nombrePaciente: resolvePatientName(apt),
                    estado: apt.estado || apt.status,
                }
            })

            setAppointments(appointmentsList)

                console.log('📅 All appointments:', appointmentsList.length)
                console.log('💰 Appointments with payment data:', appointmentsList.map(apt => ({
                    id: apt.id,
                    date: apt.date || apt.fechaHora,
                    paymentStatus: apt.paymentStatus,
                    status: apt.status,
                    amount: apt.amount,
                    price: apt.price,
                    patient: apt.nombrePaciente
                })))

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

                // Revenue: sum amount of paid appointments this & last calendar month
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 1)

                const aptDate = apt => new Date(apt.date || apt.fechaHora)

                // Revenue calculation — fetch from backend API if available, fallback to client-side
                let revenueThisMonth = 0
                let revenueLastMonth = 0
                try {
                    const revenueRes = await appointmentsService.getRevenue()
                    const revenueData = revenueRes?.data?.data || revenueRes?.data || {}
                    
                    console.log('🔍 Raw API response:', JSON.stringify(revenueData, null, 2))
                    
                    // Backend returns: { totalRevenue, monthly: [{ year, month, revenue, count }], ... }
                    if (revenueData.monthly && Array.isArray(revenueData.monthly)) {
                        const currentMonth = now.getMonth() + 1 // 1-12
                        const currentYear = now.getFullYear()
                        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
                        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
                        
                        console.log('📆 Looking for:', { currentMonth, currentYear, lastMonth, lastMonthYear })
                        console.log('📊 Monthly data from API:', revenueData.monthly)
                        
                        // Find current month revenue (API returns flat structure with year, month, revenue)
                        const thisMonthData = revenueData.monthly.find(m => 
                            m.month === currentMonth && m.year === currentYear
                        )
                        revenueThisMonth = thisMonthData?.revenue || thisMonthData?.total || 0
                        
                        console.log('✨ Found this month:', thisMonthData, '→ revenue:', revenueThisMonth)
                        
                        // Find last month revenue
                        const lastMonthData = revenueData.monthly.find(m =>
                            m.month === lastMonth && m.year === lastMonthYear
                        )
                        revenueLastMonth = lastMonthData?.revenue || lastMonthData?.total || 0
                    } else {
                        // Fallback to direct properties if structure is different
                        revenueThisMonth = revenueData.thisMonth || 0
                        revenueLastMonth = revenueData.lastMonth || 0
                    }
                    
                    console.log('✅ Revenue from API:', { revenueThisMonth, revenueLastMonth, raw: revenueData })
                } catch (err) {
                    console.log('⚠️ Revenue API failed, using client-side calculation:', err.message)
                    // Fallback: calculate client-side (backend returns paymentStatus === 'completed')
                    const isPaid = apt => apt.paymentStatus === 'completed' || apt.paymentStatus === 'paid'
                    const thisMonthApts = appointmentsList.filter(apt => isPaid(apt) && aptDate(apt) >= thisMonthStart)
                    revenueThisMonth = thisMonthApts.reduce((sum, apt) => sum + (Number(apt.amount || apt.price) || 0), 0)
                    revenueLastMonth = appointmentsList
                        .filter(apt => isPaid(apt) && aptDate(apt) >= lastMonthStart && aptDate(apt) < lastMonthEnd)
                        .reduce((sum, apt) => sum + (Number(apt.amount || apt.price) || 0), 0)
                    console.log('📊 Client-side revenue:', { 
                        revenueThisMonth, 
                        revenueLastMonth,
                        thisMonthApts: thisMonthApts.length,
                        sampleApt: thisMonthApts[0] ? {
                            id: thisMonthApts[0].id,
                            paymentStatus: thisMonthApts[0].paymentStatus,
                            amount: thisMonthApts[0].amount,
                            price: thisMonthApts[0].price,
                            date: thisMonthApts[0].date || thisMonthApts[0].fechaHora
                        } : 'none'
                    })
                }

                // Outstanding: pending-payment appointments that are not cancelled
                const outstandingAmount = appointmentsList
                    .filter(apt => apt.paymentStatus === 'pending' && apt.status !== 'cancelled')
                    .reduce((sum, apt) => sum + (Number(apt.amount || apt.price) || 0), 0)

                console.log('💵 Final revenue stats:', { revenueThisMonth, revenueLastMonth, outstandingAmount })

                setStats(prev => ({
                    ...prev,
                    todayAppointments: todayApts.length,
                    weekAppointments: weekApts.length,
                    completedThisWeek: completed.length,
                    pendingTasks: appointmentsList.filter(a => a.status === 'reserved').length,
                    pendingNotes: pendingNotes.length,
                    noShowCount: noShows.length,
                    revenueThisMonth,
                    revenueLastMonth,
                    outstandingAmount,
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

            // Build a quick lookup map: patientId -> display name
            const patientMap = new Map()
            ;(Array.isArray(fetchedPatients) ? fetchedPatients : []).forEach(p => {
                const id = String(p._id || p.id || '')
                if (!id) return
                const name = sanitizeName(
                    p.name ||
                    p.nombre ||
                    `${p.firstName || ''} ${p.lastName || ''}`.trim() ||
                    `${p.nombre || ''} ${p.apellido || ''}`.trim()
                )
                if (name) patientMap.set(id, name)
            })

            // Re-enrich appointments whose name still fell back to 'Paciente'
            if (patientMap.size > 0 && Array.isArray(fetchedAppointments)) {
                const enriched = fetchedAppointments.map(apt => {
                    if (apt.nombrePaciente && apt.nombrePaciente !== 'Paciente') return apt
                    const pid = String(apt.patientId?._id || apt.patientId || '')
                    const name = patientMap.get(pid)
                    return name ? { ...apt, nombrePaciente: name } : apt
                })
                setAppointments(enriched)
            }

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

    // Refresh appointments automatically when any appointment socket event fires
    useEffect(() => {
        const APPOINTMENT_EVENTS = [
            'appointment-booked',
            'appointment-confirmed',
            'appointment-cancelled',
            'appointment-rescheduled',
            'appointment-paid',
            'appointment-pending',
        ]
        const unsubs = APPOINTMENT_EVENTS.map(ev =>
            socketNotificationService.on(ev, () => loadDashboardData())
        )
        return () => unsubs.forEach(fn => fn())
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
