/**
 * Professional Video Call Component (WebRTC)
 * Allows professionals to initiate and manage video therapy sessions
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, StopCircle } from 'lucide-react';
import { useWebRTC } from '@shared/hooks/useWebRTC';
import { useAuth } from '../../auth/AuthContext';

const ProfessionalVideoCallWebRTC = () => {
  const { appointmentId } = useParams();
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
    endRoom,
    toggleAudio,
    toggleVideo,
    sendMessage
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const durationDisplayRef = useRef(null);
  const callDurationRef = useRef(0);

  // Stable ref callback for local video — sets srcObject once
  const setLocalVideoRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStream && el.srcObject !== localStream) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-join room when initialized
  useEffect(() => {
    if (isInitialized && !isInRoom && !isConnecting && appointmentId) {
      handleJoinRoom();
    }
  }, [isInitialized, appointmentId]);

  // Setup local video stream when it arrives
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream]);

  // Call duration timer — updates DOM directly to avoid React re-renders
  useEffect(() => {
    if (isInRoom && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        callDurationRef.current = elapsed;
        if (durationDisplayRef.current) {
          const hrs = Math.floor(elapsed / 3600);
          const mins = Math.floor((elapsed % 3600) / 60);
          const secs = elapsed % 60;
          durationDisplayRef.current.textContent =
            `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
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
      // Failed to join room
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/dashboard/professional');
  };

  const handleEndSession = async () => {
    try {
      await endRoom(appointmentId);
      navigate('/dashboard/professional', {
        state: {
          sessionCompleted: true,
          duration: callDurationRef.current,
          notes: sessionNotes
        }
      });
    } catch (err) {
      // Failed to end session
    }
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

  // Check for error first
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error en la Videollamada</h2>
          <p className="text-gray-600 mb-2">{error.message}</p>
          <p className="text-sm text-gray-500 mb-6">
            Asegúrese de que el servidor backend esté ejecutándose en el puerto 3000.
          </p>
          <button
            onClick={() => navigate('/dashboard/professional')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando sala de videollamada...</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header - Compact */}
      <div className="bg-gray-800/90 border-b border-gray-700/50 px-3 sm:px-6 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-white min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold truncate">Sesión Terapéutica</h1>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              {participants.length > 0 
                ? `Con ${participants[0]?.userName}`
                : 'Esperando al paciente...'
              }
            </p>
          </div>
          
          {isInRoom && (
            <div className="flex items-center gap-1 text-gray-400 shrink-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span ref={durationDisplayRef} className="text-[10px] sm:text-xs font-mono">00:00:00</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {participants.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-600/80 text-white text-[10px] sm:text-xs rounded-full">
              Conectado
            </span>
          )}
        </div>
      </div>

      {/* Video Container - fills remaining space */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Remote Video (Main) - fills entire area */}
        {remoteStreams.length > 0 ? (
          remoteStreams.map(({ userId, stream }) => (
            <div key={userId} className="absolute inset-0 bg-black">
              <video
                ref={el => {
                  if (el) {
                    remoteVideoRefs.current.set(userId, el);
                    if (el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Remote user label */}
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                <p className="text-white text-xs font-medium">
                  {participants.find(p => p.userId === userId)?.userName || 'Paciente'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-white text-sm">Esperando al paciente...</p>
              <p className="text-gray-500 text-xs mt-1">La sesión comenzará cuando se conecte</p>
            </div>
          </div>
        )}

        {/* Local Video (PIP) - bottom-right, above controls */}
        <div
          className="absolute bottom-2 right-2 w-20 h-[60px] sm:w-36 sm:h-[100px] md:w-44 md:h-[124px] bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-white/15 z-10"
        >
          {localStream ? (
            <>
              <video
                ref={setLocalVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              <div className="absolute bottom-0.5 left-1 text-[8px] sm:text-[10px]">
                <span className="text-white/80 font-medium bg-black/40 px-1 rounded">Tú</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-lg">👤</span>
            </div>
          )}
        </div>

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
              <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Chat de Sesión</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="hover:bg-purple-700 p-1 rounded"
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
                          ? 'bg-purple-600 text-white'
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End Session Confirmation Modal */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">¿Finalizar Sesión?</h3>
                <p className="text-gray-600 mb-4">
                  Esto terminará la videollamada para todos los participantes.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de sesión (opcional)
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Agregar notas sobre la sesión..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Finalizar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/95 border-t border-gray-700/50 shrink-0 z-20">
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:py-3">
          {/* Audio */}
          <button
            onClick={handleToggleAudio}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled
                ? 'bg-white/10 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Video */}
          <button
            onClick={handleToggleVideo}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled
                ? 'bg-white/10 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isVideoEnabled ? <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 text-white flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full text-[9px] flex items-center justify-center font-bold">
                {chatMessages.length > 9 ? '9+' : chatMessages.length}
              </span>
            )}
          </button>

          {/* Leave */}
          <button
            onClick={handleLeaveRoom}
            className="h-10 sm:h-11 px-3 sm:px-4 bg-gray-600/80 text-white rounded-full font-medium transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="h-10 sm:h-11 px-4 sm:px-5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <StopCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Finalizar</span>
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

export default ProfessionalVideoCallWebRTC;
