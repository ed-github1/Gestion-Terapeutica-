import { useState, useEffect } from 'react'
import { useAuth } from '../auth'
import { motion } from 'motion/react'
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
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        activeTreatments: 0,
        pendingTasks: 0
    })
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    // Simulated data - Replace with API calls later
    useEffect(() => {
        // TODO: Fetch real stats from API
        setStats({
            totalPatients: 24,
            todayAppointments: 8,
            activeTreatments: 15,
            pendingTasks: 5
        })
    }, [])

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

    const recentAppointments = [
        { id: 1, patientId: '101', patient: 'María González', time: '09:00 AM', status: 'Confirmada', type: 'Consulta General' },
        { id: 2, patientId: '102', patient: 'Juan Pérez', time: '10:30 AM', status: 'Pendiente', type: 'Seguimiento' },
        { id: 3, patientId: '103', patient: 'Ana Martínez', time: '02:00 PM', status: 'Confirmada', type: 'Control' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        ¡Bienvenido, {user?.name?.split(' ')[0] || 'Doctor'}! 👋
                    </h1>
                    <p className="text-gray-600 mt-2">Aquí está tu resumen del día</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`bg-${stat.color}-100 p-3 rounded-lg`}>
                                    <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                            <p className="text-sm text-gray-600">{stat.title}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Appointments & Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Citas de Hoy */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Citas de Hoy</h2>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Ver todas →
                                </button>
                            </div>
                            <div className="space-y-4">
                                {recentAppointments.map((appointment) => (
                                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {appointment.patient.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{appointment.patient}</p>
                                                <p className="text-sm text-gray-600">{appointment.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                    appointment.status === 'Confirmada' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {appointment.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setDiaryPatient({ id: appointment.patientId, name: appointment.patient })}
                                                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                                title="Ver diario del paciente"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setSelectedAppointment(appointment)}
                                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                title="Iniciar videollamada"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button 
                                    onClick={() => setShowPatientForm(true)}
                                    className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                >
                                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm font-medium">Nuevo Paciente</span>
                                </button>
                                <button 
                                    onClick={() => setShowCalendar(true)}
                                    className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                >
                                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium">Agendar Cita</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition">
                                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium">Tratamiento</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition">
                                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-medium">Reportes</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Activity & Notifications */}
                    <div className="space-y-6">
                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm text-gray-900">Nuevo paciente registrado</p>
                                        <p className="text-xs text-gray-500">Hace 2 horas</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm text-gray-900">Cita completada</p>
                                        <p className="text-xs text-gray-500">Hace 4 horas</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm text-gray-900">Tratamiento actualizado</p>
                                        <p className="text-xs text-gray-500">Ayer</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
                            <h3 className="text-lg font-semibold mb-4">Resumen Semanal</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Pacientes atendidos</span>
                                    <span className="font-bold text-xl">42</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Horas trabajadas</span>
                                    <span className="font-bold text-xl">38h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-100">Tasa de completación</span>
                                    <span className="font-bold text-xl">95%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Form Modal */}
            {showPatientForm && (
                <PatientForm onClose={() => setShowPatientForm(false)} />
            )}

            {/* Video Call Modal */}
            {selectedAppointment && (
                <VideoCallLauncher 
                    appointmentId={selectedAppointment.id}
                    patientName={selectedAppointment.patient}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
        </div>
    )
}

export default ProfessionalDashboardWrapper