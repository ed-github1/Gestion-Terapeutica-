import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth'
import { diaryService } from '@shared/services/diaryService'
import { homeworkService } from '@shared/services/homeworkService'
import { patientsService } from '@shared/services/patientsService'
import { appointmentsService } from '@shared/services/appointmentsService'

export const useClinicalFileData = (patient) => {
  const { user } = useAuth()
  const [entries, setEntries]                   = useState([])
  const [hwTasks, setHwTasks]                   = useState([])
  const [sessionSummaries, setSessionSummaries] = useState([])
  const [isLoading, setIsLoading]               = useState(true)
  const [error, setError]                       = useState(null)
  const [newNote, setNewNote]                   = useState('')
  const [isSubmitting, setIsSubmitting]         = useState(false)
  const [patientProfile, setPatientProfile]     = useState(patient)

  // rawPatientId may be null for appointments created without linking a patient record
  // (e.g. through QuickCreateModal which only stores a name). effectivePatientId is
  // resolved by either the prop directly or via a name-based patient search below.
  const rawPatientId = patient?.id || patient?._id || null
  const [effectivePatientId, setEffectivePatientId] = useState(rawPatientId)

  const patientId     = effectivePatientId
  const patientUserId = patient?.userId || patient?.user || patientId

  // When there is no patient ID (name-only appointment), search /patients by full name
  // to find the linked patient record and resolve the real ID.
  useEffect(() => {
    if (rawPatientId || effectivePatientId) return  // already have an ID
    const firstName  = patient?.firstName || patient?.nombre  || ''
    const lastName   = patient?.lastName  || patient?.apellido || ''
    const searchName = `${firstName} ${lastName}`.trim()
    if (!searchName) return

    let cancelled = false
    patientsService.getAll({ search: searchName, limit: 10 })
      .then(res => {
        if (cancelled) return
        const raw  = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
        const list = Array.isArray(raw) ? raw : []
        const lower = searchName.toLowerCase()
        const match = list.find(p => {
          const n = `${p.firstName || p.nombre || ''} ${p.lastName || p.apellido || ''}`.toLowerCase().trim()
          return n === lower
        })
        if (match) {
          const foundId = match._id || match.id
          if (foundId) {
            setEffectivePatientId(foundId)
            setPatientProfile(prev => ({
              ...match,
              id: foundId, _id: foundId,
              nombre:   match.firstName  || match.nombre  || prev.nombre,
              apellido: match.lastName   || match.apellido || prev.apellido,
            }))
          }
        }
      })
      .catch(err => console.warn('[useClinicalFileData] name-based patient lookup failed:', err?.message))
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPatientId, effectivePatientId])

  const fetchData = useCallback(async () => {
    if (!effectivePatientId) { setIsLoading(false); return }
    setIsLoading(true); setError(null)
    try {
      const fetches = [
        diaryService.getNotes(patientId),
        homeworkService.getAll(patientId),
        appointmentsService.getAllAsProf(),
        // Always fetch the full profile — the patient prop from the list is always
        // a thin normalizePatient() object missing dateOfBirth, gender, emergencyContact, userId
        patientsService.getById(patientId),
      ]
      const results = await Promise.allSettled(fetches)
      const [notesResult, hwResult, apptResult, profileResult] = results

      // Resolve full profile FIRST so we have the real userId for appointment filtering
      let resolvedUserId = patientUserId
      if (profileResult?.status === 'fulfilled') {
        const raw = profileResult.value?.data
        const found = raw?.data ?? raw ?? null
        console.log('[ClinicalFile] profile found object:', found)
        if (found && typeof found === 'object' && !Array.isArray(found)) {
          // Extract the real userId — appointments are indexed by this, not patient._id
          const rawUserId = found.userId || found.user
          console.log('[ClinicalFile] found.userId:', found.userId, '| found.user:', found.user, '| resolvedUserId will be:', rawUserId)
          if (rawUserId) {
            resolvedUserId = typeof rawUserId === 'object' ? (rawUserId._id || rawUserId.id || rawUserId) : rawUserId
          }
          setPatientProfile(prev => ({
            ...found,
            id:       found._id || found.id || patientId,
            nombre:   found.firstName  || found.nombre  || prev.nombre,
            apellido: found.lastName   || found.apellido || prev.apellido,
            email:    found.email      || prev.email,
            telefono: found.phone      || found.telefono || prev.telefono,
            phone:    found.phone      || prev.phone,
            age:      found.dateOfBirth
              ? Math.floor((Date.now() - new Date(found.dateOfBirth)) / 3.156e10)
              : (prev.age ?? null),
            treatmentGoal: found.presentingConcern || found.treatmentGoal || prev.treatmentGoal,
          }))
        }
      } else {
        // GET /patients/:id not supported — use prop data as-is (normalizePatient now preserves all fields)
        console.warn('[useClinicalFileData] getById unavailable, using prop data:', profileResult?.reason?.message)
      }

      if (notesResult.status === 'fulfilled') {
        const rawNotes = notesResult.value?.data
        const list = Array.isArray(rawNotes)      ? rawNotes
          : Array.isArray(rawNotes?.data)         ? rawNotes.data
          : Array.isArray(rawNotes?.notes)        ? rawNotes.notes
          : []
        setEntries(list)
      } else {
        console.error('Error fetching diary notes:', notesResult.reason)
        setError('No se pudieron cargar las entradas del diario.')
      }

      if (hwResult.status === 'fulfilled') {
        const rawHw = hwResult.value?.data
        setHwTasks(
          Array.isArray(rawHw)         ? rawHw
          : Array.isArray(rawHw?.data) ? rawHw.data
          : []
        )
      } else {
        console.warn('Homework endpoint unavailable:', hwResult.reason?.message)
      }

      if (apptResult?.status === 'fulfilled') {
        const rawAppt = apptResult.value?.data
        console.log('[ClinicalFile] appointments raw response:', rawAppt)
        const allAppts = Array.isArray(rawAppt) ? rawAppt
          : Array.isArray(rawAppt?.data) ? rawAppt.data
          : Array.isArray(rawAppt?.appointments) ? rawAppt.appointments
          : Array.isArray(rawAppt?.data?.data) ? rawAppt.data?.data
          : Array.isArray(rawAppt?.data?.appointments) ? rawAppt.data.appointments
          : []
        console.log('[ClinicalFile] allAppts count:', allAppts.length, '| first patientId sample:', allAppts[0]?.patientId)
        console.log('[ClinicalFile] filtering with patientId:', patientId, 'OR resolvedUserId:', resolvedUserId, 'OR patientUserId:', patientUserId)
        const targets = new Set(
          [patientId, resolvedUserId, patientUserId].filter(Boolean).map(String)
        )
        const patientAppts = allAppts.filter(apt => {
          if (apt.status !== 'completed') return false
          const pid = apt.patientId
          const candidates = []
          if (pid != null) {
            if (typeof pid === 'string') {
              candidates.push(pid)
            } else if (typeof pid === 'object') {
              // populated object — collect every ID-like field
              if (pid._id)    candidates.push(String(pid._id))
              if (pid.id)     candidates.push(String(pid.id))
              if (pid.userId) candidates.push(String(pid.userId))
              if (pid.user)   candidates.push(String(pid.user))
            }
          }
          return candidates.some(c => targets.has(c))
        })
        console.log('[ClinicalFile] matched appointments:', patientAppts.length)
        patientAppts.sort((a, b) =>
          new Date(b.callStartedAt || b.fechaHora || b.date) - new Date(a.callStartedAt || a.fechaHora || a.date)
        )
        setSessionSummaries(patientAppts)
      }
    } catch (err) {
      console.error('Error loading clinical file:', err)
      setError('No se pudieron cargar los datos del expediente.')
    } finally {
      setIsLoading(false)
    }
  }, [effectivePatientId, patientUserId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !patientId || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await diaryService.addNote(patientId, {
        text: newNote.trim(),
        notes: newNote.trim(),
        author: user?.name || user?.email || 'Profesional',
      })
      const saved = res.data?.data ?? res.data
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        setEntries(prev => [saved, ...prev])
      } else {
        await fetchData()
      }
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
      setError('Error al guardar la nota. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntryUpdate = (updated) => {
    setEntries(prev => prev.map(e =>
      (e._id || e.id) === (updated._id || updated.id) ? updated : e
    ))
  }

  // Derived
  const diaryEntries  = entries.filter(e => e.mood)
  const clinicalNotes = entries.filter(e => !e.mood && (e.text || e.notes))

  const p = patientProfile
  const pFirstName = p.firstName || p.nombre || p.name?.split(' ')[0] || ''
  const pLastName  = p.lastName  || p.apellido || p.name?.split(' ').slice(1).join(' ') || ''
  const pPhone     = p.phone     || p.telefono || ''
  const pConcern   = p.presentingConcern || p.treatmentGoal || p.reason || ''
  const pEmergency = (() => {
    const ec = p.emergencyContact
    if (ec && typeof ec === 'object') {
      return [ec.name, ec.phone].filter(Boolean).join(' · ')
    }
    return [p.emergencyContactName, p.emergencyContactPhone].filter(Boolean).join(' · ') ||
           (typeof ec === 'string' ? ec : '')
  })()
  const pAge = (() => {
    if (p.age) return p.age
    if (!p.dateOfBirth) return null
    const dob  = new Date(p.dateOfBirth)
    const diff = Date.now() - dob.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  })()

  // Build real session history from completed appointments
  const sessionHistory = useMemo(() =>
    sessionSummaries.map((appt, i) => {
      const dateStr = appt.callStartedAt || appt.fechaHora || appt.date
      const isVideo = appt.isVideoCall || appt.mode === 'videollamada'
      const dur = appt.callDuration && appt.callDuration > 0
        ? Math.round(appt.callDuration)
        : (appt.duration || 50)
      return {
        id: appt._id || appt.id || `s${i}`,
        number: sessionSummaries.length - i,
        date: dateStr,
        duration: dur,
        type: isVideo ? 'Videollamada' : 'Presencial',
        mood: appt.moodRating || appt.mood || '—',
      }
    }),
    [sessionSummaries]
  )

  const initials    = (pFirstName?.[0] || '') + (pLastName?.[0] || '')
  const completedHW = hwTasks.filter(t => t.completed).length
  const totalHW     = Math.max(hwTasks.length, 1)
  const authorName  = user?.name || user?.email || 'Profesional'

  return {
    isLoading, error, setError,
    newNote, setNewNote, isSubmitting,
    sessionSummaries,
    p, pFirstName, pLastName, pPhone, pConcern, pEmergency, pAge,
    patientId, diaryEntries, clinicalNotes, hwTasks,
    sessionHistory, completedHW, totalHW, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
  }
}
