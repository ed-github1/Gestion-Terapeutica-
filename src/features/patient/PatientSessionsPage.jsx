import PatientSessionsList from './components/PatientSessionsList'
import { useState } from 'react'
import AppointmentRequest from './AppointmentRequest'
import { useAuth } from '@features/auth/AuthContext'
import { AnimatePresence } from 'motion/react'
import { resolveLinkedProfessional } from '@shared/services/patientsService'
import { VideoCallNotificationManager } from '@shared/ui'

/**
 * Full-page wrapper for PatientSessionsList — used as a route target
 * from the sidebar "Mis Sesiones" link.
 */
const PatientSessionsPage = () => {
  const { user } = useAuth()
  const [showRequest, setShowRequest] = useState(false)
  const [refreshKey, setRefreshKey]   = useState(0)
  const [professionalId, setProfessionalId] = useState(
    user?.professionalId || user?.professional_id || user?.professional?._id || null
  )

  const fullName = user?.name || user?.nombre || 'Paciente'

  // Resolve professionalId lazily when opening the request form
  const openRequest = async () => {
    if (!professionalId) {
      const { professionalId: pid } = await resolveLinkedProfessional(user)
      if (pid) setProfessionalId(pid)
    }
    setShowRequest(true)
  }

  return (
    <div className="p-4 md:p-7 lg:p-9">
      <PatientSessionsList
        onRequestNew={openRequest}
        refreshTrigger={refreshKey}
        patientName={fullName}
      />

      <AnimatePresence>
        {showRequest && (
          <AppointmentRequest
            onClose={() => setShowRequest(false)}
            professionalId={professionalId}
            onSuccess={() => {
              setShowRequest(false)
              setRefreshKey(k => k + 1)
            }}
          />
        )}
      </AnimatePresence>

      <VideoCallNotificationManager />
    </div>
  )
}

export default PatientSessionsPage
