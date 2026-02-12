import { useState } from 'react'
import { useDashboardData, useDashboardView, useCurrentTime } from '../dashboard/useDashboard'
import { getGreeting } from '../dashboard/dashboardUtils'
import TodaysSessions from './TodaysSessions'
import ActivityFeed from './ActivityFeed'
import { getTodayAppointments } from '../dashboard/dashboardUtils'
import { useAuth } from '@features/auth'
import ChatPanel from '@components/layout/ChatPanel'
import { 
    Users, CalendarDays, FileText, TrendingUp, 
    Video, Plus, ClipboardList, Phone,
    Shield, Award, AlertTriangle, ChevronRight
} from 'lucide-react'

/**
 * ProfessionalDashboard Component
 * Main dashboard for professional/therapist users
 * Orchestrates all dashboard sub-components
 */
const ProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const currentTime = useCurrentTime()
    const {
        stats,
        patients,
        appointments,
        loading,
        error,
        clearError,
        refreshData
    } = useDashboardData()

    const {
        showPatientForm,
        setShowPatientForm,
        selectedAppointment,
        setSelectedAppointment,
        showChat,
        setShowChat
    } = useDashboardView()

    // Handlers
    const handleNewPatient = () => {
        setShowPatientForm(true)
    }

    const handleViewCalendar = () => {
        setShowCalendar?.(true)
    }

    const handleViewPatients = () => {
        // Navigate to patients list (could be route navigation)
        console.log('Navigate to patients list')
    }

    const handleViewDiaries = () => {
        // Show diaries modal/page
        console.log('View diaries')
    }

    const handleVideoCall = () => {
        // Navigate to video call page
        console.log('Navigate to video calls')
    }

    const handleReports = () => {
        // Navigate to reports page
        console.log('Navigate to reports')
    }

    const handleJoinVideo = (appointment) => {
        setSelectedAppointment({
            id: appointment.id,
            patientId: appointment.patientId,
            patient: appointment.nombrePaciente || appointment.patient?.name
        })
    }

    const handleViewProfile = (appointment) => {
        const patient = patients.find(p =>
            (p._id || p.id) === appointment.patientId
        )
        if (patient && setDiaryPatient) {
            setDiaryPatient({
                id: appointment.patientId,
                name: `${patient.nombre} ${patient.apellido}`
            })
        }
    }

    const handlePatientClick = (patient) => {
        if (setDiaryPatient) {
            setDiaryPatient({
                id: patient._id || patient.id,
                name: patient.name || `${patient.nombre} ${patient.apellido}`
            })
        }
    }

    const handleOpenChat = () => {
        setShowChat(true)
    }

    const handleCloseChat = () => {
        setShowChat(false)
    }

    // Get today's sessions
    let todaySessions = getTodayAppointments(appointments)
    
    // Add mock data if no appointments exist or to supplement existing data
    const mockAppointments = [
        {
            id: 'mock-1',
            fechaHora: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Jemma Linda',
            patientId: 'patient-1',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            riskLevel: 'medium',
            lastSessionNote: 'Anxiety improving, sleep still disrupted',
            treatmentGoal: 'CBT for sleep hygiene',
            insuranceSessionsRemaining: 8,
            homeworkCompleted: true
        },
        {
            id: 'mock-2',
            fechaHora: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
            nombrePaciente: 'Andy John',
            patientId: 'patient-2',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            riskLevel: 'low',
            lastSessionNote: 'Good progress on cognitive restructuring',
            treatmentGoal: 'Practice thought records',
            insuranceSessionsRemaining: 15,
            homeworkCompleted: true
        },
        {
            id: 'mock-3',
            fechaHora: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
            nombrePaciente: 'Ariana Jamie',
            patientId: 'patient-3',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            riskLevel: 'high',
            lastSessionNote: 'Reported increased suicidal ideation',
            treatmentGoal: 'Safety planning & crisis resources',
            insuranceSessionsRemaining: 2,
            homeworkCompleted: false
        },
        {
            id: 'mock-4',
            fechaHora: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Sarah Martinez',
            patientId: 'patient-4',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            riskLevel: 'low',
            lastSessionNote: 'Making great strides in exposure therapy',
            treatmentGoal: 'In-vivo exposure exercises',
            insuranceSessionsRemaining: 12,
            homeworkCompleted: true
        },
        {
            id: 'mock-5',
            fechaHora: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Michael Chen',
            patientId: 'patient-5',
            estado: 'scheduled',
            ultimaVisita: null,
            riskLevel: 'low',
            lastSessionNote: 'Initial intake appointment',
            treatmentGoal: 'Complete assessment & establish rapport',
            insuranceSessionsRemaining: 20,
            homeworkCompleted: false
        },
        {
            id: 'mock-6',
            fechaHora: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
            nombrePaciente: 'Emma Rodriguez',
            patientId: 'patient-6',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
            riskLevel: 'medium',
            lastSessionNote: 'Family conflict escalating',
            treatmentGoal: 'DBT emotion regulation skills',
            insuranceSessionsRemaining: 6,
            homeworkCompleted: true
        },
        {
            id: 'mock-7',
            fechaHora: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
            nombrePaciente: 'David Kim',
            patientId: 'patient-7',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            riskLevel: 'low',
            lastSessionNote: 'Workplace stress improving',
            treatmentGoal: 'Assertiveness training',
            insuranceSessionsRemaining: 10,
            homeworkCompleted: true
        },
        {
            id: 'mock-8',
            fechaHora: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Lisa Thompson',
            patientId: 'patient-8',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            riskLevel: 'medium',
            lastSessionNote: 'Medication side effects discussed',
            treatmentGoal: 'Monitor mood changes',
            insuranceSessionsRemaining: 3,
            homeworkCompleted: false
        },
        {
            id: 'mock-9',
            fechaHora: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Robert Garcia',
            patientId: 'patient-9',
            estado: 'scheduled',
            ultimaVisita: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
            riskLevel: 'low',
            lastSessionNote: 'Relationship therapy progress excellent',
            treatmentGoal: 'Communication exercises',
            insuranceSessionsRemaining: 18,
            homeworkCompleted: true
        },
        {
            id: 'mock-10',
            fechaHora: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
            nombrePaciente: 'Maria Santos',
            patientId: 'patient-10',
            estado: 'scheduled',
            ultimaVisita: null,
            riskLevel: 'low',
            lastSessionNote: 'New patient screening',
            treatmentGoal: 'Diagnostic assessment',
            insuranceSessionsRemaining: 20,
            homeworkCompleted: false
        }
    ]
    
    // Combine real and mock appointments (use mock if empty)
    if (todaySessions.length === 0) {
        todaySessions = mockAppointments
    }

    // Extract high-risk patients for crisis alert
    const highRiskPatients = todaySessions
        .filter(session => session.riskLevel === 'high')
        .map(session => ({
            name: session.nombrePaciente || session.patient?.name,
            id: session.patientId
        }))

    // Mock activity feed - Clinical activities
    const recentActivity = [
        {
            id: 1,
            type: 'mood_log',
            title: 'Patient mood log',
            description: 'Jemma Linda - PHQ-9 score: 12 (Moderate)',
            patientName: 'Jemma Linda',
            timestamp: new Date(Date.now() - 1800000), // 30 min ago
            priority: 'medium'
        },
        {
            id: 2,
            type: 'homework_complete',
            title: 'Homework submitted',
            description: 'Andy John - CBT thought record completed',
            patientName: 'Andy John',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            priority: 'low'
        },
        {
            id: 3,
            type: 'crisis_alert',
            title: 'Safety concern',
            description: 'Ariana Jamie - Increased suicidal ideation reported',
            patientName: 'Ariana Jamie',
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            priority: 'high'
        },
        {
            id: 4,
            type: 'insurance_expiring',
            title: 'Authorization expiring',
            description: 'Lisa Thompson - 3 sessions remaining, renewal needed',
            patientName: 'Lisa Thompson',
            timestamp: new Date(Date.now() - 10800000), // 3 hours ago
            priority: 'medium'
        },
        {
            id: 5,
            type: 'appointment_cancelled',
            title: 'Appointment no-show',
            description: 'Mark Wilson - Missed session, no notice',
            patientName: 'Mark Wilson',
            timestamp: new Date(Date.now() - 14400000), // 4 hours ago
            priority: 'medium'
        },
        {
            id: 6,
            type: 'outcome_improvement',
            title: 'Progress milestone',
            description: 'Sarah Martinez - GAD-7 improved from 15 to 8',
            patientName: 'Sarah Martinez',
            timestamp: new Date(Date.now() - 18000000), // 5 hours ago
            priority: 'low'
        }
    ]

    // Mock progress data (can be replaced with real data)
    const progressData = {
        sessionsCompleted: { current: 12, previous: 10 },
        newPatients: { current: 3, previous: 2 },
        diaryEntries: { current: 18, previous: 15 },
        avgSessionDuration: { current: 52, previous: 48 }
    }

    // Get active patients (last 8)
    const activePatients = patients
        .filter(p => p.status === 'active' || !p.status)
        .slice(0, 8)
        .map(p => ({
            id: p._id || p.id,
            name: p.name || `${p.nombre} ${p.apellido}`,
            nombre: p.nombre,
            lastSession: p.ultimaSesion || p.lastSession,
            unreadMessages: p.mensajesNoLeidos || 0
        }))

    // Format date for header
    const greeting = getGreeting(currentTime)
    const dateStr = currentTime.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
    })

    // Get user initials
    const initials = user?.nombre && user?.apellido 
        ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() 
        : '?'

    return (
        <>
            <div className="h-screen flex flex-col overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                        {/* ── Header ───────────────────────────────── */}
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">
                                    {greeting}, {user?.nombre || 'Doctor'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">{dateStr}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleNewPatient}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Patient
                                </button>
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                                    {initials}
                                </div>
                            </div>
                        </div>

                        {/* ── Crisis Alert (conditional) ────────── */}
                        {highRiskPatients.length > 0 && (
                            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <p className="text-sm text-red-800 flex-1">
                                    <span className="font-semibold">{highRiskPatients.length} high-risk patient{highRiskPatients.length > 1 ? 's' : ''}</span>
                                    {' '}need{highRiskPatients.length === 1 ? 's' : ''} attention today
                                </p>
                                <button className="text-sm font-medium text-red-700 hover:text-red-900 whitespace-nowrap">
                                    Review
                                </button>
                            </div>
                        )}

                        {/* ── KPI Cards ─────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { 
                                    label: 'Active Patients', 
                                    value: stats?.activePatients || 0, 
                                    change: '+3 this month', 
                                    positive: true,
                                    icon: Users, 
                                    color: 'text-indigo-600 bg-indigo-50' 
                                },
                                { 
                                    label: "Today's Sessions", 
                                    value: todaySessions.length, 
                                    change: `${todaySessions.filter(s => new Date(s.fechaHora) < currentTime).length} completed`,
                                    positive: true,
                                    icon: CalendarDays, 
                                    color: 'text-emerald-600 bg-emerald-50' 
                                },
                                { 
                                    label: 'Pending Notes', 
                                    value: stats?.pendingNotes || 4, 
                                    change: '2 due today', 
                                    positive: false,
                                    icon: FileText, 
                                    color: 'text-amber-600 bg-amber-50' 
                                },
                                { 
                                    label: 'Week Utilization', 
                                    value: `${stats?.weekUtilization || 78}%`, 
                                    change: '↑ 5% from last week', 
                                    positive: true,
                                    icon: TrendingUp, 
                                    color: 'text-violet-600 bg-violet-50' 
                                },
                            ].map((kpi) => (
                                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-500">{kpi.label}</span>
                                        <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                                            <kpi.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                                    <p className={`mt-1 text-xs ${kpi.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {kpi.change}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Main Grid: Sessions + Sidebar ──── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column — Sessions (2/3 width) */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Today's Schedule */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <TodaysSessions
                                        sessions={todaySessions}
                                        loading={loading}
                                        onJoinVideo={handleJoinVideo}
                                        onViewProfile={handleViewProfile}
                                    />
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Start Session', icon: Video, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
                                            { label: 'Add Note', icon: Plus, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
                                            { label: 'Assessment', icon: ClipboardList, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
                                            { label: 'Crisis Line', icon: Phone, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
                                        ].map((action) => (
                                            <button
                                                key={action.label}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-lg ${action.color} transition-colors`}
                                            >
                                                <action.icon className="w-5 h-5" />
                                                <span className="text-xs font-medium">{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column — Sidebar (1/3 width) */}
                            <div className="space-y-6">

                                {/* Activity Feed */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                                        <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View all</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                        <ActivityFeed
                                            activities={recentActivity}
                                            loading={loading}
                                        />
                                    </div>
                                </div>

                                {/* Compliance */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-900">Compliance</h3>
                                        <Shield className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-4 h-4 text-emerald-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">License</p>
                                                    <p className="text-xs text-gray-500">PSY-12345-CA</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                                        </div>
                                        <div className="border-t border-gray-100"></div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">CEU Credits</p>
                                                    <p className="text-xs text-gray-500">28 of 40 completed</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-amber-600">70%</span>
                                        </div>
                                        <div className="border-t border-gray-100"></div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-red-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Consent Forms</p>
                                                    <p className="text-xs text-gray-500">3 expiring soon</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* Chat Panel */}
            {showChat && (
                <ChatPanel
                    onClose={handleCloseChat}
                />
            )}

            {/* Patient Form Modal - TODO: Implement modal wrapper */}
            {showPatientForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
                            <button
                                onClick={() => setShowPatientForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {/* PatientForm would go here */}
                            <p className="text-gray-500">Patient form component placeholder</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Call Modal - TODO: Implement video call launcher */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Iniciar Videollamada</h2>
                        <p className="text-gray-600 mb-6">
                            ¿Desea iniciar la videollamada con {selectedAppointment.patient}?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Navigate to video call
                                    console.log('Start video call:', selectedAppointment)
                                    setSelectedAppointment(null)
                                }}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Iniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ProfessionalDashboard
