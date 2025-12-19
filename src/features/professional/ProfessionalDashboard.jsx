import { useState, useEffect } from 'react'
import { useAuth } from '../auth'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import PatientForm from './PatientForm'
import VideoCallLauncher from './VideoCall'
import AppointmentsCalendar from './AppointmentsCalendar'
import PatientDiary from './PatientDiary'

// Wrapper component to switch between dashboard, calendar, and diary
const ProfessionalDashboardWrapper = () => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [diaryPatient, setDiaryPatient] = useState(null)

    if (diaryPatient) {
        return (
            <PatientDiary 
                patientId={diaryPatient.id}
                patientName={diaryPatient.name}
                onClose={() => setDiaryPatient(null)}
            />
        )
    }

    if (showCalendar) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowCalendar(false)}
                    className="fixed top-4 left-4 z-50 flex items-center px-4 py-2 bg-white shadow-lg rounded-lg hover:bg-gray-50 transition"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Dashboard
                </button>
                <AppointmentsCalendar />
            </div>
        )
    }

    return <ProfessionalDashboardContent setShowCalendar={setShowCalendar} setDiaryPatient={setDiaryPatient} />
}

const ProfessionalDashboardContent = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        activeTreatments: 0,
        pendingTasks: 0
    })
    const [patients, setPatients] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            // Fetch patients
            const patientsResponse = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/patients`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
                    }
                }
            )
            
            if (patientsResponse.ok) {
                const patientsData = await patientsResponse.json()
                const patientsList = patientsData.data?.data || patientsData.data || []
                setPatients(Array.isArray(patientsList) ? patientsList : [])
                
                // Calculate stats from real data
                setStats({
                    totalPatients: patientsList.length,
                    todayAppointments: 0, // Will be updated with appointments data
                    activeTreatments: patientsList.filter(p => p.status === 'active').length,
                    pendingTasks: 0 // Can be calculated from appointments or tasks
                })
            }

            // Fetch appointments (if endpoint exists)
            try {
                const appointmentsResponse = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/appointments`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
                        }
                    }
                )
                
                if (appointmentsResponse.ok) {
                    const appointmentsData = await appointmentsResponse.json()
                    const appointmentsList = appointmentsData.data || []
                    setAppointments(Array.isArray(appointmentsList) ? appointmentsList : [])
                    
                    // Calculate today's appointments
                    const today = new Date().toDateString()
                    const todayAppointments = appointmentsList.filter(apt => 
                        new Date(apt.date).toDateString() === today
                    )
                    
                    setStats(prev => ({
                        ...prev,
                        todayAppointments: todayAppointments.length,
                        pendingTasks: appointmentsList.filter(a => a.status === 'pending').length
                    }))
                }
            } catch (error) {
                console.log('Appointments endpoint not available:', error)
            }
            
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const statsCards = [
        {
            title: 'Pacientes Totales',
            value: stats.totalPatients,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'blue',
            trend: '+12%'
        },
        {
            title: 'Citas Hoy',
            value: stats.todayAppointments,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'green',
            trend: 'Normal'
        },
        {
            title: 'Tratamientos Activos',
            value: stats.activeTreatments,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'purple',
            trend: '+3 esta semana'
        },
        {
            title: 'Tareas Pendientes',
            value: stats.pendingTasks,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'orange',
            trend: 'Urgente'
        }
    ]

    // Get today's appointments from real data
    const now = new Date()
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()
    const recentAppointments = appointments
        .filter(apt => {
            let isToday = false
            if (/^\d{4}-\d{2}-\d{2}$/.test(apt.date)) {
                // Date-only string, treat as local date
                const [y, m, d] = apt.date.split('-').map(Number)
                const aptDateObj = new Date(todayYear, m - 1, d)
                isToday = (
                    aptDateObj.getFullYear() === todayYear &&
                    aptDateObj.getMonth() === todayMonth &&
                    aptDateObj.getDate() === todayDate
                )
            } else if (typeof apt.date === 'string' && apt.date.endsWith('Z')) {
                // ISO string in UTC, compare UTC date parts
                const aptDateObj = new Date(apt.date)
                isToday = (
                    aptDateObj.getUTCFullYear() === now.getUTCFullYear() &&
                    aptDateObj.getUTCMonth() === now.getUTCMonth() &&
                    aptDateObj.getUTCDate() === now.getUTCDate()
                )
            } else {
                // Fallback: parse as local date
                const aptDateObj = new Date(apt.date)
                isToday = (
                    aptDateObj.getFullYear() === todayYear &&
                    aptDateObj.getMonth() === todayMonth &&
                    aptDateObj.getDate() === todayDate
                )
            }
            return isToday
        })
        .slice(0, 5)
        .map(apt => ({
            id: apt._id || apt.id,
            patientId: apt.patientId?._id || apt.patientId,
            patient: apt.patientId?.nombre ? `${apt.patientId.nombre} ${apt.patientId.apellido}` : 'Paciente',
            time: apt.time || new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            status: apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'pending' ? 'Pendiente' : apt.status === 'cancelled' ? 'Cancelada' : 'Completada',
            type: apt.type || 'Consulta'
        }))

    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour < 12) return '¡Buenos días'
        if (hour < 19) return '¡Buenas tardes'
        return '¡Buenas noches'
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-800 mb-2 flex items-center gap-3">
                                <span className="text-purple-400">✨</span>
                                {getGreeting()}, Dr. {user?.name?.split(' ')[0] || user?.nombre || 'Doctor'}
                            </h1>
                            <p className="text-gray-600">
                                {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-right bg-purple-50 px-6 py-3 rounded-2xl">
                                <div className="text-2xl font-semibold text-purple-600">{currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-xs text-purple-500">Hora actual</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((stat, index) => {
                        const colors = {
                            blue: 'from-blue-400 to-blue-500',
                            green: 'from-emerald-400 to-teal-500',
                            purple: 'from-purple-400 to-pink-500',
                            orange: 'from-amber-400 to-orange-500'
                        }
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4 }}
                                className={`relative overflow-hidden bg-linear-to-br ${colors[stat.color]} p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
                                <div className="relative text-white">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl">
                                            {stat.icon}
                                        </div>
                                        <span className="text-xs bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">{stat.trend}</span>
                                    </div>
                                    <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                                    <p className="text-sm text-white/90">{stat.title}</p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Appointments & Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Sesiones de Hoy</h2>
                                </div>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                            onClick={() => setShowCalendar(true)}
                                                                            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition flex items-center gap-1"
                                                                    >
                                                                            <span>Ver agenda</span>
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowCalendar(true)}
                                                                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium transition-all hover:scale-105 hover:shadow-xl hover:from-pink-500 hover:to-purple-500"
                                                                    >
                                                                        Agendar Cita
                                                                    </button>
                                                                </div>
                            </div>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : recentAppointments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-500 mb-2">No tienes citas programadas para hoy</p>
                                        <button 
                                            onClick={() => setShowCalendar(true)}
                                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                        >
                                            Ver agenda completa
                                        </button>
                                    </div>
                                ) : recentAppointments.map((appointment, idx) => (
                                    <motion.div 
                                        key={appointment.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.05 }}
                                        whileHover={{ scale: 1.01 }}
                                        className="flex items-center justify-between p-4 bg-linear-to-r from-purple-50/50 to-blue-50/50 rounded-2xl hover:shadow-md transition-all border border-purple-100/50"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                                                <span className="text-white font-semibold text-base">
                                                    {appointment.patient.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{appointment.patient}</p>
                                                <p className="text-sm text-gray-500">{appointment.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-purple-600 font-semibold text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {appointment.time}
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    appointment.status === 'Confirmada' 
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {appointment.status === 'Confirmada' ? '✓ Confirmada' : '⏱ Pendiente'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDiaryPatient({ id: appointment.patientId, name: appointment.patient })}
                                                    className="p-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-xl transition-colors"
                                                    title="Ver diario"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedAppointment(appointment)}
                                                    className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"
                                                    title="Videollamada"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">Acciones Rápidas</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <motion.button 
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowPatientForm(true)}
                                    className="flex flex-col items-center justify-center p-5 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl hover:shadow-lg transition-all text-white"
                                >
                                    <svg className="w-7 h-7 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm font-semibold">Nuevo Paciente</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCalendar(true)}
                                    className="flex flex-col items-center justify-center p-5 bg-linear-to-br from-emerald-400 to-teal-500 rounded-2xl hover:shadow-lg transition-all text-white"
                                >
                                    <svg className="w-7 h-7 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-semibold">Nueva Sesión</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/dashboard/professional/patients')}
                                    className="flex flex-col items-center justify-center p-5 bg-linear-to-br from-purple-400 to-pink-500 rounded-2xl hover:shadow-lg transition-all text-white"
                                >
                                    <svg className="w-7 h-7 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">Pacientes</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center justify-center p-5 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl hover:shadow-lg transition-all text-white"
                                >
                                    <svg className="w-7 h-7 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-semibold">Informes</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-purple-100 p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-linear-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">Actividad Reciente</h2>
                            </div>
                            <div className="space-y-3">
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100"
                                >
                                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">Nuevo paciente registrado</p>
                                        <p className="text-xs text-gray-500 mt-1">Hace 2 horas</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-start space-x-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100"
                                >
                                    <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">Sesión completada</p>
                                        <p className="text-xs text-gray-500 mt-1">Hace 4 horas</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55 }}
                                    className="flex items-start space-x-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-100"
                                >
                                    <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">Tratamiento actualizado</p>
                                        <p className="text-xs text-gray-500 mt-1">Ayer</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold">Resumen Semanal</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                        <span className="text-white/90 text-sm font-medium">Pacientes atendidos</span>
                                        <span className="font-bold text-2xl">42</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                        <span className="text-white/90 text-sm font-medium">Horas de sesión</span>
                                        <span className="font-bold text-2xl">38h</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                        <span className="text-white/90 text-sm font-medium">Tasa de éxito</span>
                                        <span className="font-bold text-2xl">95%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showPatientForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <PatientForm 
                                onClose={() => {
                                    setShowPatientForm(false)
                                    loadDashboardData() // Refresh dashboard data after adding patient
                                }} 
                            />
                        </motion.div>
                    </motion.div>
                )}

                {selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <VideoCallLauncher 
                            appointmentId={selectedAppointment.id}
                            patientName={selectedAppointment.patient}
                            patientId={selectedAppointment.patientId}
                            onClose={() => setSelectedAppointment(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ProfessionalDashboardWrapper