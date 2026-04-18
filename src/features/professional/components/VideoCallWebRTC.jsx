/**
 * Professional Video Call Component (WebRTC)
 * Allows professionals to initiate and manage video therapy sessions
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, StopCircle, LogOut, Circle, ShieldCheck } from 'lucide-react';
import { useWebRTC } from '@shared/hooks/useWebRTC';
import { useCallRecording } from '@shared/hooks/useCallRecording';
import { videoCallService } from '@shared/services/videoCallService';
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
    isReconnecting,
    reconnectFailed,
    isRecording: isServerRecording,
    userLeft,
    recordingAuthorized,
    manager,
    joinRoom,
    leaveRoom,
    endRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
    startRecording,
    stopRecording,
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [showStopRecordingConfirm, setShowStopRecordingConfirm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [patientDeclinedRecording, setPatientDeclinedRecording] = useState(false);

  // Navigate away when reconnection fails
  useEffect(() => {
    if (reconnectFailed) {
      navigate('/dashboard/professional/appointments');
    }
  }, [reconnectFailed, navigate]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const durationDisplayRef = useRef(null);
  const callDurationRef = useRef(0);
  const countdownRef = useRef(null);

  const handleRecordingFailed = useCallback((errorMsg) => {
    console.error('[Recording] Recording failed:', errorMsg);
  }, []);

  const {
    isRecording: localRecording,
    isUploading,
    uploadError,
    recordingError,
    stopRecording: stopCallRecording,
  } = useCallRecording({ localStream, appointmentId, enabled: recordingEnabled, onRecordingFailed: handleRecordingFailed });

  // When a remote user leaves and no one is left, start 30s countdown
  useEffect(() => {
    if (userLeft && remoteStreams.length === 0 && isInRoom && !showEndConfirm) {
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!userLeft || remoteStreams.length > 0) {
      // Someone rejoined — cancel countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [userLeft, remoteStreams.length, isInRoom, showEndConfirm]);

  // Auto-show session notes modal when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !showEndConfirm) {
      setShowEndConfirm(true);
    }
  }, [countdown, showEndConfirm]);

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
      await joinRoom(appointmentId, { recordingConsent: true });
    } catch (err) {
      // Failed to join room
    }
  };

  const handleLeaveRoom = async () => {
    await stopCallRecording();
    leaveRoom();
    navigate('/dashboard/professional');
  };

  const handleEndSession = async () => {
    setIsEndingSession(true);
    setShowEndConfirm(false);
    try {
      // Wait for the recording upload to fully complete before signalling endRoom.
      // This ensures the backend has the audio file when it triggers transcription.
      await stopCallRecording();
    } catch (err) {
      console.error('[Recording] Upload error (continuing):', err);
    }
    try {
      await endRoom(appointmentId, { sessionNotes: sessionNotes.trim() });
    } catch (err) {
      console.error('End room error:', err);
    }
    navigate(`/professional/session-summary/${appointmentId}`);
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleRecordClick = () => {
    if (localRecording) {
      // Require explicit confirmation — an accidental click could end
      // the recording and discard the ongoing audio capture.
      setShowStopRecordingConfirm(true);
    } else {
      setPatientDeclinedRecording(false);
      setShowRecordingConsent(true);
    }
  };

  const handleConfirmStopRecording = () => {
    setShowStopRecordingConfirm(false);
    setRecordingEnabled(false);
    stopCallRecording();
    stopRecording(appointmentId);
  };

  const handleAcceptRecordingConsent = async () => {
    setShowRecordingConsent(false);
    // Register consent on the appointment record FIRST — the backend's
    // start-recording handler queries appointment.recordingConsent from DB.
    // We MUST await this before emitting the socket event.
    try {
      await videoCallService.grantRecordingConsent(appointmentId);
    } catch (err) {
      console.error('Failed to set recording consent on backend:', err);
      return; // Abort — backend will reject start-recording without this
    }
    setRecordingEnabled(true);
    startRecording(appointmentId);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  // Check for error first
  if (error && error.type === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Error en la Videollamada</h2>
          <p className="text-gray-400 mb-6 text-sm">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-sky-600 text-white px-6 py-2.5 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/dashboard/professional')}
              className="bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Volver
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Inicializando sala de videollamada...</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Preparando sesion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Warning banner (e.g. camera permission denied) */}
      {error && error.type === 'warning' && (
        <div className="bg-amber-600/90 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-between shrink-0 z-30">
          <span>{error.message}</span>
          <button onClick={() => window.location.reload()} className="ml-3 underline font-medium whitespace-nowrap">Reintentar</button>
        </div>
      )}
      {/* User-left notice banner */}
      {countdown !== null && userLeft && (
        <div className="bg-amber-500/90 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-between shrink-0 z-30">
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            {userLeft.userName} ha abandonado la llamada — la sesión terminará en {countdown}s
          </span>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="ml-3 underline font-medium whitespace-nowrap"
          >
            Finalizar ahora
          </button>
        </div>
      )}
      {/* Recording indicator banner */}
      {localRecording && (
        <div className="bg-red-600/90 text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-center gap-2 shrink-0 z-30">
          <Circle className="w-3 h-3 fill-white animate-pulse" />
          <span className="font-medium">Grabando sesión</span>
          <button
            onClick={handleRecordClick}
            className="ml-3 underline font-medium text-xs"
          >
            Detener
          </button>
        </div>
      )}
      {/* Upload status banner */}
      {isUploading && (
        <div className="bg-sky-600/90 text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-center gap-2 shrink-0 z-30">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Subiendo grabación…</span>
        </div>
      )}
      {/* Recording error banner */}
      {recordingError && !localRecording && (
        <div className="bg-amber-600/90 text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-center gap-2 shrink-0 z-30">
          <span className="font-medium">Error de grabación: {recordingError}</span>
          <button onClick={handleRecordClick} className="ml-3 underline font-medium text-xs">Reintentar</button>
        </div>
      )}
      {/* Upload error banner */}
      {uploadError && (
        <div className="bg-amber-600/90 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-between shrink-0 z-30">
          <span className="mr-2">{uploadError}</span>
        </div>
      )}
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
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Chat Panel — full width on mobile, side drawer on desktop */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col z-20 sm:border-l sm:border-gray-200"
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Chat de Sesión</h3>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cerrar chat"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center px-6">
                    <p className="text-xs text-gray-400">No hay mensajes aún.<br/>Envía el primero para iniciar la conversación.</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                        msg.isOwn
                          ? 'bg-sky-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-[11px] font-semibold mb-0.5 text-sky-700">{msg.userName}</p>
                      )}
                      <p className="text-sm leading-relaxed wrap-break-word">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white/80" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 shrink-0 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    aria-label="Enviar mensaje"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>
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
                    onChange={(e) => setSessionNotes(e.target.value.slice(0, 1000))}
                    maxLength={1000}
                    placeholder="Agregar notas sobre la sesión..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{sessionNotes.length}/1000</p>
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

        {/* Recording Consent Modal */}
        <AnimatePresence>
          {showRecordingConsent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <Circle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Consentimiento de grabación</h3>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <p className="font-semibold mb-1">Artículo 9 LFPDPPP — Datos sensibles</p>
                      <p>
                        La grabación de esta sesión contiene datos personales sensibles de salud mental.
                        Al iniciar la grabación confirmas que cuentas con el <strong>consentimiento
                        expreso e informado</strong> del paciente para grabar esta sesión con fines
                        terapéuticos y de seguimiento clínico.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  La grabación será procesada de forma segura para generar una transcripción
                  automática. El audio se eliminará una vez completada la transcripción.
                  Ambos participantes serán notificados de que la sesión está siendo grabada.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRecordingConsent(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAcceptRecordingConsent}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Circle className="w-3.5 h-3.5 fill-white" />
                    Iniciar grabación
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stop Recording Confirmation Modal */}
        <AnimatePresence>
          {showStopRecordingConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <StopCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">¿Detener la grabación?</h3>
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Se subirá el audio capturado hasta ahora y no podrás reanudar esta grabación.
                  Si iniciaste la grabación por error, pulsa Detener; en caso contrario, cancela
                  para continuar grabando.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowStopRecordingConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Continuar grabando
                  </button>
                  <button
                    onClick={handleConfirmStopRecording}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Detener
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reconnecting Overlay */}
        <AnimatePresence>
          {isReconnecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-30"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg font-semibold mb-1">Reconectando...</p>
                <p className="text-gray-400 text-sm">Se perdió la conexión. Intentando reconectar automáticamente.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ending Session / Uploading Overlay — blocks navigation until complete */}
        <AnimatePresence>
          {isEndingSession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-40"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-base font-semibold mb-1">
                  {isUploading ? 'Subiendo grabación…' : 'Finalizando sesión…'}
                </p>
                <p className="text-gray-400 text-sm">Por favor espera, no cierres esta ventana.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls — floating pill */}
      <div className="shrink-0 z-20 px-2 pb-2 sm:pb-4" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-fit flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          {/* Audio */}
          <button
            onClick={handleToggleAudio}
            aria-label={isAudioEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isAudioEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video */}
          <button
            onClick={handleToggleVideo}
            aria-label={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isVideoEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Record */}
          <button
            onClick={handleRecordClick}
            aria-label={(isServerRecording || localRecording) ? 'Detener grabación' : 'Grabar sesión'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              (isServerRecording || localRecording)
                ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-400/50 ring-offset-2 ring-offset-gray-900'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={(isServerRecording || localRecording) ? 'Detener grabación' : 'Grabar sesión'}
          >
            <Circle className={`w-5 h-5 ${(isServerRecording || localRecording) ? 'fill-white' : ''}`} />
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            aria-label="Abrir chat"
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              showChat ? 'bg-sky-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-sky-400 rounded-full text-[10px] flex items-center justify-center font-bold text-white">
                {chatMessages.length > 9 ? '9+' : chatMessages.length}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5 sm:mx-1" aria-hidden />

          {/* Leave */}
          <button
            onClick={handleLeaveRoom}
            aria-label="Salir de la llamada"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
            title="Salir"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {/* End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={isEndingSession}
            className="h-11 px-4 sm:px-5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium transition-all active:scale-95 flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <StopCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Finalizar</span>
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
