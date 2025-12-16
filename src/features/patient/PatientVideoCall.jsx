import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import Video from 'twilio-video'

const PatientVideoCallRoom = ({ token, roomName, patientName, onLeave }) => {
  const [room, setRoom] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    if (!token || !roomName) return

    Video.connect(token, {
      name: roomName,
      audio: true,
      video: { width: 640, height: 480 }
    })
      .then(connectedRoom => {
        setRoom(connectedRoom)
        setIsLoading(false)

        connectedRoom.localParticipant.tracks.forEach(publication => {
          if (publication.track) {
            attachTrack(publication.track, localVideoRef.current)
          }
        })

        connectedRoom.participants.forEach(handleParticipantConnected)
        connectedRoom.on('participantConnected', handleParticipantConnected)
        connectedRoom.on('participantDisconnected', handleParticipantDisconnected)

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
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Videollamada Médica</h2>
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

      <div className="flex-1 relative bg-black p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white">Conectando con el profesional...</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
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
              <p className="text-white text-sm">{patientName || 'Tú'}</p>
            </div>
          </div>

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
                    <p className="text-white text-sm">Esperando al profesional...</p>
                  </div>
                </div>
              )}
            </div>
            {participants.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full">
                <p className="text-white text-sm">{participants[1]?.identity || 'Profesional'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

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

const PatientVideoCall = () => {
  const { appointmentId } = useParams()
  const [searchParams] = useSearchParams()
  const patientName = searchParams.get('name') || 'Paciente'
  
  const [token, setToken] = useState(null)
  const [roomName, setRoomName] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasJoined, setHasJoined] = useState(false)

  const joinCall = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/video/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          identity: patientName
        })
      })

      if (!response.ok) {
        throw new Error('No se pudo obtener acceso a la videollamada')
      }

      const data = await response.json()
      setToken(data.token)
      setRoomName(data.roomName)
      setHasJoined(true)
    } catch (error) {
      console.error('Error joining call:', error)
      setError('No se pudo conectar a la videollamada. Por favor, verifica el enlace.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = () => {
    setHasJoined(false)
    setToken(null)
    setRoomName(null)
  }

  if (hasJoined && token && roomName) {
    return <PatientVideoCallRoom token={token} roomName={roomName} patientName={patientName} onLeave={handleLeave} />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Videollamada Médica</h1>
          <p className="text-gray-600">
            Hola {patientName}, estás a punto de unirte a tu cita virtual
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-700">Verifica tu cámara y micrófono</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700">Conexión estable a internet</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm text-gray-700">Busca un lugar privado y tranquilo</span>
          </div>
        </div>

        <button
          onClick={joinCall}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Conectando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Unirse a la Videollamada
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Al unirte, aceptas permitir el acceso a tu cámara y micrófono
        </p>
      </motion.div>
    </div>
  )
}

export default PatientVideoCall
