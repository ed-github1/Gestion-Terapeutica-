/**
 * shared/hooks/useWebRTC.js
 * React hook wrapping WebRTCManager for video call state management.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import WebRTCManager from '@shared/webrtc/WebRTCManager'
import { useAuth } from '@features/auth'

export const useWebRTC = () => {
  const { user, token } = useAuth()

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

  const managerRef = useRef(null)
  const currentRoomIdRef = useRef(null)
  const initializingRef = useRef(false)
  const mountedRef = useRef(false)

  const initialize = useCallback(async () => {
    // If we already have a working manager (StrictMode remount), just re-adopt it
    if (managerRef.current && !isInitialized) {
      setIsInitialized(true)
      return
    }
    if (isInitialized || initializingRef.current || !user || !token) return
    initializingRef.current = true
    try {
      const isProduction =
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      const API_URL =
        import.meta.env.VITE_API_URL ||
        (isProduction
          ? 'https://totalmentegestionterapeutica.onrender.com/api'
          : 'http://localhost:3000/api')
      const SOCKET_URL =
        import.meta.env.VITE_SOCKET_URL ||
        (isProduction
          ? 'https://totalmentegestionterapeutica.onrender.com'
          : 'http://localhost:3000')

      const manager = new WebRTCManager({
        apiUrl: API_URL,
        socketUrl: SOCKET_URL,
        userToken: token,
        userId: user.id || user._id,
        userName: user.name || user.nombre || 'Usuario',
        userRole: user.role || user.rol || 'patient',
      })

      manager.onRemoteStreamAdded = ({ userId, stream }) => {
        setRemoteStreams((prev) => {
          if (prev.get(userId) === stream) return prev
          const next = new Map(prev)
          next.set(userId, stream)
          return next
        })
        setRemoteStreamsVersion((v) => v + 1)
      }

      manager.onRemoteStreamRemoved = ({ userId }) => {
        setRemoteStreams((prev) => {
          if (!prev.has(userId)) return prev
          const next = new Map(prev)
          next.delete(userId)
          return next
        })
        setRemoteStreamsVersion((v) => v + 1)
      }

      manager.onUserJoined = ({ userId, userName, role }) => {
        setParticipants((prev) => [...prev, { userId, userName, role }])
        setUserLeft(null)
      }

      manager.onUserLeft = ({ userId, userName }) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== userId))
        setUserLeft({ userId, userName })
      }

      manager.onChatMessage = ({ userId, userName, message, timestamp }) => {
        const currentUserId = user.id || user._id
        setChatMessages((prev) => [
          ...prev,
          { userId, userName, message, timestamp, isOwn: userId === currentUserId },
        ])
      }

      manager.onMediaStateChanged = ({ userId, audio, video }) =>
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, audioEnabled: audio, videoEnabled: video } : p,
          ),
        )

      manager.onRoomEnded = ({ message }) => {
        console.log('Room ended:', message)
        setRoomEnded(true)
        setIsInRoom(false)
        setLocalStream(null)
        setRemoteStreams(new Map())
        setRemoteStreamsVersion(0)
        setParticipants([])
        setChatMessages([])
        currentRoomIdRef.current = null
      }

      manager.onError = (err) =>
        setError({ type: 'error', message: err.message || 'Error en la videollamada' })

      manager.onConnectionStateChange = ({ state }) => setConnectionState(state)

      manager.onReconnecting = ({ reconnecting }) => setIsReconnecting(reconnecting)

      manager.onReconnectFailed = () => {
        setIsReconnecting(false)
        setReconnectFailed(true)
        setIsInRoom(false)
        setLocalStream(null)
        setRemoteStreams(new Map())
        setRemoteStreamsVersion(0)
        setParticipants([])
        currentRoomIdRef.current = null
      }

      manager.onRecordingStateChanged = ({ isRecording: recording }) => {
        setIsRecording(recording)
      }

      await manager.initialize()
      managerRef.current = manager
      setIsInitialized(true)
    } catch (err) {
      console.error('WebRTC initialization error:', err)
      initializingRef.current = false
      setError({ type: 'error', message: err.message || 'Error al inicializar videollamada' })
    }
  }, [user, token, isInitialized])

  const joinRoom = useCallback(async (appointmentId, { recordingConsent = false } = {}) => {
    if (!managerRef.current) throw new Error('WebRTC Manager not initialized')
    try {
      setIsConnecting(true)
      setError(null)
      const room = await managerRef.current.joinRoom(appointmentId, { recordingConsent })
      setLocalStream(managerRef.current.localStream)
      if (!managerRef.current.localStream) {
        setError({ type: 'warning', message: 'No se pudo acceder a la cámara/micrófono. Permite el acceso en tu navegador y recarga la página.' })
      }
      currentRoomIdRef.current = room.roomId
      setIsInRoom(true)
      setIsConnecting(false)
      return room
    } catch (err) {
      setIsConnecting(false)
      setError({ type: 'error', message: err.message })
      throw err
    }
  }, [])

  const leaveRoom = useCallback(() => {
    if (!managerRef.current) return
    managerRef.current.leaveRoom()
    setIsInRoom(false)
    setLocalStream(null)
    setRemoteStreams(new Map())
    setRemoteStreamsVersion(0)
    setParticipants([])
    setChatMessages([])
    currentRoomIdRef.current = null
  }, [])

  const endRoom = useCallback(
    async (appointmentId, { sessionNotes } = {}) => {
      if (!managerRef.current) return
      try {
        await managerRef.current.endRoom(appointmentId, { sessionNotes })
        leaveRoom()
      } catch (err) {
        setError({ type: 'error', message: err.message })
        throw err
      }
    },
    [leaveRoom],
  )

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

  const sendMessage = useCallback(
    (message) => {
      if (!managerRef.current) return
      managerRef.current.sendChatMessage(message)
      const userId = user.id || user._id
      setChatMessages((prev) => [
        ...prev,
        { userId, userName: 'Tú', message, timestamp: new Date().toISOString(), isOwn: true },
      ])
    },
    [user],
  )

  const startRecording = useCallback(async (appointmentId) => {
    if (!managerRef.current) return
    try {
      await managerRef.current.startRecording(appointmentId)
    } catch (err) {
      setError({ type: 'error', message: err.message || 'Error al iniciar grabación' })
    }
  }, [])

  const stopRecording = useCallback(async (appointmentId) => {
    if (!managerRef.current) return
    try {
      await managerRef.current.stopRecording(appointmentId)
    } catch (err) {
      setError({ type: 'error', message: err.message || 'Error al detener grabación' })
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

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Delay disconnect so StrictMode remount can reclaim the manager.
      // On real unmount the timeout fires and cleans up.
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
    if (user && token && !isInitialized) initialize()
  }, [user, token, isInitialized, initialize])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const remoteStreamsArray = useMemo(
    () => Array.from(remoteStreams.entries()).map(([userId, stream]) => ({ userId, stream })),
    [remoteStreamsVersion],
  )

  return {
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
    manager: managerRef.current,
  }
}

export default useWebRTC
