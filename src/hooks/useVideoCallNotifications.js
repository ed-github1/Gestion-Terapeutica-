import { useState, useEffect } from 'react'
import { showToast } from '../components'

// Demo mode for testing video call notifications without backend
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

let notificationCallback = null

export const useVideoCallNotifications = () => {
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode: simulate random incoming calls
      const interval = setInterval(() => {
        if (Math.random() > 0.95) { // 5% chance every check
          simulateIncomingCall()
        }
      }, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    } else {
      // Production mode: poll backend
      const checkInvitations = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/active-invitations`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            if (data.invitations && data.invitations.length > 0) {
              setInvitations(data.invitations)
              if (notificationCallback) {
                notificationCallback(data.invitations[0])
              }
            } else {
              // Clear stale invitations when server returns none
              setInvitations((prev) => (prev.length > 0 ? [] : prev))
            }
          }
        } catch (error) {
          console.error('Error checking invitations:', error)
        }
      }

      checkInvitations()
      const interval = setInterval(checkInvitations, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  const simulateIncomingCall = () => {
    const demoInvitation = {
      appointmentId: `demo-${Date.now()}`,
      professionalName: 'Dr. María González',
      professionalId: 'demo-prof-1',
      patientName: 'Juan Pérez',
      appointmentType: 'consultation',
      appointmentTime: new Date().toLocaleString('es-ES'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 45000)
    }

    setInvitations([demoInvitation])
    if (notificationCallback) {
      notificationCallback(demoInvitation)
    }
    showToast('📞 Llamada entrante (Demo)', 'info')
  }

  const acceptInvitation = async (appointmentId) => {
    if (DEMO_MODE) {
      setInvitations([])
      showToast('✅ Llamada aceptada (Demo)', 'success')
      return true
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/accept-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ appointmentId })
        }
      )

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv.appointmentId !== appointmentId))
        showToast('✅ Llamada aceptada', 'success')
        return true
      }
      return false
    } catch (error) {
      console.error('Error accepting invitation:', error)
      showToast('❌ Error al aceptar la llamada', 'error')
      return false
    }
  }

  const declineInvitation = async (appointmentId, reason = '') => {
    if (DEMO_MODE) {
      setInvitations([])
      showToast('📵 Llamada rechazada (Demo)', 'info')
      return true
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/decline-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ appointmentId, reason })
        }
      )

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv.appointmentId !== appointmentId))
        showToast('📵 Llamada rechazada', 'info')
        return true
      }
      return false
    } catch (error) {
      console.error('Error declining invitation:', error)
      showToast('❌ Error al rechazar la llamada', 'error')
      return false
    }
  }

  const registerNotificationCallback = (callback) => {
    notificationCallback = callback
  }

  return {
    invitations,
    acceptInvitation,
    declineInvitation,
    registerNotificationCallback,
    simulateIncomingCall: DEMO_MODE ? simulateIncomingCall : null
  }
}

export default useVideoCallNotifications
