/**
 * shared/services/socketNotificationService.js
 *
 * Lightweight socket connection used ONLY for call-invitation signals.
 * Reuses the same /webrtc namespace as WebRTCManager but without media.
 * Falls back gracefully if the signaling server is unavailable.
 */
import { io } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://totalmentegestionterapeutica.onrender.com')

class SocketNotificationService {
  constructor() {
    this.socket = null
    this.userId = null
    this.token = null
    this.listeners = new Map() // event → Set<callback>
  }

  connect(userId, token) {
    if (this.socket?.connected && this.userId === userId) return
    this.userId = userId
    this.token = token

    if (this.socket) this.socket.disconnect()

    this.socket = io(`${SOCKET_URL}/webrtc`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      withCredentials: true,
      auth: { token },
    })

    this.socket.on('connect', () => {
      // Register so the server knows which socket belongs to this user
      this.socket.emit('register', { userId, role: 'notification-listener' })
    })

    this.socket.on('call-invitation', (data) => {
      this._emit('call-invitation', data)
    })

    this.socket.on('disconnect', () => {
      console.debug('[SocketNotificationService] disconnected')
    })
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  /** Professional → patient: emit a call invitation via socket */
  sendCallInvitation(patientUserId, payload) {
    if (!this.socket?.connected) {
      console.warn('[SocketNotificationService] not connected, cannot send invitation')
      return false
    }
    this.socket.emit('call-invitation', { targetUserId: patientUserId, ...payload })
    return true
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(cb)
    return () => this.listeners.get(event)?.delete(cb) // return unsubscribe fn
  }

  _emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }
}

// Singleton — shared across the whole app
export const socketNotificationService = new SocketNotificationService()
