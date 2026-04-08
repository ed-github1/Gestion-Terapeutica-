/**
 * features/patient/AppointmentsContext.jsx
 *
 * Single source-of-truth for the patient's appointment list.
 * All components that read or mutate appointments should go through
 * this context instead of issuing their own GET /appointments requests.
 *
 * Usage:
 *   – Wrap patient pages with <AppointmentsProvider>
 *   – Consume with the useAppointments() hook
 *
 * API:
 *   appointments  — normalised, sorted array
 *   loading       — true while the current fetch is in flight
 *   error         — error message string, or null
 *   refresh()     — re-fetches from the server; used after any mutation
 *   updateOne(id, changes) — optimistic patch for a single appointment
 *                            (use before the API call; rollback on failure
 *                            by calling updateOne again with the original)
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { normalizeAppointmentsResponse } from '@shared/utils/appointments'

const AppointmentsContext = createContext(null)

export function AppointmentsProvider({ children }) {
  // Seed immediately from localStorage so the UI renders stale data instead
  // of an empty state while the first network request is in flight.
  const [appointments, setAppointments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('patientAppointments') || '[]')
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res        = await appointmentsService.getPatientAppointments()
      const normalized = normalizeAppointmentsResponse(res)
      setAppointments(normalized)
      // Update the stale-data cache used on next mount.
      try { localStorage.setItem('patientAppointments', JSON.stringify(normalized)) } catch {}
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las citas')
      // Keep whatever is in state (could be stale localStorage data) rather
      // than wiping to an empty array — less jarring for users on flaky connections.
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount.
  useEffect(() => { refresh() }, [refresh])

  /**
   * Optimistically patch one appointment in the local list.
   * Call before the API request with the desired changes.
   * On API failure, restore by calling updateOne(id, originalAppointment).
   */
  const updateOne = useCallback((id, changes) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id || a._id === id) ? { ...a, ...changes } : a)
    )
  }, [])

  return (
    <AppointmentsContext.Provider value={{ appointments, loading, error, refresh, updateOne }}>
      {children}
    </AppointmentsContext.Provider>
  )
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext)
  if (!ctx) throw new Error('useAppointments must be used within an AppointmentsProvider')
  return ctx
}
