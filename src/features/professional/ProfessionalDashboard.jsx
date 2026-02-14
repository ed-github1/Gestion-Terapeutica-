
import { useState } from 'react'
import { motion } from 'motion/react'
import ModernProfessionalDashboard from './components/ModernProfessionalDashboard'
import AppointmentsCalendar from './components/AppointmentsCalendar'
import PatientDiary from './components/PatientDiary'

/**
 * Wrapper component to switch between dashboard, calendar, and diary views
 * Maintains navigation state and routing between different views
 */
const ProfessionalDashboardWrapper = () => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [diaryPatient, setDiaryPatient] = useState(null)

    // Show patient diary if selected
    if (diaryPatient) {
        return (
            <PatientDiary
                patientId={diaryPatient.id}
                patientName={diaryPatient.name}
                onClose={() => setDiaryPatient(null)}
            />
        )
    }

    // Show calendar if selected
    if (showCalendar) {
        return (
            <div className="relative">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCalendar(false)}
                    className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl hover:shadow-xl transition-all border border-gray-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-semibold text-gray-700">Volver</span>
                </motion.button>
                <AppointmentsCalendar />
            </div>
        )
    }

    // Show main dashboard
    return (
        <ModernProfessionalDashboard 
            setShowCalendar={setShowCalendar} 
            setDiaryPatient={setDiaryPatient} 
        />
    )
}

export default ProfessionalDashboardWrapper


