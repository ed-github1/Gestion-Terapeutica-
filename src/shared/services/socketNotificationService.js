/**
 * shared/services/socketNotificationService.js
 *
 * Lightweight socket connection used ONLY for call-invitation signals.
 * Reuses the same /webrtc namespace as WebRTCManager but without media.
 * Falls back gracefully if the signaling server is unavailable.
 */
import { io } from 'socket.io-client'
import { getAuthToken } from '@shared/api/client'

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
    this._pendingEmits = []    // queued while connecting
  }

  connect(userId) {
    // If the same user already has a socket (connected or still connecting), reuse it
    if (this.socket && this.userId === userId) return
    this.userId = userId

    if (this.socket) this.socket.disconnect()

    this.socket = io(`${SOCKET_URL}/webrtc`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      withCredentials: true,
      auth: { token: getAuthToken() },
    })

    this.socket.on('connect', () => {
      console.log('[SocketNotificationService] connected, registering userId:', userId)
      // Register so the server knows which socket belongs to this user
      this.socket.emit('register', { userId, role: 'notification-listener' })
      // Flush any emissions that arrived while we were still connecting
      const pending = this._pendingEmits.splice(0)
      if (pending.length > 0) console.log('[SocketNotificationService] flushing', pending.length, 'pending emits')
      pending.forEach(({ event, data }) => {
        this.socket.emit(event, data)
      })
    })

    this.socket.on('call-invitation', (data) => {
      console.log('[SocketNotificationService] received call-invitation:', data)
      // Appointment notifications piggyback on call-invitation relay
      if (data?.type && data.type.startsWith('appointment-')) {
        this._emit(data.type, data)
        return
      }
      this._emit('call-invitation', data)
    })

    // Appointment lifecycle events
    this.socket.on('appointment-booked', (data) => {
      this._emit('appointment-booked', data)
    })
    this.socket.on('appointment-pending', (data) => {
      this._emit('appointment-pending', data)
    })
    this.socket.on('appointment-confirmed', (data) => {
      this._emit('appointment-confirmed', data)
    })
    this.socket.on('appointment-cancelled', (data) => {
      this._emit('appointment-cancelled', data)
    })
    this.socket.on('appointment-rescheduled', (data) => {
      this._emit('appointment-rescheduled', data)
    })
    this.socket.on('appointment-paid', (data) => {
      this._emit('appointment-paid', data)
    })
    this.socket.on('appointment-accepted', (data) => {
      this._emit('appointment-accepted', data)
    })
    this.socket.on('appointment-rejected', (data) => {
      this._emit('appointment-rejected', data)
    })

    this.socket.on('disconnect', () => {
      console.debug('[SocketNotificationService] disconnected')
    })

    this.socket.on('reconnect', () => {
      console.debug('[SocketNotificationService] reconnected')
      this._emit('reconnect', {})
    })
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  /** Professional → patient: emit a call invitation via socket */
  sendCallInvitation(patientUserId, payload) {
    const data = { targetUserId: patientUserId, ...payload }
    if (this.socket?.connected) {
      console.log('[SocketNotificationService] sending call-invitation to', patientUserId)
      this.socket.emit('call-invitation', data)
    } else {
      console.log('[SocketNotificationService] socket not ready, queuing call-invitation for', patientUserId)
      this._pendingEmits.push({ event: 'call-invitation', data })
    }
    return true
  }

  // ─── Appointment lifecycle notifications ───────────────────────────────────
  // All routed through the server's `call-invitation` relay (single relay point).
  // The receiver discriminates by `data.type`. To swap the relay event in the
  // future, only `_notifyUser` needs updating.

  /** @private — single place that knows the server relay event name */
  _notifyUser(targetUserId, type, data = {}) {
    const payload = { targetUserId, type, ...data }
    if (this.socket?.connected) {
      this.socket.emit('call-invitation', payload)
    } else {
      this._pendingEmits.push({ event: 'call-invitation', data: payload })
    }
    return true
  }

  /** Patient → professional: appointment has been paid */
  sendPaymentNotification(professionalUserId, appointmentData) {
    return this._notifyUser(professionalUserId, 'appointment-paid', appointmentData)
  }

  /** Patient → professional: appointment has been accepted */
  sendAcceptanceNotification(professionalUserId, appointmentData) {
    return this._notifyUser(professionalUserId, 'appointment-accepted', appointmentData)
  }

  /** Patient → professional: appointment has been rejected */
  sendRejectionNotification(professionalUserId, appointmentData) {
    return this._notifyUser(professionalUserId, 'appointment-rejected', appointmentData)
  }

  /** Professional → patient: new appointment is pending patient acceptance */
  sendAppointmentNotification(targetUserId, appointmentData) {
    return this._notifyUser(targetUserId, 'appointment-pending', appointmentData)
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
