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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-90 overflow-hidden"
      >
        {/* Compact header */}
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0075C9]/10 dark:bg-[#0075C9]/20 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-[#0075C9]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">Videollamada entrante</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Tu profesional te está llamando</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5">
          {/* Professional info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                {invitation.professionalName || 'Tu profesional'}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">{appointmentLabel}</p>
            </div>
          </div>

          {/* Time info row */}
          {invitation.appointmentTime && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[12px] text-gray-600 dark:text-gray-300">
                Programada: <span className="font-medium">{invitation.appointmentTime}</span>
              </span>
            </div>
          )}

          {/* Countdown with progress ring */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-100 dark:text-gray-700" />
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                  className={timeLeft <= 10 ? 'text-red-500' : 'text-[#0075C9]'}
                  strokeDasharray={`${progress * 62.83} 62.83`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
            </div>
            <span className={`text-[13px] font-semibold tabular-nums ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <motion.button
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
              onClick={onDecline}
              className="flex-1 h-11 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Rechazar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
              onClick={handleAccept}
              className="flex-2 h-11 bg-[#0075C9] text-white rounded-xl text-[13px] font-semibold hover:bg-[#005fa0] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Unirse a la sesión
            </motion.button>
          </div>
        </div>
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
