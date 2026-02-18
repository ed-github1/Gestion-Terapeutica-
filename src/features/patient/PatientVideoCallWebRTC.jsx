/**
 * Patient Video Call Component (WebRTC)
 * Allows patients to join and participate in video therapy sessions
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, Maximize, Minimize, PhoneOff } from 'lucide-react';
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
    <div className="h-dvh bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-white min-w-0">
            <h1 className="text-sm sm:text-base font-semibold truncate">Sesión de Terapia</h1>
            <p className="text-xs text-gray-400 truncate">
              {participants.length > 0 && `Con ${participants[0]?.userName}`}
            </p>
          </div>
          
          {isInRoom && (
            <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-xs font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-400 text-xs">
            {participants.length + 1} en la sala
          </span>
        </div>
      </div>

      {/* Video Container - fills remaining space */}
      <div className="flex-1 relative min-h-0">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          {remoteStreams.length > 0 ? (
            remoteStreams.map(({ userId, stream }) => (
              <div key={userId} className="absolute inset-0">
                <video
                  ref={el => {
                    if (el) remoteVideoRefs.current.set(userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Remote user info overlay */}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <p className="text-white text-sm font-medium">
                    {participants.find(p => p.userId === userId)?.userName || 'Profesional'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-600/60 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl text-white">👤</span>
                </div>
                <p className="text-white text-base">Esperando al profesional...</p>
                <p className="text-gray-500 text-xs mt-1">La videollamada comenzará pronto</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <motion.div
          drag
          dragConstraints={{ top: -20, bottom: 200, left: -200, right: 20 }}
          className="absolute top-3 right-3 w-28 sm:w-40 md:w-52 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-white/20 cursor-move z-10"
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
              
              <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
                <p className="text-white font-medium">Tú</p>
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

      {/* Controls - Responsive & Minimalistic */}
      <div className="bg-gradient-to-t from-gray-900 to-gray-800 border-t border-gray-700/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Primary Controls Group */}
            <div className="flex items-center gap-2">
              {/* Audio */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleAudio}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  isAudioEnabled
                    ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isAudioEnabled ? 'Silenciar' : 'Activar audio'}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </motion.button>

              {/* Video */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleVideo}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  isVideoEnabled
                    ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
              >
                {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Secondary Controls Group */}
            <div className="flex items-center gap-2">
              {/* Chat */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(!showChat)}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-lg"
                title="Chat"
              >
                <MessageSquare className="w-5 h-5" />
                {chatMessages.length > 0 && !showChat && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full text-xs flex items-center justify-center font-semibold"
                  >
                    {chatMessages.length > 9 ? '9+' : chatMessages.length}
                  </motion.span>
                )}
              </motion.button>

              {/* Fullscreen */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleFullscreen}
                className="hidden sm:flex w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all backdrop-blur-sm shadow-lg"
                title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Leave Call Button */}
            <div className="flex items-center w-full sm:w-auto justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLeaveRoom}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Salir de la llamada</span>
              </motion.button>
            </div>
          </div>
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
