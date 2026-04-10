import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Browser APIs not in jsdom ───────────────────────────────────────────────

// MediaStream
class MockMediaStream {
  constructor(tracks = []) {
    this._tracks = tracks
    this.id = Math.random().toString(36).slice(2)
  }
  getAudioTracks() { return this._tracks.filter(t => t.kind === 'audio') }
  getVideoTracks() { return this._tracks.filter(t => t.kind === 'video') }
  getTracks()      { return [...this._tracks] }
  addTrack(track)  { this._tracks.push(track) }
}
global.MediaStream = MockMediaStream

// MediaStreamTrack
class MockMediaStreamTrack {
  constructor({ kind = 'audio', readyState = 'live', label = '' } = {}) {
    this.kind = kind
    this.readyState = readyState
    this.label = label
    this.enabled = true
  }
  stop() { this.readyState = 'ended' }
}
global.MediaStreamTrack = MockMediaStreamTrack

// Helper used by tests to build live audio tracks quickly
global.makeLiveAudioTrack = () => new MockMediaStreamTrack({ kind: 'audio', readyState: 'live' })
global.makeLiveAudioStream = () => new MockMediaStream([global.makeLiveAudioTrack()])

// AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'running'
    this.sampleRate = 48000
    this._closed = false
  }
  resume()  { this.state = 'running'; return Promise.resolve() }
  close()   { this._closed = true;   return Promise.resolve() }
  createMediaStreamSource(stream) {
    return {
      stream,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }
  createMediaStreamDestination() {
    const destStream = new MockMediaStream([new MockMediaStreamTrack({ kind: 'audio' })])
    return {
      stream: destStream,
      connect: vi.fn(),
    }
  }
}
global.AudioContext = MockAudioContext
global.webkitAudioContext = MockAudioContext

// MediaRecorder
const MEDIA_RECORDER_INSTANCES = []
class MockMediaRecorder {
  constructor(stream, options = {}) {
    this.stream = stream
    this.mimeType = options.mimeType || 'audio/webm'
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
    this.onerror = null
    MEDIA_RECORDER_INSTANCES.push(this)
  }
  start(timeslice) {
    this.state = 'recording'
    this._timeslice = timeslice
  }
  stop() {
    this.state = 'inactive'
    // Emit a realistic-sized final data chunk then fire onstop
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob([new Uint8Array(1024)], { type: this.mimeType }) })
    }
    if (this.onstop) this.onstop()
  }
  /** Test helper — simulate a data chunk arriving */
  _emitData(size = 1024) {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob([new Uint8Array(size)], { type: this.mimeType }) })
    }
  }
  /** Test helper — simulate a recorder error */
  _emitError(message = 'recorder error') {
    if (this.onerror) this.onerror({ error: new Error(message) })
  }
  static isTypeSupported(mime) { return mime === 'audio/webm;codecs=opus' || mime === 'audio/webm' }
  static get instances() { return MEDIA_RECORDER_INSTANCES }
  static clearInstances() { MEDIA_RECORDER_INSTANCES.length = 0 }
}
global.MediaRecorder = MockMediaRecorder

// URL (Blob URLs)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Anchor click (download fallback)
const originalCreateElement = document.createElement.bind(document)
vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  const el = originalCreateElement(tag)
  if (tag === 'a') vi.spyOn(el, 'click').mockImplementation(() => {})
  return el
})
vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
