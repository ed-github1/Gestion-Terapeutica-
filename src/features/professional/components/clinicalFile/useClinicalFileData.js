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

  // Keep patientProfile in sync if the patient prop changes (e.g. async resolution)
  const patientKey = patient?._id || patient?.id || null
  useEffect(() => {
    if (patientKey) setPatientProfile(patient)
  }, [patientKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // rawPatientId may be null for appointments created without linking a patient record
  // (e.g. through QuickCreateModal which only stores a name). effectivePatientId is
  // resolved by either the prop directly or via a name-based patient search below.
  const rawPatientId = patient?.id || patient?._id || null
  const [effectivePatientId, setEffectivePatientId] = useState(rawPatientId)

  // Sync effectivePatientId if prop provides a new ID (e.g. async patient resolution)
  useEffect(() => {
    if (rawPatientId && rawPatientId !== effectivePatientId) {
      setEffectivePatientId(rawPatientId)
    }
  }, [rawPatientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const patientId     = effectivePatientId
  const patientUserId = patient?.userId || patient?.user || patientId

  // When there is no patient ID, resolve the Patient record in two steps:
  // 1. exact full-name search (fast, works when appointment has patientName)
  // 2. userId scan as fallback (works when the User document was passed instead of Patient)
  useEffect(() => {
    if (rawPatientId || effectivePatientId) return

    const firstName  = patient?.firstName || patient?.nombre || ''
    const lastName   = patient?.lastName  || patient?.apellido || ''
    const searchName = `${firstName} ${lastName}`.trim() || patient?.name || ''
    const userId     = patient?.userId || patient?.user

    if (!searchName && !userId) return

    let cancelled = false

    const applyMatch = (match) => {
      if (cancelled || !match) return
      const foundId = match._id || match.id
      if (!foundId) return
      setEffectivePatientId(foundId)
      setPatientProfile(prev => ({
        ...match,
        id: foundId, _id: foundId,
        nombre:   match.firstName  || match.nombre  || prev.nombre,
        apellido: match.lastName   || match.apellido || prev.apellido,
      }))
    }

    const byName = () => {
      if (!searchName) return Promise.resolve(null)
      return patientsService.getAll({ search: searchName, limit: 10 })
        .then(res => {
          if (cancelled) return null
          const raw  = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
          const list = Array.isArray(raw) ? raw : []
          const lower = searchName.toLowerCase()
          return list.find(p => {
            const n = `${p.firstName || p.nombre || ''} ${p.lastName || p.apellido || ''}`.toLowerCase().trim()
            return n === lower
          }) ?? null
        })
    }

    const byUserId = () => {
      if (!userId) return Promise.resolve(null)
      return patientsService.getAll({ limit: 200 })
        .then(res => {
          if (cancelled) return null
          const raw  = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
          const list = Array.isArray(raw) ? raw : []
          return list.find(p => String(p.userId || p.user || '') === String(userId)) ?? null
        })
    }

    byName()
      .then(match => match ? match : byUserId())
      .then(applyMatch)
      .catch(err => console.warn('[useClinicalFileData] patient lookup failed:', err?.message))

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
            // Use || (not ??) so a 0 from getById (which lacks the aggregation)
            // falls through to the correct value from the patient list endpoint
            totalSessions: found.totalSessions || found.completedSessions || prev.totalSessions || 0,
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
        console.log('[ClinicalFile] allAppts count:', allAppts.length, '| first appointment sample:', JSON.stringify(allAppts[0]?.patientId), '| status sample:', allAppts[0]?.status)
        console.log('[ClinicalFile] filtering with patientId:', patientId, '| resolvedUserId:', resolvedUserId, '| patientUserId:', patientUserId)
        const targets = new Set(
          [patientId, resolvedUserId, patientUserId].filter(Boolean).map(String)
        )

        // Build patient full name for fallback name-based matching
        const pNameFirst = patient?.firstName || patient?.nombre || ''
        const pNameLast  = patient?.lastName  || patient?.apellido || ''
        const patientFullName = `${pNameFirst} ${pNameLast}`.trim().toLowerCase()

        console.log('[ClinicalFile] targets set:', [...targets], '| patientFullName:', patientFullName)

        const patientAppts = allAppts.filter(apt => {
          const rawStatus = (apt.status || apt.estado || '').toLowerCase()
          if (rawStatus !== 'completed' && rawStatus !== 'completada') return false

          // ── ID-based matching ──
          const candidates = []
          const pidSources = [apt.patientId, apt.patient, apt.paciente, apt.userId, apt.user]
          for (const pid of pidSources) {
            if (pid == null) continue
            if (typeof pid === 'string') {
              candidates.push(pid)
            } else if (typeof pid === 'object') {
              if (pid._id)    candidates.push(String(pid._id))
              if (pid.id)     candidates.push(String(pid.id))
              if (pid.userId) candidates.push(String(pid.userId))
              if (pid.user)   candidates.push(String(pid.user))
            }
          }
          if (apt.patientUserId) candidates.push(String(apt.patientUserId))
          if (candidates.some(c => targets.has(c))) return true

          // ── Name-based fallback ── (covers ID mismatches between User._id and Patient._id)
          if (patientFullName) {
            const aptName = (
              apt.nombrePaciente || apt.patientName ||
              (apt.patientId && typeof apt.patientId === 'object'
                ? `${apt.patientId.firstName || apt.patientId.nombre || ''} ${apt.patientId.lastName || apt.patientId.apellido || ''}`.trim()
                : '') ||
              (apt.patient && typeof apt.patient === 'object'
                ? `${apt.patient.firstName || apt.patient.nombre || ''} ${apt.patient.lastName || apt.patient.apellido || ''}`.trim()
                : (typeof apt.patient === 'string' ? '' : ''))
            ).toLowerCase()
            if (aptName && aptName === patientFullName) return true
          }

          return false
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

  // Use the highest reliable count: backend totalSessions, client-side history, or 0
  const totalSessions = Math.max(
    p.totalSessions || 0,
    p.completedSessions || 0,
    sessionHistory.length,
  )

  const handleAssignHomework = async (formData) => {
    if (!patientId) return
    const res = await homeworkService.assign(patientId, {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      type: formData.type || 'exercise',
    })
    const saved = res.data?.data ?? res.data
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      setHwTasks(prev => [saved, ...prev])
    } else {
      await fetchData()
    }
  }

  const handleToggleHomework = async (task) => {
    const id = task._id || task.id
    const updated = { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
    await homeworkService.update(patientId, id, updated)
    setHwTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, ...updated } : t))
  }

  const handleDeleteHomework = async (task) => {
    const id = task._id || task.id
    await homeworkService.remove(patientId, id)
    setHwTasks(prev => prev.filter(t => (t._id || t.id) !== id))
  }

  return {
    isLoading, error, setError,
    newNote, setNewNote, isSubmitting,
    sessionSummaries,
    p, pFirstName, pLastName, pPhone, pConcern, pEmergency, pAge,
    patientId, diaryEntries, clinicalNotes, hwTasks,
    sessionHistory, completedHW, totalHW, totalSessions, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
    handleAssignHomework, handleToggleHomework, handleDeleteHomework,
  }
}
