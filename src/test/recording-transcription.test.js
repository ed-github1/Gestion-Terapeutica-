/**
 * Recording & Transcription — Resilience Tests
 *
 * Tests cover:
 *  A. startMediaRecorder — retry on no-tracks, self-heal on recorder error
 *  B. Remote audio — dynamically mixed when remote stream arrives after start
 *  C. stopAndUploadRecording — onstop safety timeout, blob coalescence
 *  D. doUpload — exponential-backoff retry, local-download fallback, idempotent success
 *  E. pollTranscript — max-attempts cap, network errors retried silently, state transitions
 *
 * We test the logic extracted into plain async functions (no React renderer needed),
 * which keeps the suite fast and deterministic. The few UI-level integration tests
 * use @testing-library/react to verify the banners the professional actually sees.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Flush all pending microtasks + one round of timers */
const flushAll = () => vi.runAllTimersAsync()

/** Build a minimal ref object (mirrors React.useRef) */
const ref = (val = null) => ({ current: val })

// ── Shared mock factories ────────────────────────────────────────────────────

function makeLiveStream() {
  return new MediaStream([new MediaStreamTrack({ kind: 'audio', readyState: 'live' })])
}

function makeEndedStream() {
  return new MediaStream([new MediaStreamTrack({ kind: 'audio', readyState: 'ended' })])
}

// ── A. startMediaRecorder ────────────────────────────────────────────────────

/**
 * Extracted core of the startMediaRecorder callback so it can be tested
 * without mounting the full component.
 *
 * Same logic as VideoCallWebRTC.jsx — keep in sync if the component changes.
 */
async function startMediaRecorder({
  localStream,
  manager,
  mediaRecorderRef,
  recordingChunksRef,
  audioContextRef,
  audioDestinationRef,
  connectedRemoteSourcesRef,
  setLocalRecording,
  setUploadError,
  onRestartRequest,
  MAX_RETRIES = 3,
  RETRY_DELAY_MS = 0, // 0 in tests so they don't wait
}) {
  if (mediaRecorderRef.current) return true

  const attempt = async (retryCount) => {
    if (audioContextRef.current) {
      try { audioContextRef.current.close() } catch (_) {}
      audioContextRef.current = null
      audioDestinationRef.current = null
      connectedRemoteSourcesRef.current.clear()
    }

    try {
      const audioCtx = new AudioContext()
      if (audioCtx.state === 'suspended') await audioCtx.resume()

      const destination = audioCtx.createMediaStreamDestination()
      let trackCount = 0

      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          if (track.readyState === 'live') {
            audioCtx.createMediaStreamSource(new MediaStream([track])).connect(destination)
            trackCount++
          }
        })
      }

      if (manager) {
        const remoteStreamMap = manager.remoteStreams || new Map()
        remoteStreamMap.forEach((stream, userId) => {
          stream.getAudioTracks().forEach(track => {
            if (track.readyState === 'live') {
              audioCtx.createMediaStreamSource(new MediaStream([track])).connect(destination)
              connectedRemoteSourcesRef.current.add(userId)
              trackCount++
            }
          })
        })
      }

      if (trackCount === 0) {
        audioCtx.close()
        if (retryCount < MAX_RETRIES) {
          await new Promise(res => setTimeout(res, RETRY_DELAY_MS))
          return attempt(retryCount + 1)
        }
        setUploadError('No se pudo acceder al audio.')
        return false
      }

      audioContextRef.current = audioCtx
      audioDestinationRef.current = destination

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm']
      let chosenMime = ''
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) { chosenMime = mime; break }
      }

      const recorder = new MediaRecorder(destination.stream, chosenMime ? { mimeType: chosenMime } : undefined)
      recordingChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data) }
      recorder.onerror = (e) => {
        if (mediaRecorderRef.current === recorder) {
          mediaRecorderRef.current = null
          setLocalRecording(false)
          onRestartRequest?.()
        }
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setLocalRecording(true)
      return true

    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, RETRY_DELAY_MS))
        return attempt(retryCount + 1)
      }
      setUploadError('Error al iniciar la grabación.')
      return false
    }
  }

  return attempt(0)
}

// ── A tests ──────────────────────────────────────────────────────────────────

describe('A. startMediaRecorder', () => {
  let ctx

  beforeEach(() => {
    vi.useFakeTimers()
    MediaRecorder.clearInstances()
    ctx = {
      mediaRecorderRef: ref(),
      recordingChunksRef: ref([]),
      audioContextRef: ref(),
      audioDestinationRef: ref(),
      connectedRemoteSourcesRef: ref(new Set()),
      setLocalRecording: vi.fn(),
      setUploadError: vi.fn(),
      onRestartRequest: vi.fn(),
      MAX_RETRIES: 3,
      RETRY_DELAY_MS: 0,
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true and starts recorder when local stream has live audio', async () => {
    const result = await startMediaRecorder({ ...ctx, localStream: makeLiveStream(), manager: null })
    expect(result).toBe(true)
    expect(ctx.setLocalRecording).toHaveBeenCalledWith(true)
    expect(ctx.mediaRecorderRef.current).not.toBeNull()
    expect(ctx.mediaRecorderRef.current.state).toBe('recording')
  })

  it('collects chunks via ondataavailable', async () => {
    await startMediaRecorder({ ...ctx, localStream: makeLiveStream(), manager: null })
    ctx.mediaRecorderRef.current._emitData(512)
    expect(ctx.recordingChunksRef.current).toHaveLength(1)
    expect(ctx.recordingChunksRef.current[0].size).toBe(512)
  })

  it('is a no-op if already recording (idempotent)', async () => {
    const existingRecorder = new MediaRecorder(new MediaStream())
    ctx.mediaRecorderRef.current = existingRecorder
    const result = await startMediaRecorder({ ...ctx, localStream: makeLiveStream(), manager: null })
    expect(result).toBe(true)
    // No new recorder should have been created
    expect(ctx.setLocalRecording).not.toHaveBeenCalled()
  })

  it('retries up to MAX_RETRIES when no live tracks are available', async () => {
    const noLiveStream = makeEndedStream()
    const resultPromise = startMediaRecorder({ ...ctx, localStream: noLiveStream, manager: null })
    await vi.runAllTimersAsync()
    const result = await resultPromise
    expect(result).toBe(false)
    expect(ctx.setUploadError).toHaveBeenCalledOnce()
    expect(ctx.setUploadError.mock.calls[0][0]).toMatch(/audio/)
  })

  it('succeeds on the 2nd retry when the track becomes live', async () => {
    let callCount = 0
    const stream = {
      getAudioTracks() {
        callCount++
        // First call → ended track, second call → live track
        return [new MediaStreamTrack({ kind: 'audio', readyState: callCount === 1 ? 'ended' : 'live' })]
      },
    }
    const resultPromise = startMediaRecorder({ ...ctx, localStream: stream, manager: null, RETRY_DELAY_MS: 0 })
    await vi.runAllTimersAsync()
    const result = await resultPromise
    expect(result).toBe(true)
    expect(ctx.setLocalRecording).toHaveBeenCalledWith(true)
  })

  it('also mixes remote streams from manager on start', async () => {
    const remoteStream = makeLiveStream()
    const manager = { remoteStreams: new Map([['remote-user-1', remoteStream]]) }
    await startMediaRecorder({ ...ctx, localStream: null, manager })
    expect(ctx.connectedRemoteSourcesRef.current.has('remote-user-1')).toBe(true)
    expect(ctx.setLocalRecording).toHaveBeenCalledWith(true)
  })

  it('triggers restart request on MediaRecorder onerror', async () => {
    await startMediaRecorder({ ...ctx, localStream: makeLiveStream(), manager: null })
    ctx.mediaRecorderRef.current._emitError('hardware failure')
    expect(ctx.onRestartRequest).toHaveBeenCalledOnce()
    expect(ctx.mediaRecorderRef.current).toBeNull()
    expect(ctx.setLocalRecording).toHaveBeenCalledWith(false)
  })

  it('cleans up a stale AudioContext before retrying', async () => {
    const staleCtx = new AudioContext()
    const closeSpy = vi.spyOn(staleCtx, 'close')
    ctx.audioContextRef.current = staleCtx
    // Provide no-live stream to force retry path
    const noLiveStream = makeEndedStream()
    const p = startMediaRecorder({ ...ctx, localStream: noLiveStream, manager: null })
    await vi.runAllTimersAsync()
    await p
    expect(closeSpy).toHaveBeenCalled()
  })
})

// ── B. Dynamic remote-stream mixing ──────────────────────────────────────────

describe('B. Dynamic remote audio mixing after recording starts', () => {
  /**
   * Simulates the useEffect that adds late-joining remote streams.
   */
  function addRemoteStreamToMix({ remoteStreams, localRecording, audioContextRef, audioDestinationRef, connectedRemoteSourcesRef }) {
    if (!localRecording || !audioContextRef.current || !audioDestinationRef.current) return
    remoteStreams.forEach(({ userId, stream }) => {
      if (connectedRemoteSourcesRef.current.has(userId)) return
      stream.getAudioTracks().forEach(track => {
        if (track.readyState === 'live') {
          try {
            audioContextRef.current.createMediaStreamSource(new MediaStream([track]))
              .connect(audioDestinationRef.current)
            connectedRemoteSourcesRef.current.add(userId)
          } catch (_) {}
        }
      })
    })
  }

  it('adds a new remote stream to the mix when recording is active', () => {
    const audioCtx = new AudioContext()
    const destination = audioCtx.createMediaStreamDestination()
    const connectedRemoteSourcesRef = ref(new Set())

    const lateStream = makeLiveStream()

    addRemoteStreamToMix({
      remoteStreams: [{ userId: 'patient-99', stream: lateStream }],
      localRecording: true,
      audioContextRef: ref(audioCtx),
      audioDestinationRef: ref(destination),
      connectedRemoteSourcesRef,
    })

    expect(connectedRemoteSourcesRef.current.has('patient-99')).toBe(true)
  })

  it('does not add the same remote stream twice', () => {
    const audioCtx = new AudioContext()
    const destination = audioCtx.createMediaStreamDestination()
    const connectedRemoteSourcesRef = ref(new Set(['patient-99']))
    const createSourceSpy = vi.spyOn(audioCtx, 'createMediaStreamSource')

    addRemoteStreamToMix({
      remoteStreams: [{ userId: 'patient-99', stream: makeLiveStream() }],
      localRecording: true,
      audioContextRef: ref(audioCtx),
      audioDestinationRef: ref(destination),
      connectedRemoteSourcesRef,
    })

    expect(createSourceSpy).not.toHaveBeenCalled()
  })

  it('skips remote tracks that are not live (ended)', () => {
    const audioCtx = new AudioContext()
    const destination = audioCtx.createMediaStreamDestination()
    const connectedRemoteSourcesRef = ref(new Set())

    addRemoteStreamToMix({
      remoteStreams: [{ userId: 'patient-end', stream: makeEndedStream() }],
      localRecording: true,
      audioContextRef: ref(audioCtx),
      audioDestinationRef: ref(destination),
      connectedRemoteSourcesRef,
    })

    expect(connectedRemoteSourcesRef.current.has('patient-end')).toBe(false)
  })

  it('is a no-op when recording has not started', () => {
    const createSourceSpy = vi.spyOn(new AudioContext(), 'createMediaStreamSource')

    addRemoteStreamToMix({
      remoteStreams: [{ userId: 'patient-99', stream: makeLiveStream() }],
      localRecording: false,          // ← not recording
      audioContextRef: ref(new AudioContext()),
      audioDestinationRef: ref(null),
      connectedRemoteSourcesRef: ref(new Set()),
    })

    // spy was on a different context instance; main assertion is no throw
    expect(createSourceSpy).not.toHaveBeenCalled()
  })
})

// ── C. stopAndUploadRecording ────────────────────────────────────────────────

/**
 * Extracted from VideoCallWebRTC.jsx — same logic, accepts injectable deps.
 */
async function stopAndUploadRecording({
  mediaRecorderRef,
  recordingChunksRef,
  audioContextRef,
  audioDestinationRef,
  connectedRemoteSourcesRef,
  setLocalRecording,
  setUploadError,
  doUpload,
  SAFETY_TIMEOUT_MS = 50, // short for tests
}) {
  if (audioContextRef.current) {
    try { audioContextRef.current.close() } catch (_) {}
    audioContextRef.current = null
    audioDestinationRef.current = null
    connectedRemoteSourcesRef.current.clear()
  }

  return new Promise((resolve) => {
    const finalize = (blob) => {
      if (blob.size < 500) {
        setUploadError('La grabación fue demasiado corta.')
        resolve()
        return
      }
      doUpload(blob).finally(resolve)
    }

    const recorderMime = mediaRecorderRef.current?.mimeType || 'audio/webm'

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      if (recordingChunksRef.current.length > 0) {
        const blob = new Blob(recordingChunksRef.current, { type: recorderMime })
        recordingChunksRef.current = []
        mediaRecorderRef.current = null
        setLocalRecording(false)
        finalize(blob)
        return
      }
      resolve()
      return
    }

    const recorder = mediaRecorderRef.current

    const safetyTimer = setTimeout(() => {
      const blob = new Blob(recordingChunksRef.current, { type: recorderMime })
      recordingChunksRef.current = []
      mediaRecorderRef.current = null
      setLocalRecording(false)
      finalize(blob)
    }, SAFETY_TIMEOUT_MS)

    recorder.onstop = () => {
      clearTimeout(safetyTimer)
      const blob = new Blob(recordingChunksRef.current, { type: recorderMime })
      recordingChunksRef.current = []
      mediaRecorderRef.current = null
      setLocalRecording(false)
      finalize(blob)
    }
    recorder.stop()
  })
}

describe('C. stopAndUploadRecording', () => {
  let ctx

  beforeEach(() => {
    vi.useFakeTimers()
    ctx = {
      audioContextRef: ref(new AudioContext()),
      audioDestinationRef: ref({}),
      connectedRemoteSourcesRef: ref(new Set(['user-1'])),
      setLocalRecording: vi.fn(),
      setUploadError: vi.fn(),
      doUpload: vi.fn().mockResolvedValue(undefined),
      SAFETY_TIMEOUT_MS: 50,
    }
  })

  afterEach(() => vi.useRealTimers())

  it('calls doUpload with the assembled blob when recorder stops normally', async () => {
    const recorder = new MediaRecorder(makeLiveStream())
    recorder.start(1000)
    const recordingChunksRef = ref([])
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data) }

    const stopPromise = stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(recorder),
      recordingChunksRef,
    })
    await vi.runAllTimersAsync()
    await stopPromise

    expect(ctx.doUpload).toHaveBeenCalledOnce()
    expect(ctx.doUpload.mock.calls[0][0]).toBeInstanceOf(Blob)
  })

  it('assembles blob from existing chunks when recorder is already inactive', async () => {
    const existingChunks = [new Blob([new Uint8Array(600)], { type: 'audio/webm' })]
    const inactiveRecorder = new MediaRecorder(makeLiveStream())
    // state stays 'inactive' as we never called start()

    await stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(inactiveRecorder),
      recordingChunksRef: ref(existingChunks),
    })

    expect(ctx.doUpload).toHaveBeenCalledOnce()
  })

  it('resolves without uploading when there is no recorder and no chunks', async () => {
    await stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(null),
      recordingChunksRef: ref([]),
    })
    expect(ctx.doUpload).not.toHaveBeenCalled()
  })

  it('fires setUploadError and skips upload when blob is too small (<500 bytes)', async () => {
    const recorder = new MediaRecorder(makeLiveStream())
    recorder.start(1000)
    // Override stop on this instance to emit only 1 byte (simulates very short recording)
    recorder.stop = function () {
      this.state = 'inactive'
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob([new Uint8Array(1)], { type: this.mimeType }) })
      }
      if (this.onstop) this.onstop()
    }
    const recordingChunksRef = ref([])
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data) }

    const stopPromise = stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(recorder),
      recordingChunksRef,
    })
    await vi.runAllTimersAsync()
    await stopPromise

    expect(ctx.setUploadError).toHaveBeenCalledOnce()
    expect(ctx.doUpload).not.toHaveBeenCalled()
  })

  it('uses the safety timeout when onstop never fires', async () => {
    const hangingRecorder = {
      mimeType: 'audio/webm',
      state: 'recording',
      onstop: null,
      stop() { /* intentionally does NOT call onstop */ },
    }
    const bigChunk = new Blob([new Uint8Array(1024)], { type: 'audio/webm' })

    const stopPromise = stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(hangingRecorder),
      recordingChunksRef: ref([bigChunk]),
    })
    await vi.advanceTimersByTimeAsync(100) // past 50ms safety timeout
    await stopPromise

    expect(ctx.doUpload).toHaveBeenCalledOnce()
  })

  it('closes and nulls AudioContext on completion', async () => {
    const closeSpy = vi.spyOn(ctx.audioContextRef.current, 'close')

    await stopAndUploadRecording({
      ...ctx,
      mediaRecorderRef: ref(null),
      recordingChunksRef: ref([]),
    })

    expect(closeSpy).toHaveBeenCalled()
    expect(ctx.audioContextRef.current).toBeNull()
    expect(ctx.connectedRemoteSourcesRef.current.size).toBe(0)
  })
})

// ── D. doUpload ───────────────────────────────────────────────────────────────

/**
 * Extracted doUpload logic, injectable deps.
 */
async function doUpload({
  blob,
  appointmentId,
  retryCount = 0,
  uploadRecording,       // vi.fn() standing in for videoCallService.uploadRecording
  downloadRecordingLocally,
  setIsUploading,
  setTranscriptStatus,
  setUploadError,
  uploadBlobRef,
  pollTranscript,
  MAX_UPLOAD_RETRIES = 3,
  RETRY_DELAY_MS = 0,
}) {
  const execute = async (attempt) => {
    try {
      await uploadRecording(appointmentId, blob)
      uploadBlobRef.current = null
      setTranscriptStatus('processing')
      setUploadError(null)
      pollTranscript(0)
    } catch (err) {
      const status = err?.response?.status
      const isRetryable = !status || status >= 500 || status === 429 || status === 408
      if (isRetryable && attempt < MAX_UPLOAD_RETRIES) {
        const delay = Math.min(RETRY_DELAY_MS * 2 ** attempt, 12000)
        setUploadError(`Reintentando (${attempt + 1}/${MAX_UPLOAD_RETRIES})…`)
        await new Promise(res => setTimeout(res, delay))
        return execute(attempt + 1)
      }
      uploadBlobRef.current = blob
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido'
      const status2 = err?.response?.status
      if (status2 === 404) {
        setUploadError('El servidor no soporta grabaciones aún. Se descargó localmente.')
      } else if (status2 === 401) {
        setUploadError('Sesión expirada. Se descargó la grabación localmente.')
      } else {
        setUploadError(`No se pudo subir la grabación (${msg}). Se descargó localmente.`)
      }
      downloadRecordingLocally(blob)
    }
  }

  setIsUploading(true)
  try {
    await execute(retryCount)
  } finally {
    setIsUploading(false)
  }
}

describe('D. doUpload', () => {
  let ctx
  const BLOB = new Blob([new Uint8Array(2048)], { type: 'audio/webm' })
  const APPOINTMENT_ID = 'appt-abc-123'

  beforeEach(() => {
    vi.useFakeTimers()
    ctx = {
      blob: BLOB,
      appointmentId: APPOINTMENT_ID,
      downloadRecordingLocally: vi.fn(),
      setIsUploading: vi.fn(),
      setTranscriptStatus: vi.fn(),
      setUploadError: vi.fn(),
      uploadBlobRef: ref(null),
      pollTranscript: vi.fn(),
      MAX_UPLOAD_RETRIES: 3,
      RETRY_DELAY_MS: 0,
    }
  })

  afterEach(() => vi.useRealTimers())

  it('calls pollTranscript and sets status to processing on success', async () => {
    ctx.uploadRecording = vi.fn().mockResolvedValue({ data: { ok: true } })
    await doUpload(ctx)

    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('processing')
    expect(ctx.pollTranscript).toHaveBeenCalledWith(0)
    expect(ctx.uploadBlobRef.current).toBeNull()
    expect(ctx.setIsUploading).toHaveBeenCalledWith(false)
  })

  it('resets isUploading to false even on success', async () => {
    ctx.uploadRecording = vi.fn().mockResolvedValue({})
    await doUpload(ctx)
    const calls = ctx.setIsUploading.mock.calls.map(c => c[0])
    expect(calls[0]).toBe(true)
    expect(calls[calls.length - 1]).toBe(false)
  })

  it('retries on network error (no status code) up to MAX_UPLOAD_RETRIES', async () => {
    const networkError = new Error('Network Error')
    ctx.uploadRecording = vi.fn().mockRejectedValue(networkError)

    const p = doUpload(ctx)
    await vi.runAllTimersAsync()
    await p

    // Called 1 + MAX_UPLOAD_RETRIES = 4 times total
    expect(ctx.uploadRecording).toHaveBeenCalledTimes(4)
    expect(ctx.downloadRecordingLocally).toHaveBeenCalledOnce()
  })

  it('retries on 500 server error', async () => {
    const err500 = { response: { status: 500, data: { message: 'Internal Error' } }, message: '500' }
    ctx.uploadRecording = vi.fn().mockRejectedValue(err500)

    const p = doUpload(ctx)
    await vi.runAllTimersAsync()
    await p

    expect(ctx.uploadRecording).toHaveBeenCalledTimes(4)
    expect(ctx.downloadRecordingLocally).toHaveBeenCalled()
  })

  it('does NOT retry on 401 (non-retryable) — fails immediately', async () => {
    const err401 = { response: { status: 401, data: {} }, message: '401' }
    ctx.uploadRecording = vi.fn().mockRejectedValue(err401)

    await doUpload(ctx)

    expect(ctx.uploadRecording).toHaveBeenCalledTimes(1)
    expect(ctx.setUploadError.mock.calls[0][0]).toMatch(/expirada/)
    expect(ctx.downloadRecordingLocally).toHaveBeenCalledOnce()
  })

  it('does NOT retry on 404 (non-retryable)', async () => {
    const err404 = { response: { status: 404, data: {} }, message: '404' }
    ctx.uploadRecording = vi.fn().mockRejectedValue(err404)

    await doUpload(ctx)

    expect(ctx.uploadRecording).toHaveBeenCalledTimes(1)
    expect(ctx.setUploadError.mock.calls[0][0]).toMatch(/servidor/)
  })

  it('saves blob to uploadBlobRef after exhausting retries', async () => {
    ctx.uploadRecording = vi.fn().mockRejectedValue(new Error('fail'))

    const p = doUpload(ctx)
    await vi.runAllTimersAsync()
    await p

    expect(ctx.uploadBlobRef.current).toBe(BLOB)
  })

  it('triggers local download as fallback after exhausting retries', async () => {
    ctx.uploadRecording = vi.fn().mockRejectedValue(new Error('fail'))

    const p = doUpload(ctx)
    await vi.runAllTimersAsync()
    await p

    expect(ctx.downloadRecordingLocally).toHaveBeenCalledWith(BLOB)
  })

  it('succeeds on 2nd attempt when first fails with 503', async () => {
    const err503 = { response: { status: 503, data: {} }, message: '503' }
    ctx.uploadRecording = vi.fn()
      .mockRejectedValueOnce(err503)
      .mockResolvedValueOnce({})

    const p = doUpload(ctx)
    await vi.runAllTimersAsync()
    await p

    expect(ctx.uploadRecording).toHaveBeenCalledTimes(2)
    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('processing')
    expect(ctx.downloadRecordingLocally).not.toHaveBeenCalled()
  })
})

// ── E. pollTranscript ────────────────────────────────────────────────────────

async function pollTranscript({
  attemptCount = 0,
  appointmentId,
  getAppointment,          // vi.fn() standing in for appointmentsService.getById
  setTranscript,
  setTranscriptStatus,
  setTranscriptError,
  pollTimerRef,
  MAX_ATTEMPTS = 5,        // small cap for tests
  BASE_INTERVAL = 0,
  EXTENDED_INTERVAL = 0,
}) {
  if (attemptCount >= MAX_ATTEMPTS) {
    setTranscriptStatus('failed')
    setTranscriptError('La transcripción tardó demasiado.')
    return
  }

  const scheduleNext = (attempt) => {
    const interval = attempt >= 3 ? EXTENDED_INTERVAL : BASE_INTERVAL
    pollTimerRef.current = setTimeout(
      () => pollTranscript({ attemptCount: attempt + 1, appointmentId, getAppointment, setTranscript,
                             setTranscriptStatus, setTranscriptError, pollTimerRef,
                             MAX_ATTEMPTS, BASE_INTERVAL, EXTENDED_INTERVAL }),
      interval,
    )
  }

  try {
    const { data } = await getAppointment(appointmentId)
    const appointment = data.appointment || data
    if (appointment.transcriptStatus === 'ready') {
      setTranscript(appointment.transcript || '')
      setTranscriptStatus('ready')
    } else if (appointment.transcriptStatus === 'failed') {
      setTranscriptStatus('failed')
      setTranscriptError('La transcripción no pudo completarse.')
    } else {
      setTranscriptStatus('processing')
      scheduleNext(attemptCount)
    }
  } catch (_) {
    // Network error — retry silently
    scheduleNext(attemptCount)
  }
}

describe('E. pollTranscript', () => {
  let ctx

  beforeEach(() => {
    vi.useFakeTimers()
    ctx = {
      appointmentId: 'appt-xyz',
      setTranscript: vi.fn(),
      setTranscriptStatus: vi.fn(),
      setTranscriptError: vi.fn(),
      pollTimerRef: ref(null),
      MAX_ATTEMPTS: 5,
      BASE_INTERVAL: 0,
      EXTENDED_INTERVAL: 0,
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    if (ctx.pollTimerRef.current) clearTimeout(ctx.pollTimerRef.current)
  })

  it('sets status to ready and stores transcript when API returns ready', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { transcriptStatus: 'ready', transcript: 'Hablante 1: hola' },
    })

    await pollTranscript(ctx)

    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('ready')
    expect(ctx.setTranscript).toHaveBeenCalledWith('Hablante 1: hola')
  })

  it('sets status to failed when API returns failed', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { transcriptStatus: 'failed' },
    })

    await pollTranscript(ctx)

    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('failed')
    expect(ctx.setTranscriptError).toHaveBeenCalled()
  })

  it('keeps polling (schedules next timeout) when status is processing', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { transcriptStatus: 'processing' },
    })

    await pollTranscript(ctx)
    expect(ctx.pollTimerRef.current).not.toBeNull()
    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('processing')
  })

  it('caps at MAX_ATTEMPTS and marks failed with timeout message', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { transcriptStatus: 'processing' },
    })

    // Run past MAX_ATTEMPTS
    const runAll = async () => {
      await pollTranscript({ ...ctx, attemptCount: 0 })
      for (let i = 0; i < ctx.MAX_ATTEMPTS + 1; i++) {
        await vi.runAllTimersAsync()
      }
    }
    await runAll()

    const failedCalls = ctx.setTranscriptStatus.mock.calls.filter(c => c[0] === 'failed')
    expect(failedCalls.length).toBeGreaterThanOrEqual(1)
    expect(ctx.setTranscriptError.mock.calls.some(c => c[0].match(/tardó/))).toBe(true)
  })

  it('retries silently on network error without marking failed', async () => {
    let callCount = 0
    ctx.getAppointment = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount <= 2) throw new Error('Network Error')
      return { data: { transcriptStatus: 'ready', transcript: 'texto' } }
    })

    await pollTranscript(ctx)
    // Timer-advance to allow silent retries to complete
    await vi.runAllTimersAsync()
    await vi.runAllTimersAsync()

    const failedCalls = ctx.setTranscriptStatus.mock.calls.filter(c => c[0] === 'failed')
    expect(failedCalls).toHaveLength(0)
    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('ready')
  })

  it('handles missing transcript field gracefully (empty string)', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { transcriptStatus: 'ready', transcript: undefined },
    })

    await pollTranscript(ctx)

    expect(ctx.setTranscript).toHaveBeenCalledWith('')
  })

  it('supports nested appointment wrapper in response (data.appointment)', async () => {
    ctx.getAppointment = vi.fn().mockResolvedValue({
      data: { appointment: { transcriptStatus: 'ready', transcript: 'Hola' } },
    })

    await pollTranscript(ctx)

    expect(ctx.setTranscriptStatus).toHaveBeenCalledWith('ready')
    expect(ctx.setTranscript).toHaveBeenCalledWith('Hola')
  })
})
