import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import WebRTCManager from '@shared/webrtc/WebRTCManager'
import { useAuth } from '@features/auth'
import { useCallRecording } from '@shared/hooks/useCallRecording'

const VideoCallContext = createContext(null)

export const useVideoCall = () => {
  const ctx = useContext(VideoCallContext)
  if (!ctx) throw new Error('useVideoCall must be used within VideoCallProvider')
  return ctx
}

export const VideoCallProvider = ({ children }) => {
  const { user } = useAuth()

  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isInRoom, setIsInRoom] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState(new Map())
  const [remoteStreamsVersion, setRemoteStreamsVersion] = useState(0)
  const [participants, setParticipants] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [error, setError] = useState(null)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectFailed, setReconnectFailed] = useState(false)
  const [roomEnded, setRoomEnded] = useState(false)
  const [userLeft, setUserLeft] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingAuthorized, setRecordingAuthorized] = useState(false)

  // Context-specific: track active call for the mini-player
  const [activeAppointmentId, setActiveAppointmentId] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeUserRole, setActiveUserRole] = useState(null)
  const [callStartTime, setCallStartTime] = useState(null)

  // Recording lifted to context so it survives navigation (mini-player keeps recording)
  const [recordingEnabled, setRecordingEnabled] = useState(false)
  const handleRecordingFailed = useCallback((err) => {
    console.error('[VideoCallContext Recording]', err)
  }, [])
  const {
    isRecording: localRecording,
    isUploading,
    uploadError,
    recordingError,
    stopRecording: stopCallRecording,
  } = useCallRecording({
    localStream,
    appointmentId: activeAppointmentId,
    enabled: recordingEnabled,
    onRecordingFailed: handleRecordingFailed,
  })

  const managerRef = useRef(null)
  const currentRoomIdRef = useRef(null)
  const initializingRef = useRef(false)
  const joiningRef = useRef(false)
  const mountedRef = useRef(false)

  const resetCallState = useCallback(() => {
    setIsInRoom(false)
    setLocalStream(null)
    setRemoteStreams(new Map())
    setRemoteStreamsVersion(0)
    setParticipants([])
    setChatMessages([])
    setRecordingAuthorized(false)
    setRecordingEnabled(false)
    setActiveAppointmentId(null)
    setIsMinimized(false)
    setCallStartTime(null)
    currentRoomIdRef.current = null
    joiningRef.current = false
  }, [])

  const initialize = useCallback(async () => {
    if (managerRef.current && !isInitialized) { setIsInitialized(true); return }
    if (isInitialized || initializingRef.current || !user) return
    initializingRef.current = true
    try {
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? 'https://totalmentegestionterapeutica.onrender.com/api'
        : 'http://localhost:3000/api')
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isProduction
        ? 'https://totalmentegestionterapeutica.onrender.com'
        : 'http://localhost:3000')

      const manager = new WebRTCManager({
        apiUrl: API_URL,
        socketUrl: SOCKET_URL,
        userId: user.id || user._id,
        userName: user.name || user.nombre || 'Usuario',
        userRole: user.role || user.rol || 'patient',
      })

      manager.onRemoteStreamAdded = ({ userId, stream }) => {
        setRemoteStreams(prev => {
          if (prev.get(userId) === stream) return prev
          const next = new Map(prev)
          next.set(userId, stream)
          return next
        })
        setRemoteStreamsVersion(v => v + 1)
      }

      manager.onRemoteStreamRemoved = ({ userId }) => {
        setRemoteStreams(prev => {
          if (!prev.has(userId)) return prev
          const next = new Map(prev)
          next.delete(userId)
          return next
        })
        setRemoteStreamsVersion(v => v + 1)
      }

      manager.onUserJoined = ({ userId, userName, role }) => {
        setParticipants(prev => [...prev, { userId, userName, role }])
        setUserLeft(null)
      }

      manager.onUserLeft = ({ userId, userName }) => {
        setParticipants(prev => prev.filter(p => p.userId !== userId))
        setUserLeft({ userId, userName })
      }

      manager.onChatMessage = ({ userId, userName, message, timestamp }) => {
        const currentUserId = user.id || user._id
        setChatMessages(prev => [...prev, { userId, userName, message, timestamp, isOwn: userId === currentUserId }])
      }

      manager.onMediaStateChanged = ({ userId, audio, video }) =>
        setParticipants(prev => prev.map(p =>
          p.userId === userId ? { ...p, audioEnabled: audio, videoEnabled: video } : p
        ))

      manager.onRoomEnded = () => {
        setRoomEnded(true)
        resetCallState()
      }

      manager.onError = (err) => {
        const msg = err.message || ''
        const isRecordingError = /recording|grabaci/i.test(msg)
        setError({ type: isRecordingError ? 'warning' : 'error', message: msg || 'Error en la videollamada' })
      }

      manager.onConnectionStateChange = ({ state }) => {
        setConnectionState(state)
        if (state === 'reconnecting') setIsReconnecting(true)
        else if (state === 'connected') setIsReconnecting(false)
      }

      manager.onReconnecting = ({ reconnecting }) => setIsReconnecting(reconnecting)

      manager.onReconnectFailed = () => {
        setIsReconnecting(false)
        setReconnectFailed(true)
        resetCallState()
      }

      manager.onRecordingStateChanged = ({ isRecording: recording }) => setIsRecording(recording)
      manager.onRecordingAuthorized = () => setRecordingAuthorized(true)

      await manager.initialize()
      managerRef.current = manager
      setIsInitialized(true)
    } catch (err) {
      console.error('[VideoCallContext] init error:', err)
      initializingRef.current = false
      setError({ type: 'error', message: err.message || 'Error al inicializar videollamada' })
    }
  }, [user, isInitialized, resetCallState])

  const joinRoom = useCallback(async (appointmentId, { recordingConsent = false, userRole } = {}) => {
    if (!managerRef.current) throw new Error('WebRTC Manager not initialized')
    // joiningRef guards against double-invocation (React StrictMode re-mounts effects
    // before state updates land, so isConnecting/isInRoom aren't reliable guards here).
    if (joiningRef.current || currentRoomIdRef.current) return
    joiningRef.current = true
    setIsConnecting(true)
    setError(null)
    setActiveAppointmentId(appointmentId)
    if (userRole) setActiveUserRole(userRole)
    try {
      const room = await managerRef.current.joinRoom(appointmentId, { recordingConsent })
      setLocalStream(managerRef.current.localStream)
      if (!managerRef.current.localStream) {
        setError({ type: 'warning', message: 'No se pudo acceder a la cámara/micrófono. Permite el acceso en tu navegador.' })
      }
      currentRoomIdRef.current = room.roomId
      setIsInRoom(true)
      setIsConnecting(false)
      setIsMinimized(false)
      setCallStartTime(Date.now())
      joiningRef.current = false
      return room
    } catch (err) {
      joiningRef.current = false
      setIsConnecting(false)
      setActiveAppointmentId(null)
      setError({ type: 'error', message: err.message })
      throw err
    }
  }, [])

  const leaveRoom = useCallback(() => {
    if (!managerRef.current) return
    managerRef.current.leaveRoom()
    resetCallState()
  }, [resetCallState])

  const endRoom = useCallback(async (appointmentId, { sessionNotes } = {}) => {
    if (!managerRef.current) return
    try {
      await managerRef.current.endRoom(appointmentId, { sessionNotes })
      leaveRoom()
    } catch (err) {
      setError({ type: 'error', message: err.message })
      throw err
    }
  }, [leaveRoom])

  const toggleAudio = useCallback(() => {
    if (!managerRef.current) return
    const enabled = managerRef.current.toggleAudio()
    setIsAudioEnabled(enabled)
    return enabled
  }, [])

  const toggleVideo = useCallback(() => {
    if (!managerRef.current) return
    const enabled = managerRef.current.toggleVideo()
    setIsVideoEnabled(enabled)
    return enabled
  }, [])

  const sendMessage = useCallback((message) => {
    if (!managerRef.current) return
    managerRef.current.sendChatMessage(message)
  }, [])

  const startRecording = useCallback(async (appointmentId) => {
    if (!managerRef.current) return
    try {
      await managerRef.current.startRecording(appointmentId)
    } catch (err) {
      setError({ type: 'warning', message: err.message || 'Error al iniciar grabación' })
    }
  }, [])

  const stopRecording = useCallback(async (appointmentId) => {
    if (!managerRef.current) return
    try {
      await managerRef.current.stopRecording(appointmentId)
    } catch (err) {
      setError({ type: 'warning', message: err.message || 'Error al detener grabación' })
    }
  }, [])

  const getRoomStatus = useCallback(async (appointmentId) => {
    if (!managerRef.current) return null
    try {
      return await managerRef.current.getRoomStatus(appointmentId)
    } catch (err) {
      setError({ type: 'error', message: err.message })
      throw err
    }
  }, [])

  // Provider unmounts only when the whole app exits — intentional disconnect
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const mgr = managerRef.current
      setTimeout(() => {
        if (!mountedRef.current && mgr) {
          mgr.disconnect()
          managerRef.current = null
          initializingRef.current = false
        }
      }, 100)
    }
  }, [])

  useEffect(() => {
    if (user && !isInitialized) initialize()
  }, [user, isInitialized, initialize])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const remoteStreamsArray = useMemo(
    () => Array.from(remoteStreams.entries()).map(([userId, stream]) => ({ userId, stream })),
    [remoteStreamsVersion],
  )

  const value = {
    isInitialized,
    isConnecting,
    isInRoom,
    roomEnded,
    userLeft,
    localStream,
    remoteStreams: remoteStreamsArray,
    participants,
    chatMessages,
    error,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    isReconnecting,
    reconnectFailed,
    isRecording,
    recordingAuthorized,
    // Mini-player state
    activeAppointmentId,
    isMinimized,
    activeUserRole,
    callStartTime,
    setIsMinimized,
    // Recording (lives in context so it survives navigation)
    recordingEnabled,
    setRecordingEnabled,
    localRecording,
    isUploading,
    uploadError,
    recordingError,
    stopCallRecording,
    // Actions (same API as useWebRTC)
    initialize,
    joinRoom,
    leaveRoom,
    endRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
    startRecording,
    stopRecording,
    getRoomStatus,
    get manager() { return managerRef.current },
  }

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  )
}

export default VideoCallContext
