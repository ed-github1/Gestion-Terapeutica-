import { useEffect } from 'react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { notificationsService } from '@shared/services/notificationsService'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { normalizeAppointmentsResponse } from '@shared/utils/appointments'

/**
 * Runs once on mount (and again on socket reconnect) to surface any
 * professional-initiated pending appointment the patient hasn't seen yet.
 *
 * Step 1: checks the server notification inbox.
 * Step 2: falls back to scanning reserved/pending appointments directly.
 */
export function usePendingAppointmentCheck({
  onPendingFound,       // (apt) => void  — called when a pending apt is found
  dismissedIdsRef,      // ref<Set<string>> — IDs already shown/dismissed
  isAcceptModalOpenRef, // ref<any>         — truthy when accept modal is already open
  isPayModalOpenRef,    // ref<any>         — truthy when pay modal is already open
}) {
  useEffect(() => {
    const checkPending = async () => {
      // Step 1: server notification inbox
      try {
        const notifRes = await notificationsService.getUnread()
        const notifs = notifRes.data?.data || notifRes.data || []
        const pendingNotif = Array.isArray(notifs)
          ? notifs.find(n => {
              if (n.type !== 'appointment-pending') return false
              const id = n.data?.appointmentId || n.data?._id || n._id
              return id ? !dismissedIdsRef.current.has(String(id)) : true
            })
          : null
        if (pendingNotif && !isAcceptModalOpenRef.current && !isPayModalOpenRef.current) {
          onPendingFound(pendingNotif.data || pendingNotif)
          const notifId = pendingNotif._id || pendingNotif.id
          if (notifId) notificationsService.markRead(notifId).catch(() => {})
          return
        }
      } catch { /* notifications endpoint may not exist — fall through */ }

      // Step 2: fallback — scan appointments directly
      try {
        const res = await appointmentsService.getPatientAppointments()
        const all = normalizeAppointmentsResponse(res)
        const pending = all.find(a => {
          if (a.status !== 'reserved' && a.status !== 'pending') return false
          if (a.createdBy === 'patient') return false
          const id = a._id || a.id
          return id ? !dismissedIdsRef.current.has(String(id)) : true
        })
        if (pending && !isAcceptModalOpenRef.current && !isPayModalOpenRef.current) {
          onPendingFound(pending)
        }
      } catch { /* silent — best-effort */ }
    }

    checkPending()
    const unsubReconnect = socketNotificationService.on('reconnect', checkPending)
    return () => unsubReconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
