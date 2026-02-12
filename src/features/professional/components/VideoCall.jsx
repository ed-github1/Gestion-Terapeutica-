import { useEffect, useState, useRef } from 'react'
import Video from 'twilio-video'
import { motion } from 'motion/react'
import { useAuth } from '../../auth'

const VideoCallRoom = ({ token, roomName, onLeave }) => {
  const [room, setRoom] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    if (!token || !roomName) return

    // Connect to Twilio Video room
    Video.connect(token, {
      name: roomName,
      audio: true,
      video: { width: 640, height: 480 }
    })
      .then(connectedRoom => {
        setRoom(connectedRoom)
        setIsLoading(false)

        // Attach local video
        connectedRoom.localParticipant.tracks.forEach(publication => {
          if (publication.track) {
            attachTrack(publication.track, localVideoRef.current)
          }
        })

        // Attach existing remote participants
        connectedRoom.participants.forEach(handleParticipantConnected)

        // Listen for new participants
        connectedRoom.on('participantConnected', handleParticipantConnected)
        connectedRoom.on('participantDisconnected', handleParticipantDisconnected)

        // Update participants list
        updateParticipants(connectedRoom)
      })
      .catch(error => {
        console.error('Error connecting to room:', error)
        setIsLoading(false)
        alert('Error al conectar a la videollamada: ' + error.message)
      })

    return () => {
      if (room) {
        room.disconnect()
      }
    }
  }, [token, roomName])

  const handleParticipantConnected = (participant) => {
    console.log('Participant connected:', participant.identity)
    
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        attachTrack(publication.track, remoteVideoRef.current)
      }
    })

    participant.on('trackSubscribed', track => {
      attachTrack(track, remoteVideoRef.current)
    })

    if (room) {
      updateParticipants(room)
    }
  }

  const handleParticipantDisconnected = (participant) => {
    console.log('Participant disconnected:', participant.identity)
    if (room) {
      updateParticipants(room)
    }
  }

  const attachTrack = (track, container) => {
    if (container && track.kind === 'video') {
      container.appendChild(track.attach())
    }
  }

  const updateParticipants = (currentRoom) => {
    const participantList = Array.from(currentRoom.participants.values())
    setParticipants([currentRoom.localParticipant, ...participantList])
  }

  const toggleMute = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach(publication => {
        if (isMuted) {
          publication.track.enable()
        } else {
          publication.track.disable()
        }
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach(publication => {
        if (isVideoOff) {
          publication.track.enable()
        } else {
          publication.track.disable()
        }
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const handleLeave = () => {
    if (room) {
      room.disconnect()
    }
    onLeave()
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Videollamada</h2>
          <p className="text-sm text-gray-400">
            {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
          </p>
        </div>
        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Salir de la llamada
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white">Conectando...</p>
            </div>
          </div>
        )}
        
        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div ref={localVideoRef} className="w-full h-full flex items-center justify-center">
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm">Tú</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full">
              <p className="text-white text-sm">Tú</p>
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div ref={remoteVideoRef} className="w-full h-full flex items-center justify-center">
              {participants.length <= 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm">Esperando participante...</p>
                  </div>
                </div>
              )}
            </div>
            {participants.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full">
                <p className="text-white text-sm">{participants[1]?.identity || 'Participante'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoOff ? 'Activar cámara' : 'Desactivar cámara'}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleLeave}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
            title="Colgar"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const VideoCallLauncher = ({ appointmentId, patientName, patientId, onClose }) => {
  const { user } = useAuth()
  const [token, setToken] = useState(null)
  const [roomName, setRoomName] = useState(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [isNotifyingPatient, setIsNotifyingPatient] = useState(false)

  const createRoom = async () => {
    setIsCreatingRoom(true)
    
    // Debug: Check what values we have
    console.log('🎬 Starting video call...', {
      appointmentId,
      patientId,
      patientName,
      hasPatientId: !!patientId
    })
    
    if (!patientId) {
      console.error('❌ No patientId provided! Cannot notify patient.')
      alert('Error: No se pudo identificar al paciente. Verifica que el appointment tenga patientId.')
      setIsCreatingRoom(false)
      return
    }
    
    try {
      // Get video token
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          appointmentId,
          identity: user?._id || user?.email || user?.nombre || `professional-${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get video token')
      }

      const data = await response.json()
      setToken(data.token)
      setRoomName(data.roomName || `room-${appointmentId}`)
      
      // Notify patient about the call
      await notifyPatient()
      
      setIsInCall(true)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Error al crear la sala de videollamada. Asegúrate de que el backend esté configurado.')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const notifyPatient = async () => {
    setIsNotifyingPatient(true)
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/notify-patient`
      console.log('📞 Notifying patient...', {
        apiUrl,
        appointmentId,
        patientId
      })
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      console.log('🔑 Using auth token:', !!token)
      
      const professionalName = user?.name || user?.nombre || 'Professional'
      
      const requestBody = {
        appointmentId,
        patientId,
        patientName,
        professionalName
      }
      console.log('📤 Sending notification with:', requestBody)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Notification response status:', response.status)
      const responseData = await response.json()
      console.log('📥 Notification response:', responseData)
      
      if (response.ok) {
        console.log('✅ Patient notified successfully')
      } else {
        console.error('⚠️ Failed to notify patient:', responseData)
      }
    } catch (error) {
      console.error('❌ Error notifying patient:', error)
    } finally {
      setIsNotifyingPatient(false)
    }
  }

  const handleLeave = () => {
    setIsInCall(false)
    setToken(null)
    setRoomName(null)
    if (onClose) onClose()
  }

  if (isInCall && token && roomName) {
    return <VideoCallRoom token={token} roomName={roomName} onLeave={handleLeave} />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center relative"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Videollamada</h2>
        <p className="text-gray-600 mb-6">
          {patientName ? `Cita con ${patientName}` : 'Iniciar sesión de videollamada'}
        </p>

        {isNotifyingPatient && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Notificando al paciente...</span>
            </div>
          </div>
        )}

        <button
          onClick={createRoom}
          disabled={isCreatingRoom}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
        >
          {isCreatingRoom ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creando sala...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Iniciar Videollamada
            </>
          )}
        </button>

        <p className="text-sm text-gray-500 mt-4">
          Asegúrate de tener tu cámara y micrófono conectados
        </p>
      </motion.div>
    </div>
  )
}

export default VideoCallLauncher
export { VideoCallRoom }
