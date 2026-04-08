import { useState, useEffect, useCallback } from 'react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { showToast } from '@shared/ui/Toast'

const loadAppointmentsFromSources = async () => {
  let allAppointments = []

  // Backend
  try {
    const response = await appointmentsService.getAllAsProf({})
    if (response.data && response.data.length > 0) {
      const backendAppointments = response.data.map(apt => {
        const [hours, minutes] = apt.time.split(':')
        const startDate = new Date(apt.date)
        startDate.setHours(parseInt(hours), parseInt(minutes), 0)
        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + apt.duration)
        return {
          id: apt._id || apt.id,
          patientName: apt.patientName,
          patientId: apt.patientId,
          type: apt.type,
          start: startDate,
          end: endDate,
          duration: String(apt.duration),
          isVideoCall: apt.isVideoCall || apt.mode === 'videollamada' || false,
          mode: apt.mode ?? (apt.isVideoCall ? 'videollamada' : 'consultorio'),
          status: apt.status,
          paymentStatus: apt.paymentStatus || apt.payment_status || null,
          notes: apt.notes,
          reason: apt.reason,
        }
      })
      allAppointments = [...backendAppointments]
    }
  } catch {
    console.warn('⚠️ Could not load from backend, using localStorage')
  }

  // sessionStorage (offline bookings — cleared on browser close)
  const savedAppointments = sessionStorage.getItem('professionalAppointments')
  if (savedAppointments) {
    try {
      const parsed = JSON.parse(savedAppointments)
      const converted = parsed.map(apt => ({
        ...apt,
        start: new Date(apt.start),
        end: new Date(apt.end),
      }))
      allAppointments = [...allAppointments, ...converted]
    } catch {
      console.warn('Failed to parse saved appointments')
    }
  }

  return allAppointments
}

const computeStats = (appointments) => {
  const now        = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const upcoming   = appointments.filter(apt => apt.start > now && apt.status !== 'cancelled')
  const completed  = appointments.filter(apt => apt.status === 'completed')
  const todayApts  = appointments.filter(apt => apt.start >= todayStart && apt.start < todayEnd && apt.status !== 'cancelled')
  const unpaid     = appointments.filter(apt => apt.paymentStatus === 'pending' || apt.status === 'reserved' || apt.status === 'accepted')
  const videoToday = todayApts.filter(apt => apt.isVideoCall || apt.mode === 'videollamada')
  return {
    upcomingAppointments: upcoming.length,
    completedSessions:    completed.length,
    totalAppointments:    appointments.length,
    todaySessions:        todayApts.length,
    unpaidCount:          unpaid.length,
    videoCallsToday:      videoToday.length,
  }
}

const persistToLocalStorage = (appointments) => {
  const toSave = appointments.filter(apt => !apt.id.toString().startsWith('demo_'))
  sessionStorage.setItem('professionalAppointments', JSON.stringify(toSave))
}

/**
 * Manages calendar appointment state: loading from backend + localStorage,
 * periodic refresh, CRUD operations, and derived stats.
 */
export const useCalendarAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({ upcomingAppointments: 0, completedSessions: 0, totalAppointments: 0, todaySessions: 0, unpaidCount: 0, videoCallsToday: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const loaded = await loadAppointmentsFromSources()
    setAppointments(loaded)
    setStats(computeStats(loaded))
    if (showLoading) setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    refresh(true)
  }, [refresh])

  // Periodic refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => refresh(false), 10000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleSelectSlot = useCallback((date) => {
    setSelectedSlot({ start: date || new Date(), end: date || new Date() })
    setSelectedAppointment(null)
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event) => {
    setSelectedAppointment(event)
    setIsModalOpen(true)
  }, [])

  const handleEventDrop = useCallback(async ({ revert, start, end, ...apt }) => {
    try {
      const id = apt._id || apt.id
      await appointmentsService.updateStatus(id, apt.status || 'reserved')
      showToast('Cita reagendada', 'success')
    } catch {
      revert?.()
      showToast('No se pudo reagendar la cita', 'error')
    }
  }, [])

  const handleSaveAppointment = useCallback((appointmentData) => {
    let updatedAppointments
    if (selectedAppointment) {
      updatedAppointments = appointments.map(apt => apt.id === appointmentData.id ? appointmentData : apt)
      showToast('Cita actualizada exitosamente', 'success')
    } else {
      updatedAppointments = [...appointments, appointmentData]
      showToast('Cita creada exitosamente', 'success')
    }
    setAppointments(updatedAppointments)
    persistToLocalStorage(updatedAppointments)
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setSelectedSlot(null)
  }, [appointments, selectedAppointment])

  const handleDeleteAppointment = useCallback((id) => {
    const updatedAppointments = appointments.filter(apt => apt.id !== id)
    setAppointments(updatedAppointments)
    persistToLocalStorage(updatedAppointments)
    showToast('Cita eliminada exitosamente', 'info')
    setIsModalOpen(false)
    setSelectedAppointment(null)
  }, [appointments])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setSelectedSlot(null)
  }, [])

  return {
    appointments,
    stats,
    loading,
    selectedAppointment,
    isModalOpen,
    selectedSlot,
    handleSelectSlot,
    handleSelectEvent,
    handleEventDrop,
    handleSaveAppointment,
    handleDeleteAppointment,
    closeModal,
  }
}
