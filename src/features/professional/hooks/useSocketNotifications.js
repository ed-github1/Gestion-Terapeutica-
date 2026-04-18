import { useState, useEffect, useRef, useCallback } from 'react'
import { socketNotificationService } from '@shared/services/socketNotificationService'
import { notificationsService } from '@shared/services/notificationsService'
import { showToast } from '@shared/ui'
import { useAuth } from '@features/auth'

/**
 * Subscribes to real-time socket events for appointment payments
 * and booking requests from patients.
 * Also polls the HTTP notifications endpoint as a fallback so events
 * are never silently lost when the socket connection drops.
 */
let _notifCounter = 0

const NOTIF_TYPE_MAP = {
    'appointment-paid':        { isRequest: false },
    'appointment-pending':     { isRequest: true },
    'appointment-booked':      { isRequest: true },
    'appointment-accepted':    { isAccepted: true },
    'appointment-rejected':    { isRejected: true },
    'appointment-cancelled':   { isCancelled: true },
    'appointment-rescheduled': { isRescheduled: true },
}

export const useSocketNotifications = () => {
    const { user } = useAuth()
    const isProfessional = ['professional', 'health_professional'].includes(user?.role || user?.rol)
    const [paidNotifications, setPaidNotifications] = useState([])
    const seenIds = useRef(new Set())

    // Ensure the socket is connected so the professional receives real-time events
    useEffect(() => {
        if (!isProfessional) return
        if (!user?._id && !user?.id) return
        const userId = user._id || user.id
        socketNotificationService.connect(userId)
    }, [user, isProfessional])

    // appointment-paid
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-paid', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            showToast(`${name} ha pagado su cita${dateStr ? ` del ${dateStr}` : ''}`, 'success')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    amount: data.amount,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-pending (patient-initiated booking request)
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-pending', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            const timeStr = data.time ? ` a las ${data.time}` : ''
            showToast(`📩 ${name} ha solicitado una cita${dateStr ? ` para el ${dateStr}` : ''}${timeStr}`, 'info')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    type: data.appointmentType || data.type,
                    reason: data.reason,
                    isRequest: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-booked
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-booked', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            const timeStr = data.time ? ` a las ${data.time}` : ''
            showToast(`📅 ${name} ha solicitado una cita${dateStr ? ` para el ${dateStr}` : ''}${timeStr}`, 'info')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    type: data.appointmentType || data.type,
                    reason: data.reason,
                    isRequest: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-accepted
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-accepted', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            showToast(`✅ ${name} ha aceptado la cita${dateStr ? ` del ${dateStr}` : ''}`, 'success')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    type: data.type,
                    isAccepted: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-rejected
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-rejected', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            showToast(`❌ ${name} ha rechazado la cita${dateStr ? ` del ${dateStr}` : ''}`, 'error')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    reason: data.reason,
                    isRejected: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-cancelled (patient cancelled)
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-cancelled', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            showToast(`🚫 ${name} canceló la cita${dateStr ? ` del ${dateStr}` : ''}`, 'error')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    reason: data.reason,
                    isCancelled: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // appointment-rescheduled (patient rescheduled)
    useEffect(() => {
        if (!isProfessional) return
        const unsubscribe = socketNotificationService.on('appointment-rescheduled', (data) => {
            const nId = data.appointmentId || `notif-${Date.now()}-${++_notifCounter}`
            seenIds.current.add(String(nId))
            const name = data.patientName || 'Un paciente'
            const dateStr = data.date
                ? new Date(data.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : ''
            showToast(`🔄 ${name} reprogramó su cita${dateStr ? ` al ${dateStr}` : ''}`, 'info')
            setPaidNotifications(prev => [
                {
                    id: nId,
                    patientName: name,
                    date: data.date,
                    time: data.time,
                    isRescheduled: true,
                    receivedAt: new Date(),
                },
                ...prev.slice(0, 9),
            ])
        })
        return unsubscribe
    }, [])

    // ── HTTP polling fallback ──
    // Polls the notifications endpoint every 30 s so that appointment-paid,
    // appointment-rejected, etc. show up even when the socket event was lost.
    const addFromServer = useCallback((n) => {
        const nId = n._id || n.id || n.data?.appointmentId
        if (!nId || seenIds.current.has(String(nId))) return
        seenIds.current.add(String(nId))

        const type = n.type || ''
        const flags = NOTIF_TYPE_MAP[type] || {}
        const name = n.data?.patientName || n.patientName || n.message || 'Un paciente'

        setPaidNotifications(prev => {
            if (prev.some(p => p.id === String(nId))) return prev
            return [
                {
                    id: String(nId),
                    patientName: name,
                    date: n.data?.date || n.date,
                    time: n.data?.time || n.time,
                    amount: n.data?.amount,
                    reason: n.data?.reason,
                    receivedAt: n.createdAt ? new Date(n.createdAt) : new Date(),
                    ...flags,
                },
                ...prev,
            ].slice(0, 10)
        })
    }, [])

    useEffect(() => {
        if (!isProfessional) return
        if (!user?._id && !user?.id) return

        const poll = async () => {
            try {
                const res = await notificationsService.getUnread()
                const list = res.data?.data || res.data || []
                if (!Array.isArray(list)) return
                list.forEach(addFromServer)
            } catch { /* silent — best-effort polling */ }
        }

        poll()
        const interval = setInterval(poll, 30_000)
        return () => clearInterval(interval)
    }, [user?._id, user?.id, addFromServer, isProfessional])

    return { paidNotifications, setPaidNotifications }
}
