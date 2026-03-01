/**
 * useAppointmentNotifications.js
 * Listens for real-time appointment events from the professional
 * via socketNotificationService and surfaces them as dismissible alerts.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { showToast } from '@shared/ui/Toast'

const EVENT_LABELS = {
  'appointment-booked':      { emoji: '📅', title: 'Nueva cita agendada',    color: 'blue'   },
  'appointment-confirmed':   { emoji: '✅', title: 'Cita confirmada',         color: 'green'  },
  'appointment-cancelled':   { emoji: '❌', title: 'Cita cancelada',          color: 'red'    },
  'appointment-rescheduled': { emoji: '🔄', title: 'Cita reprogramada',      color: 'amber'  },
}

export const useAppointmentNotifications = () => {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [lastBooking, setLastBooking] = useState(0) // bumped when pro books/confirms

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const dismissAll = useCallback(() => setAlerts([]), [])

  useEffect(() => {
    if (!user?._id && !user?.id) return

    const userId = user._id || user.id
    const token  = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    socketNotificationService.connect(userId, token)

    const addAlert = (event, data) => {
      const meta = EVENT_LABELS[event]
      const alert = {
        id:    `${event}-${Date.now()}`,
        event,
        ...meta,
        data,
        at: new Date(),
      }
      setAlerts((prev) => [alert, ...prev].slice(0, 5)) // keep at most 5
      showToast(`${meta.emoji} ${meta.title}`, event.includes('cancel') ? 'error' : 'success')
      if (event === 'appointment-booked' || event === 'appointment-confirmed') {
        setLastBooking(Date.now())
      }
    }

    const unsubs = Object.keys(EVENT_LABELS).map((ev) =>
      socketNotificationService.on(ev, (data) => addAlert(ev, data))
    )

    return () => unsubs.forEach((u) => u())
  }, [user?._id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { alerts, dismiss, dismissAll, lastBooking }
}
