/**
 * useCallRecording — records local audio during a WebRTC call and uploads to the backend.
 *
 * Records ONLY the local audio stream (from getUserMedia), not the remote stream.
 * The server mixes both participants' uploads with FFmpeg and submits for transcription.
 *
 * Robustness guarantees:
 * - Handles MediaRecorder errors (onerror) — stops gracefully and uploads what was captured.
 * - Monitors audio track 'ended' events (device disconnect) — stops and uploads.
 * - Retries start when localStream arrives after enabled is already true.
 * - Stops automatically when enabled goes false (consent revoked / server stop).
 * - Fires onRecordingFailed callback so the UI can show user-visible feedback.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { videoCallService } from '@shared/services/videoCallService'

const MAX_UPLOAD_RETRIES = 3
const SAFETY_TIMEOUT_MS = 120_000

export const useCallRecording = ({ localStream, appointmentId, enabled, onRecordingFailed }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [recordingError, setRecordingError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const stopResolveRef = useRef(null)
  const appointmentIdRef = useRef(appointmentId)
  const enabledRef = useRef(enabled)

  // Keep refs in sync so async callbacks always see latest values
  useEffect(() => { appointmentIdRef.current = appointmentId }, [appointmentId])
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  // Upload blob with exponential-backoff retry for 5xx errors (up to 3 attempts)
  const uploadBlob = useCallback(async (blob) => {
    setIsUploading(true)
    setUploadError(null)

    for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt++) {
      try {
        await videoCallService.uploadRecording(appointmentIdRef.current, blob)
        setIsUploading(false)
        setUploadError(null)
        return
      } catch (err) {
        const status = err?.response?.status
        const isRetryable = !status || status >= 500
        if (isRetryable && attempt < MAX_UPLOAD_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
          continue
        }
        setUploadError(
          err?.response?.data?.message || err?.message || 'Error al subir la grabación',
        )
        setIsUploading(false)
        return
      }
    }
  }, [])

  // Internal handler: called when MediaRecorder stops (including via stopRecording)
  const handleRecorderStop = useCallback(
    (recorder) => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      chunksRef.current = []
      mediaRecorderRef.current = null
      setIsRecording(false)

      if (blob.size > 0) {
        const uploadPromise = uploadBlob(blob)
        if (stopResolveRef.current) {
          uploadPromise.then(stopResolveRef.current, stopResolveRef.current)
          stopResolveRef.current = null
        }
      } else {
        console.warn('[Recording] Stopped with empty blob — nothing to upload')
        if (stopResolveRef.current) {
          stopResolveRef.current()
          stopResolveRef.current = null
        }
      }
    },
    [uploadBlob],
  )

  // Core recorder creation — extracted so it can be called by the start effect
  const createAndStartRecorder = useCallback(() => {
    if (mediaRecorderRef.current) return // already recording
    if (typeof MediaRecorder === 'undefined') {
      console.warn('[Recording] MediaRecorder API not supported — call continues without recording')
      return
    }
    if (!localStream) return

    const audioTracks = localStream.getAudioTracks().filter((t) => t.readyState === 'live')
    if (!audioTracks.length) {
      console.warn('[Recording] No live audio tracks available')
      return
    }

    const audioStream = new MediaStream(audioTracks)

    let mimeType
    for (const mime of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
      if (MediaRecorder.isTypeSupported(mime)) {
        mimeType = mime
        break
      }
    }

    try {
      const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onerror = (e) => {
        console.error('[Recording] MediaRecorder error:', e.error || e)
        setRecordingError(e.error?.message || 'Error en la grabación de audio')
        if (onRecordingFailed) onRecordingFailed(e.error?.message || 'Error en la grabación de audio')
        // Stop will trigger onstop → upload whatever was captured
        if (recorder.state !== 'inactive') {
          try { recorder.stop() } catch { /* already stopped */ }
        }
      }

      recorder.onstop = () => handleRecorderStop(recorder)

      // Monitor audio track — if device disconnects mid-recording, stop gracefully
      const primaryTrack = audioTracks[0]
      const handleTrackEnded = () => {
        console.warn('[Recording] Audio track ended (device disconnect?) — stopping recorder')
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      }
      primaryTrack.addEventListener('ended', handleTrackEnded, { once: true })

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingError(null)
      console.log(`[Recording] Started — mimeType: ${mimeType || 'default'}`)
    } catch (err) {
      console.error('[Recording] Failed to start MediaRecorder:', err)
      setRecordingError(err.message || 'No se pudo iniciar la grabación')
      if (onRecordingFailed) onRecordingFailed(err.message)
    }
  }, [localStream, handleRecorderStop, onRecordingFailed])

  // Start recording when enabled AND localStream become available
  // Re-runs whenever either changes, so late-arriving localStream is handled
  useEffect(() => {
    if (!enabled || !localStream || mediaRecorderRef.current) return
    createAndStartRecorder()
  }, [enabled, localStream, createAndStartRecorder])

  // Stop recording when `enabled` becomes false (consent revoked, server stop, etc.)
  useEffect(() => {
    if (enabled) return
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[Recording] Stopping — enabled became false')
      mediaRecorderRef.current.stop()
    }
  }, [enabled])

  // Stop recording — returns a Promise that resolves when the upload finishes (or immediately if not recording)
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      stopResolveRef.current = resolve
      mediaRecorderRef.current.stop()
      // Safety: resolve even if onstop never fires
      setTimeout(resolve, SAFETY_TIMEOUT_MS)
    })
  }, [])

  // Cleanup on unmount: stop recorder and clear chunks
  useEffect(() => {
    return () => {
      chunksRef.current = []
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return {
    isRecordingAuthorized: enabled,
    isRecording,
    isUploading,
    uploadError,
    recordingError,
    stopRecording,
  }
}

export default useCallRecording
