import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@features/auth'
import { useNavigate } from 'react-router-dom'
import PatientForm from './PatientForm'
import TodaysSessions from './TodaysSessions'
import ActivityFeed from './ActivityFeed'
import { useDashboardData } from '../dashboard/useDashboard'
import { Clock } from 'lucide-react'
import { formatDate, formatTime } from '../dashboard/dashboardUtils'
import { ROUTES } from '@constants/routes'

const ModernProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [currentTime, setCurrentTime] = useState(new Date())
    const { stats, patients, appointments, activities, loading, error } = useDashboardData()
    const [showPatientForm, setShowPatientForm] = useState(false)

    // Extract user name with fallback
    const userName = user?.name?.split(' ')[0] || user?.nombre || 'Doctor'
    const fullName = user?.name || user?.nombre || 'Professional'
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    // const [activePatients, setActivePatients] = useState([
    //     { id: 1, name: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=Sarah&background=6366f1&color=fff' },
    //     { id: 2, name: 'Mike', avatar: 'https://ui-avatars.com/api/?name=Mike&background=10b981&color=fff' },
    //     { id: 3, name: 'Emma', avatar: 'https://ui-avatars.com/api/?name=Emma&background=f59e0b&color=fff' }
    // ])

    // Mock appointments data
    const mockAppointments = [
        {
            id: 1,
            nombrePaciente: 'Jemma Linda',
            fechaHora: new Date(new Date().setHours(9, 0, 0)),
            ultimaVisita: new Date(new Date().setDate(new Date().getDate() - 7)),
            riskLevel: 'low',
            lastSessionNote: 'Progresando bien con el manejo de la ansiedad',
            treatmentGoal: 'Continuar ejercicios TCC',
            homeworkCompleted: true
        },
        {
            id: 2,
            nombrePaciente: 'Andy John',
            fechaHora: new Date(new Date().setHours(10, 0, 0)),
            ultimaVisita: new Date(new Date().setDate(new Date().getDate() - 3)),
            riskLevel: 'medium',
            lastSessionNote: 'Necesita apoyo con equilibrio trabajo-vida',
            treatmentGoal: 'Desarrollar estrategias de manejo del estrés',
            homeworkCompleted: true
        },
        {
            id: 3,
            nombrePaciente: 'Ariana Jamie',
            fechaHora: new Date(new Date().setHours(12, 0, 0)),
            ultimaVisita: new Date(new Date().setDate(new Date().getDate() - 21)),
            riskLevel: 'low',
            lastSessionNote: 'Excelente progreso en terapia grupal',
            treatmentGoal: 'Mantener plan de tratamiento actual',
            homeworkCompleted: false
        }
    ]

    // Mock activities data
    const mockActivities = [
        {
            id: 1,
            type: 'mood_log',
            patientName: 'Sarah Mitchell',
            description: 'Registro de ánimo enviado - Nivel de ansiedad disminuyó',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            priority: 'normal'
        },
        {
            id: 2,
            type: 'homework_complete',
            patientName: 'Mike Johnson',
            description: 'Tarea completada',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            priority: 'normal'
        },
        {
            id: 3,
            type: 'appointment_cancelled',
            patientName: 'Emma Davis',
            description: 'Canceló la cita de mañana',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            priority: 'high'
        }
    ]

    // Use mock data for now (always show it)
    const todayAppointments = mockAppointments
    const dashboardActivities = activities && activities.length > 0 ? activities : mockActivities

    // Get upcoming patient info from first appointment
    const upcomingPatient = todayAppointments[0]
    const monthGrowth = Math.round((stats.totalPatients / Math.max(stats.totalPatients - 10, 1)) * 100) - 100

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour < 12) return 'Buenos días'
        if (hour < 18) return 'Buenas tardes'
        return 'Buenas noches'
    }

    return (
        <>
            <div className="h-screen bg-gray-50">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] h-screen">
                    {/* Main Content */}
                    <div className="p-8 overflow-y-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-xl text-gray-600 mb-1">{getGreeting()},</h1>
                                    <p className="text-4xl font-bold text-gray-900 mb-3">
                                        Dr. {userName}!
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(currentTime)}
                                        </p>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
                                            <Clock className="w-4 h-4 text-gray-900" />
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatTime(currentTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar"
                                            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {/* Notifications */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white relative shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-50"></span>
                                    </motion.button>

                                    {/* Profile Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate(ROUTES.PROFESSIONAL_PROFILE)}
                                        className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-lg"
                                        title="Ver Perfil"
                                    >
                                        {initials}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Total Patients Card - Dark */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className=" bg-linear-to-br from-blue-400 to-indigo-500 rounded-4xl p-8 text-white relative overflow-hidden shadow-xl"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center">
                                            <span className="text-4xl font-bold text-gray-900">{stats.totalPatients || 0}</span>
                                        </div>
                                        {monthGrowth > 0 && (
                                            <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                                +{monthGrowth}%
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-white text-lg font-bold">Pacientes Totales</h3>
                                        <p className="text-white/60 text-sm">este mes</p>
                                    </div>

                                    {upcomingPatient && (
                                        <div className="mt-6 pt-4 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60">Próximo Paciente</span>
                                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        {(upcomingPatient.nombrePaciente || upcomingPatient.patient?.name || 'P').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{upcomingPatient.nombrePaciente || upcomingPatient.patient?.name || 'Patient'}</p>
                                                    <p className="text-xs text-white/50">{new Date(upcomingPatient.fechaHora).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Patient Statistics Card - Mint Green */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-linear-to-br from-emerald-100 via-teal-50 to-cyan-50 rounded-4xl p-8 relative overflow-hidden shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Estadísticas de Pacientes</h3>
                                    <select className="px-3 py-1.5 bg-white/60 backdrop-blur-sm border-0 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option>Semanal</option>
                                        <option>Mensual</option>
                                        <option>Anual</option>
                                    </select>
                                </div>
                                <p className="text-sm text-gray-600 mb-6">Mes de Octubre</p>

                                {/* Graph Placeholder */}
                                <div className="relative h-48 flex items-end justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M 0,120 Q 30,80 75,90 T 150,60 T 225,80 T 300,50"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 0,120 Q 30,80 75,90 T 150,60 T 225,80 T 300,50 L 300,150 L 0,150 Z"
                                            fill="url(#lineGradient)"
                                        />
                                    </svg>

                                    {/* Floating Badge */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className="absolute top-8 right-16 px-4 py-2 bg-gray-900 text-white rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2"
                                    >
                                        {stats.completedThisWeek || 0}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Today's Sessions & Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Today's Sessions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                                                className="bg-white rounded-4xl p-6 shadow-sm"


                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sesiones De Hoy</h2>

                                <TodaysSessions
                                    sessions={todayAppointments}
                                    loading={loading}
                                    onViewDiary={setDiaryPatient}
                                />
                            </motion.div>

                            {/* Recent Activity */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-4xl p-6 shadow-sm"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Actividad Reciente</h2>
                                <ActivityFeed
                                    activities={dashboardActivities}
                                    loading={loading}
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Barra Lateral Derecha - Herramientas Clínicas */}
                    <div className="bg-white border-l border-gray-100 p-6 space-y-6 overflow-y-auto">
                        {/* Quick Notes Widget */}
                        <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Notas Rápidas
                                </h4>
                                <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                                    Ver Todo
                                </button>
                            </div>
                            <textarea
                                placeholder="Anota observaciones de la sesión..."
                                className="w-full h-32 p-3 bg-white rounded-xl border border-indigo-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="w-full mt-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                                Guardar Nota
                            </button>
                        </div>

                        {/* Crisis Resources */}
                        <div className="bg-linear-to-br from-rose-50 to-red-50 rounded-3xl p-6 border border-rose-200">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Recursos de Crisis
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900">Línea de Crisis</p>
                                        <p className="text-sm font-bold text-rose-600">988</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900">Apoyo por Texto</p>
                                        <p className="text-xs text-gray-600">Envía CASA al 741741</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Treatment Progress */}
                        <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Progreso Semanal
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="font-medium text-gray-700">Sesiones Completadas</span>
                                        <span className="font-bold text-emerald-600">{stats.completedThisWeek || 0}/12</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${((stats.completedThisWeek || 0) / 12) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="font-medium text-gray-700">Metas de Tratamiento</span>
                                        <span className="font-bold text-blue-600">8/10</span>
                                    </div>
                                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Self-Care Reminder */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">Toma un Descanso</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">Has tenido 3 sesiones hoy. Considera un breve descanso de atención plena antes de tu próxima cita.</p>
                                    <button className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
                                        Iniciar ejercicio de respiración 5-min →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showPatientForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPatientForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PatientForm onClose={() => setShowPatientForm(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-20deg); }
                }
                .animate-wave {
                    display: inline-block;
                    animation: wave 2s ease-in-out infinite;
                }
            `}</style>
        </>
    )
}

export default ModernProfessionalDashboard
