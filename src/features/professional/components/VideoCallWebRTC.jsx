/**
 * Professional Video Call Component (WebRTC)
 * Allows professionals to initiate and manage video therapy sessions
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, StopCircle, LogOut, Circle, ShieldCheck, ClipboardList, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { useVideoCall as useWebRTC } from '@shared/context/VideoCallContext';
import { videoCallService } from '@shared/services/videoCallService';
import { appointmentsService } from '@shared/services/appointmentsService';
import { useAuth } from '../../auth/AuthContext';
import PatientClinicalFile from './clinicalFile/PatientClinicalFile';
import logoSymbol from '@/assets/SIMBOLO_LOGO_TOTALMENTE.png';
import { getAvatarColor } from '@shared/utils/avatarColor';

const ProfessionalVideoCallWebRTC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    isInitialized, isConnecting, isInRoom, localStream, remoteStreams, participants,
    chatMessages, error, isAudioEnabled, isVideoEnabled, isReconnecting, reconnectFailed,
    isRecording: isServerRecording, userLeft, recordingAuthorized, manager,
    joinRoom, leaveRoom, endRoom, toggleAudio, toggleVideo, sendMessage, startRecording, stopRecording,
    // Recording lives in context so it survives navigation to the mini-player
    recordingEnabled, setRecordingEnabled, localRecording, isUploading, uploadError, recordingError,
    stopCallRecording, setIsMinimized, callStartTime,
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [showStopRecordingConfirm, setShowStopRecordingConfirm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [patientDeclinedRecording, setPatientDeclinedRecording] = useState(false);
  const [awaitingPatientConsent, setAwaitingPatientConsent] = useState(false);
  const [showClinicalFile, setShowClinicalFile] = useState(false);
  const [clinicalPatient, setClinicalPatient] = useState(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDesktopPanel, setShowDesktopPanel] = useState(true);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (reconnectFailed) navigate('/dashboard/professional/appointments');
  }, [reconnectFailed, navigate]);

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Start server recording once patient has given consent (recording-authorized event)
  useEffect(() => {
    if (!recordingAuthorized || !awaitingPatientConsent) return;
    setAwaitingPatientConsent(false);
    setRecordingEnabled(true);
    startRecording(appointmentId);
  }, [recordingAuthorized, awaitingPatientConsent, startRecording, appointmentId]);

  // When navigating away without ending the call, minimize to mini-player instead of hanging up.
  useEffect(() => () => {
    if (isLeavingIntentionallyRef.current) return;
    setIsMinimized(true);
  }, []);

  // Warn on browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => { if (isInRoom) e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInRoom]);

  // Block browser back button while recording is active
  useEffect(() => {
    if (!recordingEnabled) return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowNavigationWarning(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [recordingEnabled]);

  const handleNavigationWarningConfirm = async () => {
    setShowNavigationWarning(false);
    setIsEndingSession(true);
    isLeavingIntentionallyRef.current = true;
    setRecordingEnabled(false);
    stopRecording(appointmentId);
    try { await stopCallRecording(); } catch (err) { console.error('[Recording] Upload error on nav:', err); }
    leaveRoom();
    navigate('/dashboard/professional');
  };

  const handleNavigationWarningCancel = () => {
    setShowNavigationWarning(false);
  };

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const durationDisplayRef = useRef(null);
  const callDurationRef = useRef(0);
  const countdownRef = useRef(null);
  const isLeavingIntentionallyRef = useRef(false);
  const statusBannerRef = useRef(null);
  const [bannerHeight, setBannerHeight] = useState(0);


  useEffect(() => {
    if (statusBannerRef.current) setBannerHeight(statusBannerRef.current.offsetHeight);
  }, [error, countdown, isUploading, recordingError, uploadError, userLeft]);

  // Keep remote video elements in sync with streams (handles reconnects + autoPlay failures)
  useEffect(() => {
    const cleanups = [];
    remoteStreams.forEach(({ userId, stream }) => {
      const el = remoteVideoRefs.current.get(userId);
      if (!el) return;
      if (el.srcObject !== stream) el.srcObject = stream;
      if (el.paused) el.play().catch(() => {});
      // Retry play() when a track is added dynamically (e.g. video arrives after audio).
      const tryPlay = () => { if (el.paused) el.play().catch(() => {}); };
      stream.addEventListener('addtrack', tryPlay);
      cleanups.push(() => stream.removeEventListener('addtrack', tryPlay));
    });
    return () => cleanups.forEach(fn => fn());
  }, [remoteStreams]);

  useEffect(() => {
    if (userLeft && remoteStreams.length === 0 && isInRoom && !showEndConfirm) {
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(countdownRef.current); countdownRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (!userLeft || remoteStreams.length > 0) {
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      setCountdown(null);
    }
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [userLeft, remoteStreams.length, isInRoom, showEndConfirm]);

  useEffect(() => {
    if (countdown === 0 && !showEndConfirm) setShowEndConfirm(true);
  }, [countdown, showEndConfirm]);

  const setLocalVideoRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStream && el.srcObject !== localStream) el.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (isInitialized && !isInRoom && !isConnecting && appointmentId) handleJoinRoom();
    // Returning from mini-player — restore full-screen mode
    if (isInRoom) setIsMinimized(false);
  }, [isInitialized, appointmentId]);

  useEffect(() => {
    if (localStream && localVideoRef.current && localVideoRef.current.srcObject !== localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!isInRoom || !callStartTime) return;
    callStartTimeRef.current = callStartTime;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      callDurationRef.current = elapsed;
      if (durationDisplayRef.current) {
        const hrs = Math.floor(elapsed / 3600);
        const mins = Math.floor((elapsed % 3600) / 60);
        const secs = elapsed % 60;
        durationDisplayRef.current.textContent =
          `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    };
    tick(); // show correct elapsed time immediately on (re)mount
    durationIntervalRef.current = setInterval(tick, 1000);
    return () => { clearInterval(durationIntervalRef.current); durationIntervalRef.current = null; };
  }, [isInRoom, callStartTime]);

  const handleJoinRoom = async () => {
    try { await joinRoom(appointmentId); }
    catch (err) { console.error('Failed to join room:', err); }
  };

  const handleLeaveRoom = () => {
    isLeavingIntentionallyRef.current = true;
    // Recording is intentionally NOT uploaded on leave — only "Finalizar Sesión" uploads.
    leaveRoom();
    navigate('/dashboard/professional');
  };

  const handleMinimize = () => {
    // Cleanup effect will call setIsMinimized(true) on unmount since we don't set isLeavingIntentionallyRef
    navigate('/dashboard/professional');
  };

  const handleEndSession = async () => {
    isLeavingIntentionallyRef.current = true;
    setIsEndingSession(true);
    setShowEndConfirm(false);
    try { await stopCallRecording(); }
    catch (err) { console.error('[Recording] Upload error (continuing):', err); }
    try { await endRoom(appointmentId, { sessionNotes: sessionNotes.trim() }); }
    catch (err) { console.error('End room error:', err); }
    navigate(`/professional/session-summary/${appointmentId}`);
  };

  const handleToggleAudio = () => toggleAudio();
  const handleToggleVideo = () => toggleVideo();

  const handleRecordClick = () => {
    if (localRecording) setShowStopRecordingConfirm(true);
    else { setPatientDeclinedRecording(false); setShowRecordingConsent(true); }
  };

  const handleConfirmStopRecording = () => {
    setShowStopRecordingConfirm(false);
    setRecordingEnabled(false);
    stopCallRecording();
    stopRecording(appointmentId);
  };

  const handleAcceptRecordingConsent = async () => {
    setShowRecordingConsent(false);
    // Emit socket consent first — this is what notifies the patient.
    // The API call is best-effort persistence and must not block the socket flow.
    manager?.registerRecordingConsent();
    setAwaitingPatientConsent(true);
    try { await videoCallService.grantRecordingConsent(appointmentId); }
    catch (err) { console.error('Failed to set recording consent on backend:', err); }
  };

  const loadClinicalPatient = useCallback(async () => {
    if (clinicalPatient) return;
    try {
      const apptRes = await appointmentsService.getById(appointmentId);
      const appt = apptRes?.data?.data ?? apptRes?.data ?? apptRes;
      const raw  = appt?.patientId ?? appt?.patient ?? appt?.paciente;

      if (raw && typeof raw === 'object' && (raw.userId || raw.user)) {
        setClinicalPatient(raw);
        return;
      }

      const userIdStr = typeof raw === 'string' ? raw : raw?._id ? String(raw._id) : null;
      const apptName  = appt?.patientName || appt?.nombrePaciente || '';
      const rawName   = raw && typeof raw === 'object'
        ? (`${raw.firstName || raw.nombre || ''} ${raw.lastName || raw.apellido || ''}`.trim() || raw.name || '')
        : '';
      const parts = (apptName || rawName).split(' ');
      setClinicalPatient({
        nombre:   parts[0] || '',
        apellido: parts.slice(1).join(' '),
        ...(userIdStr ? { userId: userIdStr } : {}),
      });
    } catch (err) {
      console.error('[loadClinicalPatient] failed:', err?.message);
    }
  }, [appointmentId, clinicalPatient]);

  const handleOpenClinicalFile = async () => {
    if (showClinicalFile) { setShowClinicalFile(false); return; }
    setShowChat(false);
    setShowClinicalFile(true);
    loadClinicalPatient();
  };

  useEffect(() => {
    if (appointmentId) loadClinicalPatient();
  }, [appointmentId]);

  useEffect(() => {
    if (isInRoom) loadClinicalPatient();
  }, [isInRoom]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) { sendMessage(chatInput); setChatInput(''); }
  };

  // ── Loading / error screens ──────────────────────────────────────────────

  if (error && error.type === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Error en la Videollamada</h2>
          <p className="text-gray-400 mb-6 text-sm">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="bg-sky-600 text-white px-6 py-2.5 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium">Reintentar</button>
            <button onClick={() => navigate('/dashboard/professional')} className="bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">Volver</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isInitialized || isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">{!isInitialized ? 'Inicializando sala de videollamada...' : 'Preparando sesion...'}</p>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────

  const participant = participants[0];
  const isRecordingActive = isServerRecording || localRecording;

  const btnBase = { width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all 0.2s' };
const glassIdle = 'rgba(255,255,255,0.1)';
  const glassBorder = '1px solid rgba(255,255,255,0.2)';
  const glassShadow = '0 4px 20px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.12)';
  const redActive = 'rgba(200,30,30,0.6)';
  const redBorder = '1px solid rgba(239,68,68,0.3)';
  const redShadow = '0 4px 14px rgba(239,68,68,0.15),inset 0 1px 0 rgba(255,255,255,0.08)';
  const skyActive = 'linear-gradient(135deg,#0ea5e9,#0284c7)';
  const skyBorder = '1px solid rgba(14,165,233,0.5)';
  const skyShadow = '0 4px 20px rgba(14,165,233,0.4),inset 0 1px 0 rgba(255,255,255,0.15)';
  const labelStyle = { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' };

  return (
    <div className="fixed inset-0 flex bg-black overflow-hidden dark">

      {/* ── Left: Video area ─────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0 bg-gray-900 overflow-hidden">

        {/* ── Watermark ─── */}
        <img src={logoSymbol} alt="" aria-hidden="true"
          className="absolute bottom-4 right-4 z-20 pointer-events-none select-none"
          style={{ width: 48, opacity: 0.15 }}
        />

        {/* ── Full-screen remote video ─── */}
        {remoteStreams.length > 0 ? (
          remoteStreams.map(({ userId, stream }) => {
            const remoteP = participants.find(p => p.userId === userId);
            const isCameraOff = remoteP?.videoEnabled === false;
            return (
              <div key={userId} className="absolute inset-0 bg-gray-900">
                <video
                  ref={el => { if (el) { remoteVideoRefs.current.set(userId, el); if (el.srcObject !== stream) el.srcObject = stream; } }}
                  autoPlay playsInline
                  className="remote-video w-full h-full"
                  style={{ display: isCameraOff ? 'none' : 'block' }}
                />
                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}>
                        <span className="text-sky-300 text-4xl font-bold">
                          {remoteP?.userName?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm font-medium">{remoteP?.userName}</p>
                      <p className="text-white/30 text-xs mt-1 flex items-center justify-center gap-1">
                        <VideoOff className="w-3 h-3" /> Cámara desactivada
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 130px)' }}>
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${getAvatarColor(clinicalPatient?._id || clinicalPatient?.id || clinicalPatient?.userId || '')}`}>
                {(() => {
                  if (!clinicalPatient) return '?';
                  const n = clinicalPatient.nombre || clinicalPatient.firstName || '';
                  const a = clinicalPatient.apellido || clinicalPatient.lastName || '';
                  return (`${n[0] || ''}${a[0] || ''}`.toUpperCase()) || clinicalPatient.name?.[0]?.toUpperCase() || '?';
                })()}
              </div>
              <p className="text-white text-base font-medium">Esperando al paciente...</p>
              <p className="text-gray-500 text-sm mt-1">La sesión comenzará cuando se conecte</p>
            </div>
          </div>
        )}

        {/* ── Status banners — absolute top ─── */}
        <div ref={statusBannerRef} className="absolute top-0 left-0 right-0 z-50 flex flex-col">
          {error?.type === 'warning' && (
            <div className="bg-amber-600/90 text-white text-xs px-4 py-2 flex items-center justify-between backdrop-blur-sm">
              <span>{error.message}</span>
              <button onClick={() => window.location.reload()} className="ml-3 underline font-medium">Reintentar</button>
            </div>
          )}
          {countdown !== null && userLeft && (
            <div className="bg-amber-500/90 text-white text-xs px-4 py-2 flex items-center justify-between backdrop-blur-sm">
              <span className="flex items-center gap-2"><LogOut className="w-3.5 h-3.5" />{userLeft.userName} ha abandonado — termina en {countdown}s</span>
              <button onClick={() => setShowEndConfirm(true)} className="ml-3 underline font-medium">Finalizar ahora</button>
            </div>
          )}
          {isUploading && (
            <div className="bg-sky-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 backdrop-blur-sm">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Subiendo grabación…</span>
            </div>
          )}
          {recordingError && !localRecording && (
            <div className="bg-amber-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 backdrop-blur-sm">
              <span>Error de grabación: {recordingError}</span>
              <button onClick={handleRecordClick} className="ml-2 underline">Reintentar</button>
            </div>
          )}
          {uploadError && (
            <div className="bg-amber-600/90 text-white text-xs px-4 py-2 backdrop-blur-sm">{uploadError}</div>
          )}
        </div>

        {/* ── Back button + Timer — top left ─── */}
        <div className="absolute z-30 left-3 flex items-center gap-2"
          style={{ top: `calc(env(safe-area-inset-top, 0px) + ${bannerHeight + 14}px)` }}>
          <button
            onClick={handleMinimize}
            title="Minimizar llamada"
            className="flex items-center gap-1 active:scale-90 transition-transform"
            style={{
              padding: '6px 10px 6px 7px', borderRadius: 99,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              color: 'white', cursor: 'pointer',
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span style={{ fontSize: 11, fontWeight: 500 }}>Volver</span>
          </button>
          {isInRoom && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{
                background: isRecordingActive ? 'rgba(160,0,0,0.55)' : 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: isRecordingActive ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.13)',
              }}>
              {isRecordingActive
                ? <Circle className="w-2 h-2 fill-red-400 text-red-400 animate-pulse shrink-0" />
                : <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.9)' }} />}
              <span ref={durationDisplayRef} className="text-[13px] font-light text-white/85 tabular-nums" style={{ letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>00:00:00</span>
            </div>
          )}
        </div>

        {/* ── PIP local video — top right ─── */}
        <div className="absolute z-30 rounded-2xl overflow-hidden"
          style={{ top: `calc(env(safe-area-inset-top, 0px) + ${bannerHeight + 14}px)`, right: 14, width: 88, height: 120, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 28px rgba(0,0,0,0.6)' }}>
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

        {/* ── Participant name tag ─── */}
        {participant && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="absolute z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 130px)', left: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)' }}>
              <span className="text-sky-300 text-xs font-bold">{participant.userName?.charAt(0)?.toUpperCase() ?? '?'}</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">{participant.userName}</p>
              <p className="text-white/35 text-[10px]">Paciente</p>
            </div>
            {isRecordingActive && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.28)' }}>
                <Circle className="w-2 h-2 fill-red-400 animate-pulse" />
                <span className="text-red-300 text-[10px] font-medium">REC</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Controls bar ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />

          <div className="relative flex items-end justify-center gap-5 px-4 pb-6 pt-8">
            {/* Mic */}
            <button onClick={handleToggleAudio} aria-label={isAudioEnabled ? 'Silenciar' : 'Activar micrófono'}
              className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
              <div style={{ ...btnBase, background: isAudioEnabled ? glassIdle : redActive, border: isAudioEnabled ? glassBorder : redBorder, boxShadow: isAudioEnabled ? glassShadow : redShadow }}>
                {isAudioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
              </div>
              <span style={labelStyle}>{isAudioEnabled ? 'Mic' : 'Silenciado'}</span>
            </button>

            {/* Cámara */}
            <button onClick={handleToggleVideo} aria-label={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
              className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
              <div style={{ ...btnBase, background: isVideoEnabled ? glassIdle : redActive, border: isVideoEnabled ? glassBorder : redBorder, boxShadow: isVideoEnabled ? glassShadow : redShadow }}>
                {isVideoEnabled ? <VideoIcon className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
              </div>
              <span style={labelStyle}>{isVideoEnabled ? 'Cámara' : 'Sin cámara'}</span>
            </button>

            {/* Finalizar */}
            <button onClick={() => setShowEndConfirm(true)} disabled={isEndingSession}
              className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
              <div style={{ width: 62, height: 62, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: redActive, border: redBorder, boxShadow: '0 0 0 6px rgba(239,68,68,0.18),' + redShadow, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'all 0.2s' }}>
                <PhoneOff className="w-6 h-6 text-white" />
              </div>
              <span style={labelStyle}>Finalizar</span>
            </button>

            {/* Más — with popup */}
            <div className="relative" ref={moreMenuRef}>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-3 right-0 rounded-2xl overflow-hidden min-w-[160px]"
                    style={{ background: 'rgba(20,20,30,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  >
                    <button
                      onClick={() => { handleRecordClick(); setShowMoreMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/8 transition-colors text-left"
                    >
                      <Circle className={`w-4 h-4 shrink-0 ${isRecordingActive ? 'fill-red-400 text-red-400 animate-pulse' : 'text-white/60'}`} />
                      <span className="text-sm">{isRecordingActive ? 'Detener grabación' : 'Grabar'}</span>
                    </button>
                    <div className="h-px bg-white/8" />
                    <button
                      onClick={() => { setShowClinicalFile(false); setShowChat(!showChat); setShowMoreMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/8 transition-colors text-left"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-white/60" />
                      <span className="text-sm">Chat</span>
                      {chatMessages.length > 0 && !showChat && (
                        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[9px] flex items-center justify-center font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                          {chatMessages.length > 9 ? '9+' : chatMessages.length}
                        </span>
                      )}
                    </button>
                    <div className="h-px bg-white/8" />
                    <button
                      onClick={() => {
                        setShowDesktopPanel(prev => !prev);
                        handleOpenClinicalFile();
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/8 transition-colors text-left"
                    >
                      <ClipboardList className="w-4 h-4 shrink-0 text-white/60" />
                      <span className="text-sm">Expediente</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
              >
                <div style={{ ...btnBase, background: showMoreMenu ? skyActive : glassIdle, border: showMoreMenu ? skyBorder : glassBorder, boxShadow: showMoreMenu ? skyShadow : glassShadow }}>
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </div>
                <span style={labelStyle}>Más</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Chat Panel — mobile only (sm+: rendered in right panel) ─── */}
        <AnimatePresence>
          {showChat && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="sm:hidden absolute top-0 right-0 w-full h-full z-40 flex flex-col"
              style={{ paddingTop: bannerHeight, background: 'rgba(10,10,15,0.95)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">Chat de Sesión</h3>
                </div>
                <button onClick={() => setShowChat(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 rounded-full transition-colors">✕</button>
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
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/8"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                <div className="flex gap-2 items-center">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 px-4 py-2.5 bg-white/8 border border-white/10 rounded-full text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition" />
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

        {/* ── Clinical File Panel — mobile slide-in only ─── */}
        <AnimatePresence>
          {showClinicalFile && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="dark sm:hidden absolute top-0 right-0 w-full h-full z-40 overflow-hidden"
              style={{ paddingTop: bannerHeight }}>
              {clinicalPatient ? (
                <PatientClinicalFile patient={clinicalPatient} onClose={() => setShowClinicalFile(false)} />
              ) : (
                <div className="h-full flex items-center justify-center" style={{ background: '#0f1623' }}>
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Cargando expediente…</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Right: panel — swaps between clinical file and chat (sm+) ─── */}
      <div className={`dark flex-col w-[460px] shrink-0 border-l border-white/10 overflow-hidden ${showDesktopPanel ? 'hidden sm:flex' : 'hidden'}`} style={{ background: '#0f1623' }}>
        <AnimatePresence mode="wait">
          {showChat ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="flex flex-col h-full">
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/8 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">Chat de Sesión</h3>
                </div>
                <button onClick={() => setShowChat(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 rounded-full transition-colors">✕</button>
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
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/8 shrink-0">
                <div className="flex gap-2 items-center">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 px-4 py-2.5 bg-white/8 border border-white/10 rounded-full text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition" />
                  <button type="submit" disabled={!chatInput.trim()}
                    className="w-10 h-10 shrink-0 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-40 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : clinicalPatient ? (
            <motion.div key="clinical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="h-full overflow-hidden">
              <PatientClinicalFile patient={clinicalPatient} onClose={() => setShowDesktopPanel(false)} />
            </motion.div>
          ) : (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-sm">Cargando expediente…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Reconnecting overlay — covers full screen ─── */}
      <AnimatePresence>
        {isReconnecting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-1">Reconectando...</p>
              <p className="text-gray-400 text-sm">Se perdió la conexión. Intentando reconectar automáticamente.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ending session overlay — covers full screen ─── */}
      <AnimatePresence>
        {isEndingSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-base font-semibold mb-1">{isUploading ? 'Subiendo grabación…' : 'Finalizando sesión…'}</p>
              <p className="text-gray-400 text-sm">Por favor espera, no cierres esta ventana.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ─── */}

      {/* End Session */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
              style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-white mb-2">¿Finalizar Sesión?</h3>
              <p className="text-white/50 text-sm mb-4">Esto terminará la videollamada para todos los participantes.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/60 mb-2">Notas de sesión (opcional)</label>
                <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value.slice(0, 1000))} maxLength={1000}
                  placeholder="Agregar notas sobre la sesión..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none text-sm"
                  rows={3} />
                <p className="text-xs text-white/25 mt-1 text-right">{sessionNotes.length}/1000</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-white/12 text-white/60 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Cancelar</button>
                <button onClick={handleEndSession}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-medium">Finalizar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Consent */}
      <AnimatePresence>
        {showRecordingConsent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
              style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <Circle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Consentimiento de grabación</h3>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/80 leading-relaxed">
                    <p className="font-semibold mb-1">Artículo 9 LFPDPPP — Datos sensibles</p>
                    <p>La grabación contiene datos personales sensibles de salud mental. Al iniciar confirmas el <strong>consentimiento expreso e informado</strong> del paciente.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/40 mb-4">El audio se eliminará una vez completada la transcripción. Ambos participantes serán notificados.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowRecordingConsent(false)}
                  className="flex-1 px-4 py-2.5 border border-white/12 text-white/60 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Cancelar</button>
                <button onClick={handleAcceptRecordingConsent}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Circle className="w-3.5 h-3.5 fill-white" />Iniciar grabación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stop Recording Confirm */}
      <AnimatePresence>
        {showStopRecordingConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <StopCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white">¿Detener la grabación?</h3>
              </div>
              <p className="text-sm text-white/40 mb-5 leading-relaxed">Se subirá el audio capturado hasta ahora y no podrás reanudar esta grabación.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowStopRecordingConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-white/12 text-white/60 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Continuar grabando</button>
                <button onClick={handleConfirmStopRecording}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-medium">Detener</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Warning */}
      <AnimatePresence>
        {showNavigationWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <StopCircle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Grabación en curso</h3>
              </div>
              <p className="text-sm text-white/40 mb-5 leading-relaxed">Si sales ahora, la grabación se detendrá y se subirá el audio capturado hasta este momento.</p>
              <div className="flex gap-2">
                <button onClick={handleNavigationWarningCancel}
                  className="flex-1 px-4 py-2.5 border border-white/12 text-white/60 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Continuar grabando</button>
                <button onClick={handleNavigationWarningConfirm}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-sm font-medium">Salir y guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .mirror { transform: scaleX(-1); }
        .remote-video { object-fit: contain; background: #000; }
      `}</style>
    </div>
  );
};

export default ProfessionalVideoCallWebRTC;