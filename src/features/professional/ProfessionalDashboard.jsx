import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import ModernProfessionalDashboard from './components/ModernProfessionalDashboard'
import AppointmentsCalendar from './components/AppointmentsCalendar'
import PatientClinicalFile from './components/PatientClinicalFile'

/**
 * Wrapper component to switch between dashboard, calendar, and diary views
 * Maintains navigation state and routing between different views
 */
const ProfessionalDashboardWrapper = () => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [diaryPatient, setDiaryPatient] = useState(null)

    // Map session/appointment object → patient shape for PatientClinicalFile
    const handleViewDiary = (session) => {
        const id = session?.patientId || session?.patient?._id || session?.patient?.id || session?.id
        const fullName = session?.nombrePaciente || session?.patient?.name || session?.patientName || session?.name || 'Paciente'
        const parts = fullName.trim().split(' ')
        const nombre   = parts[0] || 'Paciente'
        const apellido = parts.slice(1).join(' ') || ''
        if (id) setDiaryPatient({ id, nombre, apellido, name: fullName })
    }

    // Dashboard + slide-over drawer for the full calendar
    return (
        <>
            <ModernProfessionalDashboard
                setShowCalendar={setShowCalendar}
                setDiaryPatient={handleViewDiary}
            />

            {/* ── Full-calendar slide-over drawer ── */}
            <AnimatePresence>
                {showCalendar && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="cal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setShowCalendar(false)}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            key="cal-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-5xl  z-50 overflow-y-auto shadow-2xl flex flex-col"
                        >
                            {/* Drawer header */}
                            <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 shrink-0">
                                <button
                                    onClick={() => setShowCalendar(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                    aria-label="Cerrar agenda"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <h2 className="text-sm font-bold text-gray-900">Agenda completa</h2>
                            </div>

                            {/* Calendar content */}
                            <div className="flex-1 p-4 md:p-6">
                                <AppointmentsCalendar />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Patient diary overlay ── */}
            <AnimatePresence>
                {diaryPatient && (
                    <PatientClinicalFile
                        patient={diaryPatient}
                        onClose={() => setDiaryPatient(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default ProfessionalDashboardWrapper