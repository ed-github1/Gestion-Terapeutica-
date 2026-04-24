  /**
 * shared/ui/VideoCallNotification.jsx
 * Incoming video call banner + manager that polls for invitations.
 * Uses videoCallService for all HTTP calls, with socket fallback for
 * real-time delivery when the REST /video/send-invitation endpoint is unavailable.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Video, X, Phone, PhoneOff, Clock, User } from 'lucide-react'
import { useAuth } from '@features/auth'
import { videoCallService } from '@shared/services/videoCallService'
import { appointmentsService } from '@shared/services/appointmentsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'

// ── Single invitation card ────────────────────────────────────────────────────
const VideoCallNotification = ({ invitation, onAccept, onDecline, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(45)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (timeLeft <= 0) { onClose(); return }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft, onClose])

  const handleAccept = async () => {
    await onAccept(invitation)
    const name = user?.name || user?.username || invitation.patientName || 'Paciente'
    navigate(`/video/join/${invitation.appointmentId}?name=${encodeURIComponent(name)}`)
  }

  const appointmentLabel = {
    consultation: 'Consulta',
    followup: 'Seguimiento',
  }[invitation.appointmentType] ?? 'Sesión terapéutica'

  const progress = timeLeft / 45
  const urgent = timeLeft <= 10

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="w-full sm:max-w-sm bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
      >
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Close */}
        <div className="flex justify-end px-4 pt-3 sm:pt-4">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar + name — centered */}
        <div className="flex flex-col items-center px-6 pt-2 pb-6">
          {/* Pulsing avatar */}
          <div className="relative mb-4">
            <span className="absolute inset-0 rounded-full bg-[#0075C9]/20 animate-ping" />
            <span className="absolute -inset-1.5 rounded-full bg-[#0075C9]/10 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
              <User className="w-9 h-9 text-gray-400 dark:text-gray-500" />
            </div>
            {/* Video badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0075C9] flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900">
              <Video className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Videollamada entrante</p>
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight text-center">
            {invitation.professionalName || 'Tu profesional'}
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{appointmentLabel}</p>

          {/* Countdown */}
          <div className="flex items-center gap-2 mt-4 mb-6">
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-100 dark:text-gray-800" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={urgent ? 'text-red-500' : 'text-[#0075C9]'}
                  strokeDasharray={`${progress * 69.12} 69.12`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
            </div>
            <span className={`text-[14px] font-bold tabular-nums ${urgent ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Accept */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAccept}
            className="w-full h-13 bg-[#0075C9] hover:bg-[#005fa0] active:bg-[#004d87] text-white rounded-2xl text-[15px] font-bold transition-colors shadow-md flex items-center justify-center gap-2.5 mb-3"
          >
            <Phone className="w-5 h-5" />
            Unirse a la sesión
          </motion.button>

          {/* Decline */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onDecline}
            className="w-full h-11 text-gray-500 dark:text-gray-400 rounded-2xl text-[14px] font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Rechazar
          </motion.button>
        </div>

        <div className="sm:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </motion.div>
    </motion.div>
  )
}

// ── Manager component ─────────────────────────────────────────────────────────
export const VideoCallNotificationManager = () => {
  const [invitations, setInvitations] = useState([])
  const [current, setCurrent] = useState(null)
  const { user } = useAuth()
  const currentRef = useRef(current)
  const checkedRoomsRef = useRef(new Set()) // track dismissed/accepted rooms
  currentRef.current = current

  const showInvitation = (invitation) => {
    if (!invitation?.appointmentId) return
    if (checkedRoomsRef.current.has(invitation.appointmentId)) return
    setInvitations((prev) => {
      if (prev.some((i) => i.appointmentId === invitation.appointmentId)) return prev
      return [...prev, invitation]
    })
    if (!currentRef.current) setCurrent(invitation)
  }

  // ── Channel 1: Socket listener for real-time call-invitation events ──
  useEffect(() => {
    const userId = user?._id || user?.id
    if (!userId) return

    console.log('[VideoCallNotificationManager] mounted for user:', userId)
    socketNotificationService.connect(userId)

    const unsub = socketNotificationService.on('call-invitation', (data) => {
      console.log('[VideoCallNotificationManager] socket call-invitation received:', data)
      showInvitation(data)
    })

    return () => unsub()
  }, [user?._id, user?.id])

  // ── Channel 2: REST polling /video/active-invitations ──
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await videoCallService.getActiveInvitations()
        console.log('[VideoCallNotificationManager] poll /video/active-invitations:', data)
        if (data?.invitations?.length > 0) {
          data.invitations.forEach(showInvitation)
        }
      } catch {
        // endpoint may not exist — silently skip
      }
    }
    poll()
    const interval = setInterval(poll, 6_000)
    return () => clearInterval(interval)
  }, [])

  // ── Channel 3: Poll patient's video appointments for active rooms ──
  // This is the most reliable fallback — uses known-working endpoints:
  //   GET /appointments  →  GET /rtc/rooms/:appointmentId
  useEffect(() => {
    const userId = user?._id || user?.id
    if (!userId) return

    const checkRooms = async () => {
      try {
        const res = await appointmentsService.getPatientAppointments()
        const raw = res.data?.data || res.data?.appointments || res.data || []
        const appointments = Array.isArray(raw) ? raw : []
        
        console.log('[VideoCallNotificationManager] channel 3: total appointments:', appointments.length)

        // Check all non-completed/cancelled appointments (broad filter)
        const candidateApts = appointments.filter((a) => {
          const st = a.status || a.estado || ''
          return st !== 'completed' && st !== 'cancelled'
        })
        
        console.log('[VideoCallNotificationManager] channel 3: candidate (non-completed) appointments:', candidateApts.length,
          candidateApts.map(a => ({ id: a._id || a.id, mode: a.mode, isVideoCall: a.isVideoCall, status: a.status || a.estado, date: a.date })))

        for (const apt of candidateApts.slice(0, 8)) {
          const aptId = apt._id || apt.id
          if (!aptId) continue
          if (checkedRoomsRef.current.has(aptId)) continue
          if (currentRef.current?.appointmentId === aptId) continue
          try {
            const roomRes = await videoCallService.getRoomStatus(aptId)
            const room = roomRes.data?.room || roomRes.data
            console.log('[VideoCallNotificationManager] room status for', aptId, ':', room)
            if (room && (room.isActive || room.status === 'active' || room.participants?.length > 0)) {
              console.log('[VideoCallNotificationManager] ✅ active room found for appointment:', aptId)
              showInvitation({
                appointmentId: aptId,
                professionalName: apt.professionalName || apt.professional?.name || 'Tu profesional',
                patientName: apt.patientName || user?.name || '',
                appointmentType: apt.type || 'consultation',
                appointmentTime: apt.date ? new Date(apt.date).toLocaleString('es-ES') : '',
              })
              break
            }
          } catch {
            // room doesn't exist yet — normal
          }
        }
      } catch (err) {
        console.warn('[VideoCallNotificationManager] room check error:', err.message || err)
      }
    }

    checkRooms()
    const interval = setInterval(checkRooms, 8_000)
    return () => clearInterval(interval)
  }, [user?._id, user?.id])

  const handleAccept = async (invitation) => {
    checkedRoomsRef.current.add(invitation.appointmentId)
    try { await videoCallService.acceptInvitation(invitation.appointmentId) } catch { /* noop */ }
    setCurrent(null)
    setInvitations([])
  }

  const handleDecline = async () => {
    if (current) {
      checkedRoomsRef.current.add(current.appointmentId)
      try { await videoCallService.rejectInvitation(current.appointmentId) } catch { /* noop */ }
    }
    setCurrent(null)
    setInvitations([])
  }

  const handleClose = () => {
    if (current) checkedRoomsRef.current.add(current.appointmentId)
    setCurrent(invitations.length > 1 ? invitations[1] : null)
  }

  return (
    <AnimatePresence>
      {current && (
        <VideoCallNotification
          invitation={current}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  )
}

export default VideoCallNotification
