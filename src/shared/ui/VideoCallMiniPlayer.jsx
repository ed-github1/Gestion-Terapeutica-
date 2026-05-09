import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, PhoneOff, Maximize2, Circle } from 'lucide-react'
import { useVideoCall } from '@shared/context/VideoCallContext'

const VideoCallMiniPlayer = () => {
  const navigate = useNavigate()
  const {
    isInRoom, isMinimized,
    localStream, remoteStreams,
    isAudioEnabled, toggleAudio,
    leaveRoom,
    activeAppointmentId, activeUserRole,
    localRecording, isRecording: isServerRecording,
    setIsMinimized,
  } = useVideoCall()

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const containerRef = useRef(null)
  const dragState = useRef(null)
  const posRef = useRef(null)

  // Attach local stream — isMinimized is a dep because the video element only
  // enters the DOM when minimized; localStream may already be set at that point.
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream
      }
    }
  }, [localStream, isMinimized])

  // Attach first remote stream — same timing issue as local stream above.
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreams.length > 0) {
      const { stream } = remoteStreams[0]
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(() => {})
      }
    }
  }, [remoteStreams, isMinimized])

  // Initialize position bottom-right on first render
  useEffect(() => {
    if (!posRef.current) {
      posRef.current = {
        x: window.innerWidth - 220,
        y: window.innerHeight - 190,
      }
    }
    if (containerRef.current) {
      containerRef.current.style.left = `${posRef.current.x}px`
      containerRef.current.style.top = `${posRef.current.y}px`
    }
  }, [isMinimized])

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    dragState.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top }
    containerRef.current.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current) return
    const x = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragState.current.startX))
    const y = Math.max(0, Math.min(window.innerHeight - 170, e.clientY - dragState.current.startY))
    posRef.current = { x, y }
    containerRef.current.style.left = `${x}px`
    containerRef.current.style.top = `${y}px`
  }, [])

  const handlePointerUp = useCallback(() => {
    dragState.current = null
  }, [])

  const handleReturnToCall = useCallback(() => {
    setIsMinimized(false)
    if (activeUserRole === 'patient') {
      navigate(`/video/join/${activeAppointmentId}`)
    } else {
      navigate(`/professional/video/${activeAppointmentId}`)
    }
  }, [activeAppointmentId, activeUserRole, navigate, setIsMinimized])

  const handleEndCall = useCallback(() => {
    leaveRoom()
  }, [leaveRoom])

  if (!isInRoom || !isMinimized) return null

  const isRecordingActive = localRecording || isServerRecording

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        width: 200,
        height: 170,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
        background: '#0a0a0f',
        zIndex: 9999,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Video fills full container */}
      <div style={{ position: 'absolute', inset: 0, background: '#111' }}>
        {remoteStreams.length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Esperando...</span>
          </div>
        )}
      </div>

      {/* Local video PIP — sits above the controls overlay */}
      {localStream && (
        <div style={{
          position: 'absolute', bottom: 54, right: 6,
          width: 48, height: 64,
          borderRadius: 8, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        </div>
      )}

      {/* Recording indicator — top left */}
      {isRecordingActive && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 6px', borderRadius: 99,
          background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(8px)',
        }}>
          <Circle style={{ width: 6, height: 6, fill: 'white', color: 'white', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, color: 'white', fontWeight: 600, letterSpacing: '0.05em' }}>REC</span>
        </div>
      )}

      {/* Expand button — top right */}
      <button
        onClick={handleReturnToCall}
        title="Volver a la llamada"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 26, height: 26, borderRadius: 8,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
        }}
      >
        <Maximize2 style={{ width: 12, height: 12 }} />
      </button>

      {/* Controls overlay — gradient fade into buttons at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
        padding: '20px 12px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <button
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Silenciar' : 'Activar micrófono'}
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isAudioEnabled ? 'rgba(255,255,255,0.14)' : 'rgba(239,68,68,0.55)',
            border: isAudioEnabled ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(239,68,68,0.45)',
            boxShadow: isAudioEnabled
              ? '0 4px 14px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12)'
              : '0 4px 14px rgba(239,68,68,0.25),inset 0 1px 0 rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            color: 'white',
          }}
        >
          {isAudioEnabled
            ? <Mic style={{ width: 14, height: 14 }} />
            : <MicOff style={{ width: 14, height: 14 }} />}
        </button>

        <button
          onClick={handleEndCall}
          title="Finalizar llamada"
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(200,30,30,0.6)',
            border: '1px solid rgba(239,68,68,0.4)',
            boxShadow: '0 4px 14px rgba(239,68,68,0.25),inset 0 1px 0 rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            color: 'white',
          }}
        >
          <PhoneOff style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

export default VideoCallMiniPlayer
