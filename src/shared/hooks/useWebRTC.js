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

  const managerRef = useRef(null)
  const currentRoomIdRef = useRef(null)

  const initialize = useCallback(async () => {
    if (isInitialized || !user || !token) return
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

      manager.onUserJoined = ({ userId, userName, role }) =>
        setParticipants((prev) => [...prev, { userId, userName, role }])

      manager.onUserLeft = ({ userId }) =>
        setParticipants((prev) => prev.filter((p) => p.userId !== userId))

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
        setIsInRoom(false)
        setError({ type: 'info', message })
      }

      manager.onError = (err) =>
        setError({ type: 'error', message: err.message || 'Error en la videollamada' })

      manager.onConnectionStateChange = ({ state }) => setConnectionState(state)

      await manager.initialize()
      managerRef.current = manager
      setIsInitialized(true)
    } catch (err) {
      setError({ type: 'error', message: 'Error al inicializar videollamada' })
      throw err
    }
  }, [user, token, isInitialized])

  const joinRoom = useCallback(async (appointmentId) => {
    if (!managerRef.current) throw new Error('WebRTC Manager not initialized')
    try {
      setIsConnecting(true)
      setError(null)
      const room = await managerRef.current.joinRoom(appointmentId)
      setLocalStream(managerRef.current.localStream)
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
    async (appointmentId) => {
      if (!managerRef.current) return
      try {
        await managerRef.current.endRoom(appointmentId)
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

  const getRoomStatus = useCallback(async (appointmentId) => {
    if (!managerRef.current) return null
    try {
      return await managerRef.current.getRoomStatus(appointmentId)
    } catch (err) {
      setError({ type: 'error', message: err.message })
      throw err
    }
  }, [])

  useEffect(() => () => { managerRef.current?.disconnect() }, [])

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
    localStream,
    remoteStreams: remoteStreamsArray,
    participants,
    chatMessages,
    error,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    initialize,
    joinRoom,
    leaveRoom,
    endRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
    getRoomStatus,
    manager: managerRef.current,
  }
}

export default useWebRTC
