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
    // Tracks IDs surfaced this session so reconnects don't re-open the same modal
    // before the user has had a chance to dismiss/accept it.
    const surfacedIds = new Set()

    const checkPending = async () => {
      // Step 1: server notification inbox
      try {
        const notifRes = await notificationsService.getUnread()
        const notifs = notifRes.data?.data || notifRes.data || []
        const pendingNotif = Array.isArray(notifs)
          ? notifs.find(n => {
              if (n.type !== 'appointment-pending') return false
              const id = n.data?.appointmentId || n.data?._id || n._id
              if (!id) return true
              const idStr = String(id)
              return !dismissedIdsRef.current.has(idStr) && !surfacedIds.has(idStr)
            })
          : null
        if (pendingNotif && !isAcceptModalOpenRef.current && !isPayModalOpenRef.current) {
          const id = pendingNotif.data?.appointmentId || pendingNotif.data?._id || pendingNotif._id
          if (id) surfacedIds.add(String(id))
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
        const NEEDS_ACTION = new Set(['reserved', 'pending'])
        const pending = all.find(a => {
          if (!NEEDS_ACTION.has(a.status)) return false
          if (a.createdBy === 'patient') return false
          const id = a._id || a.id
          if (!id) return true
          const idStr = String(id)
          return !dismissedIdsRef.current.has(idStr) && !surfacedIds.has(idStr)
        })
        if (pending && !isAcceptModalOpenRef.current && !isPayModalOpenRef.current) {
          const id = pending._id || pending.id
          if (id) surfacedIds.add(String(id))
          onPendingFound(pending)
        }
      } catch { /* silent — best-effort */ }
    }

    checkPending()
    const unsubReconnect = socketNotificationService.on('reconnect', checkPending)
    return () => unsubReconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
