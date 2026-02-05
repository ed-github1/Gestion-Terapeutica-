/**
 * Patient Video Call Component (WebRTC)
 * Allows patients to join and participate in video therapy sessions
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useAuth } from '../auth/AuthContext';

const PatientVideoCallWebRTC = () => {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    isInitialized,
    isConnecting,
    isInRoom,
    localStream,
    remoteStreams,
    participants,
    chatMessages,
    error,
    isAudioEnabled,
    isVideoEnabled,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    sendMessage
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Auto-join room when initialized
  useEffect(() => {
    if (isInitialized && !isInRoom && !isConnecting && appointmentId) {
      handleJoinRoom();
    }
  }, [isInitialized, appointmentId]);

  // Setup local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup remote video streams
  useEffect(() => {
    remoteStreams.forEach(({ userId, stream }) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Call duration timer
  useEffect(() => {
    if (isInRoom && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isInRoom]);

  const handleJoinRoom = async () => {
    try {
      await joinRoom(appointmentId);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/patient/appointments');
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando videollamada...</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando a la sesión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error en la Videollamada</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver a Citas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <h1 className="text-lg font-semibold">Sesión de Terapia</h1>
            <p className="text-sm text-gray-400">
              {participants.length > 0 && `Con ${participants[0]?.userName}`}
            </p>
          </div>
          
          {isInRoom && (
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">
            Participantes: {participants.length + 1}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video (Main) */}
        <div className="w-full h-full bg-gray-900">
          {remoteStreams.length > 0 ? (
            remoteStreams.map(({ userId, stream }) => (
              <div key={userId} className="w-full h-full relative">
                <video
                  ref={el => {
                    if (el) remoteVideoRefs.current.set(userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Remote user info overlay */}
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-white font-medium">
                    {participants.find(p => p.userId === userId)?.userName || 'Profesional'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">👤</span>
                </div>
                <p className="text-white text-lg">Esperando al profesional...</p>
                <p className="text-gray-400 text-sm mt-2">La videollamada comenzará pronto</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <motion.div
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700 cursor-move"
        >
          {localStream ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl">📹</span>
                    <p className="text-white text-sm mt-2">Cámara apagada</p>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                <p className="text-white text-xs font-medium">Tú</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-4xl">👤</span>
            </div>
          )}
        </motion.div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl flex flex-col z-10"
            >
              <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="hover:bg-indigo-700 p-1 rounded"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs font-semibold mb-1">{msg.userName}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Audio */}
          <button
            onClick={handleToggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Silenciar' : 'Activar audio'}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>

          {/* Toggle Video */}
          <button
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
          >
            {isVideoEnabled ? '📹' : '📹❌'}
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors relative"
            title="Chat"
          >
            💬
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
            title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors flex items-center space-x-2"
          >
            <span>📞</span>
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Mirror effect for local video */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default PatientVideoCallWebRTC;
