/**
 * useAppointmentNotifications.js
 * Listens for real-time appointment events from the professional
 * via socketNotificationService and surfaces them as dismissible alerts.
 * Also exposes `addPatientAlert` so the dashboard can inject patient-side
 * events (e.g. 'request-pending' when the patient submits a new request).
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { showToast } from '@shared/ui/Toast'

const EVENT_LABELS = {
  // patient-side synthetic event
  'request-pending':         { emoji: '⏳', title: 'Solicitud enviada',       color: 'blue'   },
  // professional / server-pushed
  'appointment-pending':     { emoji: '📩', title: 'Nueva cita pendiente',    color: 'amber'  },
  'appointment-booked':      { emoji: '📅', title: 'Nueva cita agendada',     color: 'blue'   },
  'appointment-confirmed':   { emoji: '✅', title: 'Cita confirmada',          color: 'green'  },
  'appointment-cancelled':   { emoji: '❌', title: 'Cita cancelada',           color: 'red'    },
  'appointment-rescheduled': { emoji: '🔄', title: 'Cita reprogramada',       color: 'amber'  },
  'appointment-paid':        { emoji: '💳', title: 'Pago recibido',            color: 'green'  },
}

const SOCKET_EVENTS = [
  'appointment-pending',
  'appointment-booked',
  'appointment-confirmed',
  'appointment-cancelled',
  'appointment-rescheduled',
  'appointment-paid',
]

export const useAppointmentNotifications = () => {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [lastBooking, setLastBooking] = useState(0) // bumped when pro books/confirms
  const [pendingAppointment, setPendingAppointment] = useState(null) // appointment awaiting acceptance

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const dismissAll = useCallback(() => setAlerts([]), [])

  // Called internally for socket events AND externally for patient-initiated ones.
  const _push = useCallback((event, data, message) => {
    const meta = EVENT_LABELS[event] || { emoji: '🔔', title: event, color: 'blue' }
    const alert = {
      id:      `${event}-${Date.now()}`,
      event,
      ...meta,
      data:    data || {},
      message: message || null,
      at:      new Date(),
    }
    setAlerts((prev) => [alert, ...prev].slice(0, 10))
    if (event !== 'request-pending') {
      showToast(`${meta.emoji} ${meta.title}`, event.includes('cancel') ? 'error' : 'success')
    }
    if (event === 'appointment-booked' || event === 'appointment-confirmed' || event === 'appointment-pending' || event === 'appointment-paid') {
      setLastBooking(Date.now())
    }
    // Auto-show acceptance modal for new pending appointments
    if (event === 'appointment-pending' || event === 'appointment-booked') {
      setPendingAppointment(data)
    }
  }, [])

  /** Add a patient-side notification (e.g. 'request-pending'). */
  const addPatientAlert = useCallback((event, data, message) => {
    _push(event, data, message)
  }, [_push])

  useEffect(() => {
    if (!user?._id && !user?.id) return

    const userId = user._id || user.id
    const token  = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || ''
    socketNotificationService.connect(userId, token)

    const unsubs = SOCKET_EVENTS.map((ev) =>
      socketNotificationService.on(ev, (data) => _push(ev, data))
    )

    return () => unsubs.forEach((u) => u())
  }, [user?._id, user?.id, _push]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearPendingAppointment = useCallback(() => setPendingAppointment(null), [])

  return { alerts, dismiss, dismissAll, lastBooking, addPatientAlert, pendingAppointment, clearPendingAppointment }
}
