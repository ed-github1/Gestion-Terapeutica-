/**
 * Patient Video Call Component (WebRTC)
 * Allows patients to join and participate in video therapy sessions
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, ChevronLeft, PhoneOff, LogOut, Circle, ShieldAlert } from 'lucide-react';
import { useWebRTC } from '@shared/hooks/useWebRTC';
import { useCallRecording } from '@shared/hooks/useCallRecording';
import { videoCallService } from '@shared/services/videoCallService';
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
    roomEnded,
    localStream,
    remoteStreams,
    participants,
    chatMessages,
    error,
    isAudioEnabled,
    isVideoEnabled,
    isReconnecting,
    isServerRecording,
    reconnectFailed,
    userLeft,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [showRecordingDisclaimer, setShowRecordingDisclaimer] = useState(false);
  const [recordingConsented, setRecordingConsented] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const recordingAcknowledgedRef = useRef(false);

  const handleRecordingFailed = useCallback((errorMsg) => {
    console.error('[Recording] Patient recording failed:', errorMsg);
  }, []);

  const {
    isRecording,
    isUploading,
    uploadError,
    recordingError,
    stopRecording: stopCallRecording,
  } = useCallRecording({ localStream, appointmentId, enabled: recordingConsented, onRecordingFailed: handleRecordingFailed });

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const durationDisplayRef = useRef(null);
  const countdownRef = useRef(null);

  // When a remote user leaves and no one is left, start 30s countdown
  useEffect(() => {
    if (userLeft && remoteStreams.length === 0 && isInRoom) {
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
    } else {
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
  }, [userLeft, remoteStreams.length, isInRoom]);

  // Auto-navigate away when reconnection permanently fails
  useEffect(() => {
    if (reconnectFailed) {
      navigate('/dashboard/patient');
    }
  }, [reconnectFailed, navigate]);

  // Auto-leave when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      handleLeaveRoom();
    }
  }, [countdown]);

  // Show recording disclaimer when the professional starts recording (server event)
  useEffect(() => {
    if (isServerRecording && !recordingAcknowledgedRef.current) {
      setShowRecordingDisclaimer(true);
    }
    if (!isServerRecording) {
      recordingAcknowledgedRef.current = false;
      setRecordingConsented(false);
    }
  }, [isServerRecording]);

  // When the professional ends the room, stop recording and navigate back after 3 seconds
  useEffect(() => {
    if (!roomEnded) return;
    stopCallRecording();
    const timer = setTimeout(() => navigate('/dashboard/patient'), 3000);
    return () => clearTimeout(timer);
  }, [roomEnded, navigate, stopCallRecording]);

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
      try { await videoCallService.acceptInvitation(appointmentId); } catch { /* may already be accepted */ }
      await joinRoom(appointmentId, { recordingConsent: true });
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleLeaveRoom = async () => {
    await stopCallRecording();
    leaveRoom();
    navigate('/dashboard/patient');
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleDeclineRecording = async () => {
    recordingAcknowledgedRef.current = true;
    setShowRecordingDisclaimer(false);
    try {
      await videoCallService.declineRecordingConsent?.(appointmentId);
    } catch { /* best-effort */ }
    handleLeaveRoom();
  };

  const handleAcceptRecording = async () => {
    setConsentLoading(true);
    try {
      await videoCallService.grantRecordingConsent(appointmentId);
      recordingAcknowledgedRef.current = true;
      setRecordingConsented(true);
      setShowRecordingDisclaimer(false);
    } catch (err) {
      console.error('Failed to register recording consent:', err);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Inicializando videollamada...</p>
        </div>
      </div>
    );
  }

  if (roomEnded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center">
            <PhoneOff className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">La sesión ha finalizado</h2>
          <p className="text-gray-400 text-sm">Serás redirigido en unos segundos…</p>
        </motion.div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Conectando a la sesion...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => navigate('/dashboard/patient')}
              className="bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Volver
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const btnBase = { width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all 0.2s' };
  const glassIdle = 'rgba(255,255,255,0.1)';
  const glassBorder = '1px solid rgba(255,255,255,0.2)';
  const glassShadow = '0 4px 20px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.12)';
  const redActive = 'linear-gradient(135deg,#ef4444,#dc2626)';
  const redBorder = '1px solid rgba(239,68,68,0.5)';
  const redShadow = '0 4px 20px rgba(239,68,68,0.4),inset 0 1px 0 rgba(255,255,255,0.15)';
  const skyActive = 'linear-gradient(135deg,#0ea5e9,#0284c7)';
  const skyBorder = '1px solid rgba(14,165,233,0.5)';
  const skyShadow = '0 4px 20px rgba(14,165,233,0.4),inset 0 1px 0 rgba(255,255,255,0.15)';
  const labelStyle = { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* ── Full-screen remote video ─────────────────────────────────── */}
      {remoteStreams.length > 0 ? (
        remoteStreams.map(({ userId, stream }) => (
          <video key={userId}
            ref={el => { if (el) { remoteVideoRefs.current.set(userId, el); if (el.srcObject !== stream) el.srcObject = stream; } }}
            autoPlay playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ))
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}>
              <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-white text-base font-medium">Esperando al profesional...</p>
            <p className="text-white/30 text-sm mt-1">La sesión comenzará pronto</p>
          </div>
        </div>
      )}

      {/* ── Status banners — absolute top ───────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-50 flex flex-col">
        {error?.type === 'warning' && (
          <div className="text-white text-xs px-4 py-2 flex items-center justify-between backdrop-blur-sm" style={{ background: 'rgba(217,119,6,0.9)' }}>
            <span>{error.message}</span>
            <button onClick={() => window.location.reload()} className="ml-3 underline font-medium">Reintentar</button>
          </div>
        )}
        {countdown !== null && userLeft && (
          <div className="text-white text-xs px-4 py-2 flex items-center justify-between backdrop-blur-sm" style={{ background: 'rgba(245,158,11,0.9)' }}>
            <span className="flex items-center gap-2"><LogOut className="w-3.5 h-3.5" />{userLeft.userName} ha abandonado — la sesión termina en {countdown}s</span>
            <button onClick={handleLeaveRoom} className="ml-3 underline font-medium">Salir ahora</button>
          </div>
        )}
        {(isServerRecording || isRecording) && (
          <div className="text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 backdrop-blur-sm" style={{ background: 'rgba(220,38,38,0.9)' }}>
            <Circle className="w-2.5 h-2.5 fill-white animate-pulse" />
            <span className="font-medium">Grabando sesión</span>
          </div>
        )}
      </div>

      {/* ── Back button — top left ───────────────────────────────────── */}
      <button onClick={handleLeaveRoom} aria-label="Salir"
        className="absolute z-30 active:scale-90 transition-transform"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', left: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </div>
      </button>

      {/* ── Timer — top center ───────────────────────────────────────── */}
      {isInRoom && (
        <div className="absolute z-30 left-1/2 -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', boxShadow: '0 2px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.9)' }} />
            <span ref={durationDisplayRef} className="text-[13px] font-light text-white/85 tabular-nums" style={{ letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>00:00:00</span>
          </div>
        </div>
      )}

      {/* ── PIP local video — top right ──────────────────────────────── */}
      <div className="absolute z-30 rounded-2xl overflow-hidden"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 14, width: 88, height: 120, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 28px rgba(0,0,0,0.6)' }}>
        {localStream ? (
          <>
            <video ref={setLocalVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,20,0.9)' }}>
                <VideoOff className="w-5 h-5 text-white/40" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(10,10,20,0.9)' }}>
            <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Professional name tag — bottom left, above controls ──────── */}
      {participants.length > 0 && (
        <div className="absolute z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 112px)', left: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)' }}>
            <span className="text-sky-300 text-xs font-bold">{participants[0]?.userName?.charAt(0)?.toUpperCase() ?? '?'}</span>
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">{participants[0]?.userName}</p>
            <p className="text-white/35 text-[10px]">Profesional</p>
          </div>
        </div>
      )}

      {/* ── Reconnecting overlay ─────────────────────────────────────── */}
      {isReconnecting && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center z-40" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Reconectando...</p>
            <p className="text-white/40 text-sm mt-1">Se perdió la conexión. Intentando restablecer...</p>
          </div>
        </motion.div>
      )}

      {/* ── Chat Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="absolute top-0 right-0 w-full sm:w-96 h-full z-40 flex flex-col"
            style={{ background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.15)' }}>
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">Chat</h3>
              </div>
              <button onClick={() => setShowChat(false)}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-full transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center px-6">
                  <p className="text-xs text-white/30">No hay mensajes aún.<br />Envía el primero para iniciar la conversación.</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${msg.isOwn ? 'bg-sky-500 text-white rounded-br-md' : 'bg-white/10 text-white rounded-bl-md'}`}>
                    {!msg.isOwn && <p className="text-[11px] font-semibold mb-0.5 text-sky-400">{msg.userName}</p>}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-white/60' : 'text-white/40'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <div className="flex gap-2 items-center">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje…"
                  className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button type="submit" disabled={!chatInput.trim()}
                  className="w-10 h-10 shrink-0 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-40 transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls bar — centered row over gradient fade ───────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />
        <div className="relative flex items-end justify-center gap-4 px-4 pb-6 pt-8">

          {/* Mic */}
          <button onClick={handleToggleAudio} aria-label={isAudioEnabled ? 'Silenciar' : 'Activar micrófono'}
            className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
            <div style={{ ...btnBase, background: isAudioEnabled ? glassIdle : redActive, border: isAudioEnabled ? glassBorder : redBorder, boxShadow: isAudioEnabled ? glassShadow : redShadow }}>
              {isAudioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </div>
            <span style={labelStyle}>{isAudioEnabled ? 'Micrófono' : 'Silenciado'}</span>
          </button>

          {/* Leave — center, larger red circle */}
          <button onClick={handleLeaveRoom}
            className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
            <div style={{ width: 62, height: 62, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: redActive, border: redBorder, boxShadow: '0 0 0 6px rgba(239,68,68,0.18),' + redShadow, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all 0.2s' }}>
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span style={labelStyle}>Salir</span>
          </button>

          {/* Camera */}
          <button onClick={handleToggleVideo} aria-label={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
            className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform">
            <div style={{ ...btnBase, background: isVideoEnabled ? glassIdle : redActive, border: isVideoEnabled ? glassBorder : redBorder, boxShadow: isVideoEnabled ? glassShadow : redShadow }}>
              {isVideoEnabled ? <VideoIcon className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </div>
            <span style={labelStyle}>{isVideoEnabled ? 'Cámara' : 'Sin cámara'}</span>
          </button>

          {/* Chat */}
          <button onClick={() => setShowChat(!showChat)} aria-label="Abrir chat"
            className="flex flex-col items-center gap-1.5 group active:scale-90 transition-transform relative">
            <div style={{ ...btnBase, background: showChat ? skyActive : glassIdle, border: showChat ? skyBorder : glassBorder, boxShadow: showChat ? skyShadow : glassShadow }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-1 right-0.5 min-w-4.5 h-4.5 px-1 rounded-full text-[9px] flex items-center justify-center font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 2px 8px rgba(14,165,233,0.6)' }}>
                {chatMessages.length > 9 ? '9+' : chatMessages.length}
              </span>
            )}
            <span style={labelStyle}>Chat</span>
          </button>

        </div>
      </div>

      {/* Recording Disclaimer Modal */}
      <AnimatePresence>
        {showRecordingDisclaimer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
              style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <Circle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Aviso de grabación</h3>
              </div>
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/80 leading-relaxed">
                    <p className="font-semibold mb-1">Protección de datos personales</p>
                    <p>Tu profesional ha iniciado la grabación de esta sesión. La grabación se utilizará exclusivamente con fines terapéuticos. El audio será procesado de forma segura y eliminado tras generar la transcripción.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/40 mb-4">Si no deseas que la sesión sea grabada, puedes abandonar la videollamada.</p>
              <div className="flex gap-3">
                <button onClick={handleDeclineRecording}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 transition-colors text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                  Salir de la sesión
                </button>
                <button onClick={handleAcceptRecording} disabled={consentLoading}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: '1px solid rgba(14,165,233,0.4)' }}>
                  {consentLoading ? 'Registrando…' : 'Entendido, continuar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default PatientVideoCallWebRTC;