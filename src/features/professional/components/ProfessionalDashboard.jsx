import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardData, useDashboardView, useCurrentTime } from '../dashboard/useDashboard'
import DashboardHeader from './DashboardHeader'
import DashboardStats from './DashboardStats'
import QuickActions from './QuickActions'
import TodaysSessions from './TodaysSessions'
import ActivityFeed from './ActivityFeed'
import ProgressSummary from './ProgressSummary'
import ProfileSidebar from './ProfileSidebar'
import ComplianceWidget from './ComplianceWidget'
import ClinicalQuickActions from './ClinicalQuickActions'
import { getTodayAppointments } from '../dashboard/dashboardUtils'
import { useAuth } from '@features/auth'
import ChatPanel from '@components/layout/ChatPanel'

/**
 * ProfessionalDashboard Component
 * Main dashboard for professional/therapist users
 * Orchestrates all dashboard sub-components
 */
const ProfessionalDashboard = ({ setShowCalendar, setDiaryPatient }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
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

    const handleJoinVideo = useCallback((appointment) => {
        // Navigate directly to video call
        navigate(`/professional/video/${appointment.id}`)
    }, [navigate])

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

    // Get today's sessions from the real API data only
    let todaySessions = getTodayAppointments(appointments)
    console.log('[ProfessionalDashboard] real todaySessions from API:', todaySessions.length, todaySessions)

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

    return (
        <>
            <div className='flex flex-col lg:flex-row h-screen'>
                {/* Main Content Area - Apple Watch Grid Layout */}
                <div className="p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto flex-1">
                    {/* Apple Watch Style Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-auto">
                        
                        {/* Profile Tile */}
                        <div className="col-span-1 row-span-1 bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-lg md:text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">
                                {user?.nombre?.[0]}{user?.apellido?.[0]}
                            </div>
                            <p className="text-white/90 text-xs md:text-sm font-medium text-center">Profile</p>
                        </div>

                        {/* Crisis Alert or Time Tile */}
                        {highRiskPatients.length > 0 ? (
                            <div className="col-span-1 md:col-span-2 row-span-1 bg-linear-to-br from-rose-500 to-rose-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square md:aspect-auto">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-white/90 text-xs font-medium uppercase tracking-wide">Crisis Alert</span>
                                </div>
                                <p className="text-white text-sm md:text-base font-bold">{highRiskPatients.length} High-Risk Patient{highRiskPatients.length > 1 ? 's' : ''}</p>
                                <p className="text-white/80 text-xs mt-1">Immediate attention needed</p>
                            </div>
                        ) : (
                            <div className="col-span-1 md:col-span-2 row-span-1 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-center shadow-lg aspect-square md:aspect-auto">
                                <p className="text-white/90 text-xs md:text-sm font-medium mb-1">Good {currentTime.greeting}</p>
                                <p className="text-white text-base md:text-xl font-bold">{user?.nombre || 'Doctor'}</p>
                                <p className="text-white/80 text-xs mt-2">{currentTime.dateStr}</p>
                            </div>
                        )}

                        {/* Stat Tiles - 4 individual tiles */}
                        <div className="col-span-1 row-span-1 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square">
                            <div className="text-white/90 text-xs md:text-sm font-medium">Active Caseload</div>
                            <div className="text-white text-2xl md:text-4xl font-bold mt-auto">{stats?.activePatients || 0}</div>
                        </div>

                        <div className="col-span-1 row-span-1 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square">
                            <div className="text-white/90 text-xs md:text-sm font-medium">Today</div>
                            <div className="text-white text-2xl md:text-4xl font-bold mt-auto">{todaySessions.length}</div>
                        </div>

                        <div className="col-span-1 row-span-1 bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square">
                            <div className="text-white/90 text-xs md:text-sm font-medium">Pending</div>
                            <div className="text-white text-2xl md:text-4xl font-bold mt-auto">{stats?.pendingNotes || 0}</div>
                        </div>

                        <div className="col-span-1 row-span-1 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group aspect-square">
                            <div className="text-white/90 text-xs md:text-sm font-medium">Week</div>
                            <div className="text-white text-2xl md:text-4xl font-bold mt-auto">{stats?.weekUtilization || 0}%</div>
                        </div>

                        {/* Today's Sessions - Large tile spanning multiple columns */}
                        <div className="col-span-2 md:col-span-4 lg:col-span-4 row-span-2 md:row-span-3 bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
                            <TodaysSessions
                                sessions={todaySessions}
                                loading={loading}
                                onJoinVideo={handleJoinVideo}
                                onViewProfile={handleViewProfile}
                            />
                        </div>

                        {/* Activity Feed Tile */}
                        <div className="col-span-2 md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                            <h2 className="text-sm md:text-base font-medium text-gray-900 mb-4">Recent Activity</h2>
                            <div className="h-full max-h-75 md:max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                                <ActivityFeed
                                    activities={recentActivity}
                                    loading={loading}
                                />
                            </div>
                        </div>

                        {/* Compliance Widget Tile */}
                        <div className="col-span-2 md:col-span-2 lg:col-span-2 row-span-1">
                            <ComplianceWidget 
                                compliance={{
                                    licenseExpiration: new Date('2026-12-31'),
                                    licenseNumber: 'PSY-12345-CA',
                                    ceuCreditsRequired: 40,
                                    ceuCreditsEarned: 28,
                                    informedConsentExpirations: 3
                                }}
                            />
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


        </>
    )
}

export default ProfessionalDashboard
