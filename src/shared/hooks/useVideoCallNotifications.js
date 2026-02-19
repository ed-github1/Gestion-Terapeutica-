/**
 * shared/hooks/useVideoCallNotifications.js
 * Polls for incoming video call invitations and exposes accept/decline actions.
 */
import { useState, useEffect } from 'react'
import { videoCallService } from '@shared/services/videoCallService'
import { showToast } from '@shared/ui/Toast'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

let _notificationCallback = null

export const useVideoCallNotifications = () => {
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    if (DEMO_MODE) {
      const interval = setInterval(() => {
        if (Math.random() > 0.95) simulateIncomingCall()
      }, 10_000)
      return () => clearInterval(interval)
    }

    const poll = async () => {
      try {
        const { data } = await videoCallService.getActiveInvitations()
        if (data?.invitations?.length > 0) {
          setInvitations(data.invitations)
          if (_notificationCallback) _notificationCallback(data.invitations[0])
        } else {
          // Clear stale invitations when server returns none (expired or processed)
          setInvitations((prev) => (prev.length > 0 ? [] : prev))
        }
      } catch {
        // silently ignore polling errors
      }
    }

    poll()
    const interval = setInterval(poll, 5_000)
    return () => clearInterval(interval)
  }, [])

  const simulateIncomingCall = () => {
    const demo = {
      appointmentId: `demo-${Date.now()}`,
      professionalName: 'Dr. María González',
      professionalId: 'demo-prof-1',
      patientName: 'Juan Pérez',
      appointmentType: 'consultation',
      appointmentTime: new Date().toLocaleString('es-ES'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 45_000),
    }
    setInvitations([demo])
    if (_notificationCallback) _notificationCallback(demo)
    showToast('📞 Llamada entrante (Demo)', 'info')
  }

  const acceptInvitation = async (appointmentId) => {
    if (DEMO_MODE) {
      setInvitations([])
      showToast('✅ Llamada aceptada (Demo)', 'success')
      return true
    }
    try {
      await videoCallService.acceptInvitation(appointmentId)
      setInvitations((prev) => prev.filter((i) => i.appointmentId !== appointmentId))
      showToast('✅ Llamada aceptada', 'success')
      return true
    } catch {
      showToast('❌ Error al aceptar la llamada', 'error')
      return false
    }
  }

  const declineInvitation = async (appointmentId) => {
    if (DEMO_MODE) {
      setInvitations([])
      showToast('📵 Llamada rechazada (Demo)', 'info')
      return true
    }
    try {
      await videoCallService.rejectInvitation(appointmentId)
      setInvitations((prev) => prev.filter((i) => i.appointmentId !== appointmentId))
      showToast('📵 Llamada rechazada', 'info')
      return true
    } catch {
      showToast('❌ Error al rechazar la llamada', 'error')
      return false
    }
  }

  const registerNotificationCallback = (cb) => {
    _notificationCallback = cb
  }

  return {
    invitations,
    acceptInvitation,
    declineInvitation,
    registerNotificationCallback,
    simulateIncomingCall: DEMO_MODE ? simulateIncomingCall : null,
  }
}

export default useVideoCallNotifications
