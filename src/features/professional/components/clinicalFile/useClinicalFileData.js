import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth'
import { diaryService } from '@shared/services/diaryService'
import { homeworkService } from '@shared/services/homeworkService'
import { patientsService } from '@shared/services/patientsService'
import { appointmentsService } from '@shared/services/appointmentsService'
import { buildMockData } from './mockData'

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

  const patientId = patient?.id || patient?._id
  const needsFullProfile = !patient?.email && !patient?.telefono && !patient?.phone

  const fetchData = useCallback(async () => {
    if (!patientId) { setIsLoading(false); return }
    setIsLoading(true); setError(null)
    try {
      const fetches = [
        diaryService.getNotes(patientId),
        homeworkService.getAll(patientId),
        appointmentsService.getAll({ status: 'completed' }),
        ...(needsFullProfile ? [patientsService.getAll({ limit: 200 })] : []),
      ]
      const results = await Promise.allSettled(fetches)
      const [notesResult, hwResult, apptResult, listResult] = results

      if (needsFullProfile && listResult?.status === 'fulfilled') {
        const raw = listResult.value?.data
        const list = raw?.data?.data ?? raw?.data ?? raw ?? []
        const arr  = Array.isArray(list) ? list : []
        const found = arr.find(p =>
          (p._id || p.id)?.toString() === patientId?.toString()
        )
        if (found) {
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
        const allAppts = Array.isArray(rawAppt) ? rawAppt
          : Array.isArray(rawAppt?.data) ? rawAppt.data
          : Array.isArray(rawAppt?.appointments) ? rawAppt.appointments
          : Array.isArray(rawAppt?.data?.data) ? rawAppt.data?.data
          : []
        const patientAppts = allAppts.filter(apt => {
          if (apt.status !== 'completed') return false
          const aptPatientId = typeof apt.patientId === 'object'
            ? (apt.patientId?._id || apt.patientId?.id)
            : apt.patientId
          return aptPatientId?.toString() === patientId?.toString()
        })
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
  }, [patientId, needsFullProfile])

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
  const pEmergency = [p.emergencyContactName, p.emergencyContactPhone].filter(Boolean).join(' · ') ||
                     p.emergencyContact || ''
  const pAge = (() => {
    if (p.age) return p.age
    if (!p.dateOfBirth) return null
    const dob  = new Date(p.dateOfBirth)
    const diff = Date.now() - dob.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  })()

  const mock = useMemo(() => buildMockData(p), [p])
  const { sessionHistory, clinicalNotes: mockClinicalNotes } = mock

  const initials    = (pFirstName?.[0] || '') + (pLastName?.[0] || '')
  const completedHW = hwTasks.filter(t => t.completed).length
  const totalHW     = Math.max(hwTasks.length, 1)
  const authorName  = user?.name || user?.email || 'Profesional'

  return {
    isLoading, error, setError,
    newNote, setNewNote, isSubmitting,
    sessionSummaries,
    p, pFirstName, pLastName, pPhone, pConcern, pEmergency, pAge,
    patientId, diaryEntries, clinicalNotes, mockClinicalNotes, hwTasks,
    sessionHistory, completedHW, totalHW, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
  }
}
