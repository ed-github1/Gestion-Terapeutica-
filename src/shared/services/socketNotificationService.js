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
    this._pendingEmits = []    // queued while connecting
  }

  connect(userId, token) {
    // If the same user already has a socket (connected or still connecting), reuse it
    if (this.socket && this.userId === userId) return
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
      // Flush any emissions that arrived while we were still connecting
      const pending = this._pendingEmits.splice(0)
      pending.forEach(({ event, data }) => {
        this.socket.emit(event, data)
      })
    })

    this.socket.on('call-invitation', (data) => {
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

  /**
   * Patient → professional: notify that an appointment has been paid.
   * Piggybacks on the call-invitation relay so the server forwards it
   * to the professional's socket.
   */
  sendPaymentNotification(professionalUserId, appointmentData) {
    const payload = {
      targetUserId: professionalUserId,
      ...appointmentData,
      type: 'appointment-paid',
    }
    if (this.socket?.connected) {
      this.socket.emit('call-invitation', payload)
    } else {
      this._pendingEmits.push({ event: 'call-invitation', data: payload })
    }
    return true
  }

  /**
   * Patient → professional: notify that an appointment has been accepted.
   */
  sendAcceptanceNotification(professionalUserId, appointmentData) {
    const payload = {
      targetUserId: professionalUserId,
      ...appointmentData,
      type: 'appointment-accepted',
    }
    if (this.socket?.connected) {
      this.socket.emit('call-invitation', payload)
    } else {
      this._pendingEmits.push({ event: 'call-invitation', data: payload })
    }
    return true
  }

  /**
   * Patient → professional: notify that an appointment has been rejected.
   */
  sendRejectionNotification(professionalUserId, appointmentData) {
    const payload = {
      targetUserId: professionalUserId,
      ...appointmentData,
      type: 'appointment-rejected',
    }
    if (this.socket?.connected) {
      this.socket.emit('call-invitation', payload)
    } else {
      this._pendingEmits.push({ event: 'call-invitation', data: payload })
    }
    return true
  }

  /**
   * Professional → patient: send an appointment notification via socket.
   * Piggybacks on the call-invitation relay so the server forwards it
   * to the patient's socket. The receiver detects data.type and routes
   * the event to the appropriate appointment handler.
   */
  sendAppointmentNotification(targetUserId, appointmentData) {
    const payload = {
      targetUserId,
      type: 'appointment-pending',
      ...appointmentData,
    }
    if (this.socket?.connected) {
      this.socket.emit('call-invitation', payload)
    } else {
      this._pendingEmits.push({ event: 'call-invitation', data: payload })
    }
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
