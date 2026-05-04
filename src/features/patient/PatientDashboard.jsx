import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'

import AppointmentRequest from './AppointmentRequest'
import { useAppointmentNotifications } from './hooks/useAppointmentNotifications'
import { usePendingAppointmentCheck } from './hooks/usePendingAppointmentCheck'
import { useAppointments } from './AppointmentsContext'
import NotificationCenter from './components/NotificationCenter'
import { useTopBarSlot } from '@shared/context/TopBarSlotContext'

import NextSessionCard from './components/NextSessionCard'
import DiaryWidget from './components/DiaryWidget'
import DailyCheckInModal, { hasCheckedInToday } from './components/DailyCheckInModal'
import HomeworkGoalsWidget from './components/HomeworkGoalsWidget'
import TherapistCard from './components/TherapistCard'
import CrisisButton from './components/CrisisButton'
import AppointmentAcceptanceModal from './components/AppointmentAcceptanceModal'
import AppointmentPaymentModal from './components/AppointmentPaymentModal'

import { resolveLinkedProfessional } from '@shared/services/patientsService'
import { toLocalDateObj, endTimeOf } from '@shared/utils/appointments'

const PatientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setSlot } = useTopBarSlot()

  const [nextAppointment, setNextAppointment] = useState(null)
  const [showAppointmentRequest, setShowAppointmentRequest] = useState(false)
  const [appointmentToAccept, setAppointmentToAccept] = useState(null)
  const [appointmentToPay, setAppointmentToPay] = useState(null)
  const [professionalId, setProfessionalId] = useState(null)
  const [diaryRefreshKey, setDiaryRefreshKey] = useState(0)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [professionalUserId, setProfessionalUserId] = useState(
    () => localStorage.getItem('_linkedProUserId') || null
  )

  const {
    alerts: notifications,
    dismiss: dismissNotification,
    dismissAll: dismissAllNotifications,
    lastBooking,
    addPatientAlert,
    pendingAppointment,
    clearPendingAppointment,
  } = useAppointmentNotifications()

  const { appointments: allAppointments, loading, refresh: refreshAppointments } = useAppointments()

  // ── Notification bell in layout top bar ───────────────────────────────────

  const cbRef = useRef({ dismissNotification, dismissAllNotifications, setAppointmentToAccept })
  useEffect(() => { cbRef.current = { dismissNotification, dismissAllNotifications, setAppointmentToAccept } })

  useEffect(() => {
    setSlot(
      <NotificationCenter
        notifications={notifications}
        onDismiss={(...a) => cbRef.current.dismissNotification(...a)}
        onDismissAll={(...a) => cbRef.current.dismissAllNotifications(...a)}
        onAction={(action, data) => { if (action === 'accept') cbRef.current.setAppointmentToAccept(data) }}
      />
    )
    return () => setSlot(null)
  }, [notifications, setSlot])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const _setProUserId = (uid) => {
    if (uid) {
      setProfessionalUserId(uid)
      localStorage.setItem('_linkedProUserId', uid)
    }
  }

  const dismissedAptIds = useRef(new Set())
  const _markDismissed = (apt) => {
    const id = apt?._id || apt?.id || apt?.appointmentId || apt?.data?.appointmentId || apt?.data?._id || apt?.data?.id
    if (id) dismissedAptIds.current.add(String(id))
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  // Refresh when a professional books or confirms
  useEffect(() => {
    if (lastBooking > 0) refreshAppointments()
  }, [lastBooking]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDashboardData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive next appointment from the shared list reactively
  useEffect(() => {
    const now = new Date()
    const upcoming = allAppointments
      .filter(a => endTimeOf(a) > now && a.status !== 'cancelled')
      .sort((a, b) => toLocalDateObj(a.date, a.time) - toLocalDateObj(b.date, b.time))
    setNextAppointment(upcoming[0] || null)
    if (!professionalUserId) {
      const aptWithPro = allAppointments.find(a => a.professionalUserId)
      if (aptWithPro?.professionalUserId) _setProUserId(aptWithPro.professionalUserId)
    }
  }, [allAppointments]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refs so the pending-check hook can read current modal state without stale closures
  const appointmentToAcceptRef = useRef(appointmentToAccept)
  useEffect(() => { appointmentToAcceptRef.current = appointmentToAccept }, [appointmentToAccept])

  const appointmentToPayRef = useRef(appointmentToPay)
  useEffect(() => { appointmentToPayRef.current = appointmentToPay }, [appointmentToPay])

  // Surface any pending appointment from notifications or direct API on mount + reconnect
  usePendingAppointmentCheck({
    onPendingFound: (apt) => {
      setAppointmentToAccept(apt)
      const uid = apt?.professionalUserId || apt?.data?.professionalUserId
      if (uid) _setProUserId(uid)
    },
    dismissedIdsRef:      dismissedAptIds,
    isAcceptModalOpenRef: appointmentToAcceptRef,
    isPayModalOpenRef:    appointmentToPayRef,
  })

  // Real-time socket: professional initiates an appointment
  useEffect(() => {
    if (!pendingAppointment) return
    // Ignore appointments the patient just created themselves
    if (pendingAppointment.createdBy === 'patient') return
    const id = pendingAppointment?._id || pendingAppointment?.id ||
      pendingAppointment?.appointmentId || pendingAppointment?.data?.appointmentId
    if (id && dismissedAptIds.current.has(String(id))) return
    setAppointmentToAccept(pendingAppointment)
    const uid = pendingAppointment?.professionalUserId || pendingAppointment?.data?.professionalUserId
    if (uid) _setProUserId(uid)
  }, [pendingAppointment]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadDashboardData = async () => {
    try {
      const { professionalId: pid, professionalUserId: puid } = await resolveLinkedProfessional(user)
      if (pid)  setProfessionalId(pid)
      if (puid) _setProUserId(puid)
    } catch {}
    refreshAppointments()
  }

  // ── Appointment handlers ──────────────────────────────────────────────────

  const handleAppointmentRequestSuccess = (data) => {
    setShowAppointmentRequest(false)
    _markDismissed(data)
    addPatientAlert('request-pending', data, 'Tu solicitud fue enviada al profesional.')
    refreshAppointments()
  }

  const handleAppointmentAccepted = (apt) => {
    _markDismissed(apt)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    addPatientAlert('appointment-confirmed', apt, 'Has aceptado la cita.')
    refreshAppointments()
  }

  const handleAppointmentRejected = (apt) => {
    _markDismissed(apt)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    refreshAppointments()
  }

  const handlePaymentSuccess = (apt) => {
    _markDismissed(apt)
    setAppointmentToPay(null)
    setAppointmentToAccept(null)
    clearPendingAppointment()
    addPatientAlert('appointment-paid', apt, 'Pago completado. ¡Tu cita está confirmada!')
    refreshAppointments()
  }

  const handleJoinSession = () => {
    const id = nextAppointment?._id || nextAppointment?.id
    if (id) navigate(`/dashboard/patient/video-call/${id}`)
    else navigate('/dashboard/patient/appointments')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-transparent pb-24 md:pb-6">
      <div className="p-3 md:p-5 lg:p-6 flex flex-col gap-4 max-w-5xl mx-auto">

        <NextSessionCard
          appointment={nextAppointment}
          loading={loading}
          onJoin={handleJoinSession}
          onRequestNew={() => setShowAppointmentRequest(true)}
          onViewAppointments={() => navigate('/dashboard/patient/appointments')}
        />

        <div className="flex flex-col gap-4 md:grid md:grid-cols-5 md:gap-5 md:items-start">

          {/* Left column: tasks */}
          <div className="order-2 md:order-1 md:col-span-3 flex flex-col gap-4">
            <HomeworkGoalsWidget />
          </div>

          {/* Right column: therapist card + diary */}
          <div className="order-1 md:order-2 md:col-span-2 flex flex-col gap-4">
            <DiaryWidget />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* {showAppointmentRequest && (
          <AppointmentRequest
            onClose={() => setShowAppointmentRequest(false)}
            professionalId={
              professionalId ||
              user?.professionalId ||
              user?.professional_id ||
              user?.professional?._id ||
              null
            }
            professionalUserId={professionalUserId}
            onSuccess={handleAppointmentRequestSuccess}
            onPatientCreated={(id) => { if (id) dismissedAptIds.current.add(id) }}
          />
        )}

        {appointmentToAccept && (
          <AppointmentAcceptanceModal
            appointment={appointmentToAccept}
            professionalUserId={professionalUserId}
            onClose={() => {
              _markDismissed(appointmentToAccept)
              setAppointmentToAccept(null)
              clearPendingAppointment()
            }}
            onAccepted={handleAppointmentAccepted}
            onRejected={handleAppointmentRejected}
          />
        )}

        {appointmentToPay && (
          <AppointmentPaymentModal
            appointment={appointmentToPay}
            onClose={() => setAppointmentToPay(null)}
            onPaymentSuccess={handlePaymentSuccess}
            professionalUserId={professionalUserId}
            professionalId={
              appointmentToPay?.professionalId ||
              appointmentToPay?.professional_id ||
              professionalId ||
              user?.professionalId ||
              null
            }
          />
        )} */}
      </AnimatePresence>

      <CrisisButton />
    </div>
  )
}

export default PatientDashboard
