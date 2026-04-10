/**
 * useCallRecording — records local audio during a WebRTC call and uploads to the backend.
 *
 * Records ONLY the local audio stream (from getUserMedia), not the remote stream.
 * The server mixes both participants' uploads with FFmpeg and submits for transcription.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { videoCallService } from '@shared/services/videoCallService'

const MAX_UPLOAD_RETRIES = 3
const SAFETY_TIMEOUT_MS = 10_000

export const useCallRecording = ({ localStream, appointmentId, recordingAuthorized }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const stopResolveRef = useRef(null)
  const appointmentIdRef = useRef(appointmentId)

  // Keep appointmentId up-to-date in the ref so async callbacks use the latest value
  useEffect(() => {
    appointmentIdRef.current = appointmentId
  }, [appointmentId])

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
      } else if (stopResolveRef.current) {
        stopResolveRef.current()
        stopResolveRef.current = null
      }
    },
    [uploadBlob],
  )

  // Start recording when recording-authorized fires and localStream is available
  useEffect(() => {
    if (!recordingAuthorized || !localStream || mediaRecorderRef.current) return
    if (typeof MediaRecorder === 'undefined') {
      console.warn('[Recording] MediaRecorder API not supported — call continues without recording')
      return
    }

    const audioTracks = localStream.getAudioTracks().filter((t) => t.readyState === 'live')
    if (!audioTracks.length) return

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

      recorder.onstop = () => handleRecorderStop(recorder)

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      console.log(`[Recording] Started — mimeType: ${mimeType || 'default'}`)
    } catch (err) {
      console.error('[Recording] Failed to start MediaRecorder:', err)
    }
  }, [recordingAuthorized, localStream, handleRecorderStop])

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
    isRecordingAuthorized: recordingAuthorized,
    isRecording,
    isUploading,
    uploadError,
    stopRecording,
  }
}

export default useCallRecording
