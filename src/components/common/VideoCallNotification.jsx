import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const VideoCallNotification = ({ invitation, onAccept, onDecline, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(45) // 45 seconds to respond
  const navigate = useNavigate()

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onClose])

  const handleAccept = () => {
    onAccept(invitation)
    // Navigate to video call page
    navigate(`/video/join/${invitation.appointmentId}?name=${encodeURIComponent(invitation.patientName)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="fixed bottom-6 right-6 z-[9999] max-w-md w-full"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-500 overflow-hidden">
        {/* Header with pulse animation */}
        <div className="bg-linear-to-r from-purple-500 to-pink-500 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Videollamada Entrante</h3>
                <p className="text-white/90 text-sm">Tu profesional te está llamando</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                {invitation.professionalName || 'Tu profesional de salud'}
              </p>
              <p className="text-sm text-gray-600">
                {invitation.appointmentType === 'consultation' ? 'Consulta' : 
                 invitation.appointmentType === 'followup' ? 'Seguimiento' : 
                 'Sesión terapéutica'}
              </p>
            </div>
          </div>

          {/* Time information */}
          {invitation.appointmentTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Programada para: {invitation.appointmentTime}</span>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Expira en {timeLeft} segundos
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDecline}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rechazar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              className="flex-1 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Unirse
            </motion.button>
          </div>

          {/* Additional info */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Asegúrate de tener tu cámara y micrófono listos
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Main component to manage video call notifications
export const VideoCallNotificationManager = () => {
  const [invitations, setInvitations] = useState([])
  const [currentInvitation, setCurrentInvitation] = useState(null)

  useEffect(() => {
    // Poll for active invitations every 5 seconds
    const checkInvitations = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/active-invitations`
        console.log('🔍 Checking for video call invitations...', apiUrl)
        
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        console.log('🔑 Auth token exists:', !!token)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('📡 Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('📥 Received data:', data)
          
          if (data.invitations && data.invitations.length > 0) {
            console.log('🔔 Found invitations:', data.invitations.length)
            setInvitations(data.invitations)
            if (!currentInvitation) {
              console.log('✨ Setting current invitation:', data.invitations[0])
              setCurrentInvitation(data.invitations[0])
            }
          } else {
            console.log('📭 No active invitations')
          }
        } else {
          console.warn('⚠️ Response not OK:', await response.text())
        }
      } catch (error) {
        console.error('❌ Error checking invitations:', error)
      }
    }

    checkInvitations()
    const interval = setInterval(checkInvitations, 5000)

    return () => clearInterval(interval)
  }, [currentInvitation])

  const handleAccept = async (invitation) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/accept-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            appointmentId: invitation.appointmentId
          })
        }
      )
      setCurrentInvitation(null)
      setInvitations([])
    } catch (error) {
      console.error('Error accepting invitation:', error)
    }
  }

  const handleDecline = async () => {
    try {
      if (currentInvitation) {
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/decline-invitation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              appointmentId: currentInvitation.appointmentId
            })
          }
        )
      }
      setCurrentInvitation(null)
      setInvitations([])
    } catch (error) {
      console.error('Error declining invitation:', error)
    }
  }

  const handleClose = () => {
    setCurrentInvitation(null)
    // Move to next invitation if any
    if (invitations.length > 1) {
      setCurrentInvitation(invitations[1])
    }
  }

  return (
    <AnimatePresence>
      {currentInvitation && (
        <VideoCallNotification
          invitation={currentInvitation}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  )
}

export default VideoCallNotification
