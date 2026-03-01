/**
 * PatientClinicalFile.jsx
 * Full-featured clinical file drawer for a professional to review
 * a patient's diary entries, homework tasks, session notes, and treatment summary.
 *
 * Uses rich mock data when real API data is unavailable (offline-first).
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, BookOpen, ClipboardList, FileText,
  CheckCircle2, Circle, ShieldAlert, Calendar, Clock, Target,
  Activity, Smile, Frown, Meh, AlertCircle, ChevronLeft, ChevronRight,
  Hash, MessageSquare, Dumbbell, Star, Pencil, User, Mail, Phone,
  BarChart2, Zap, Heart, Wind, Moon, Sun, Coffee, Send, Plus,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { diaryService } from '@shared/services/diaryService'
import { homeworkService } from '@shared/services/homeworkService'

// ─── Palette helpers ──────────────────────────────────────────────────────────
const avatarPalette = [
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-emerald-600',
  'from-sky-500 to-sky-600',
  'from-rose-500 to-rose-600',
  'from-amber-400 to-amber-500',
  'from-cyan-500 to-cyan-600',
]
const getGradient = (id) => {
  const n = typeof id === 'number' ? id : String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return avatarPalette[n % avatarPalette.length]
}
const getInitials = (nombre, apellido) => `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()

// ─── Mock data factory ────────────────────────────────────────────────────────
const MOOD_META = {
  '😊': { label: 'Bien',     bg: 'bg-emerald-100',  text: 'text-emerald-700', score: 8 },
  '😄': { label: 'Excelente',bg: 'bg-green-100',     text: 'text-green-700',   score: 10 },
  '😐': { label: 'Regular',  bg: 'bg-yellow-100',   text: 'text-yellow-700',  score: 5 },
  '😔': { label: 'Triste',   bg: 'bg-blue-100',     text: 'text-blue-700',    score: 3 },
  '😣': { label: 'Dolor',    bg: 'bg-red-100',      text: 'text-red-700',     score: 2 },
  '😴': { label: 'Cansado',  bg: 'bg-sky-100',   text: 'text-sky-600',  score: 4 },
  '😰': { label: 'Ansioso',  bg: 'bg-orange-100',   text: 'text-orange-700',  score: 3 },
}

const HOMEWORK_TYPES = {
  exercise:   { label: 'Ejercicio',  icon: Dumbbell, bg: 'bg-emerald-100 text-emerald-700' },
  reading:    { label: 'Lectura',    icon: BookOpen,  bg: 'bg-blue-100 text-blue-700' },
  journaling: { label: 'Diario',     icon: Pencil,    bg: 'bg-sky-100 text-sky-600' },
  reflection: { label: 'Reflexión',  icon: Star,      bg: 'bg-amber-100 text-amber-700' },
  breathing:  { label: 'Respiración',icon: Wind,      bg: 'bg-cyan-100 text-cyan-700'   },
  other:      { label: 'Otro',       icon: ClipboardList, bg: 'bg-gray-100 text-gray-700' },
}

// Seeded randomish helper — deterministic per patient id
const seededInt = (seed, min, max) => {
  const s = ((seed * 9301 + 49297) % 233280) / 233280
  return min + Math.floor(s * (max - min + 1))
}

const buildMockData = (patient) => {
  const seed = typeof patient.id === 'number'
    ? patient.id
    : String(patient.id).charCodeAt(0) + String(patient.id).charCodeAt(1 ) || 7

  // Diary entries (patient-side)
  const moods = Object.keys(MOOD_META)
  const diaryEntries = [
    {
      id: 'd1',   type: 'patient',
      mood: moods[seededInt(seed, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      notes: 'Hoy me sentí más tranquilo después de la sesión. Practiqué los ejercicios de respiración por la mañana.',
      activities: 'Salir a caminar 30 min',
      symptoms: null,
      energy: 7, sleep: 7,
    },
    {
      id: 'd2',   type: 'patient',
      mood: moods[seededInt(seed + 1, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: 'Noche difícil. Pensamientos intrusivos. Apliqué la técnica de reestructuración cognitiva.',
      activities: null,
      symptoms: 'Insomnio leve',
      energy: 4, sleep: 4,
    },
    {
      id: 'd3',   type: 'patient',
      mood: moods[seededInt(seed + 2, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      notes: 'Buena semana en general. Conecté con amigos y me ayudó mucho.',
      activities: 'Reunión social, ejercicio',
      symptoms: null,
      energy: 8, sleep: 8,
    },
    {
      id: 'd4',   type: 'patient',
      mood: moods[seededInt(seed + 3, 0, moods.length - 1)],
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      notes: 'Situación estresante en el trabajo. Dificultades concentrarme.',
      activities: null,
      symptoms: 'Tensión muscular',
      energy: 3, sleep: 5,
    },
    {
      id: 'd5',   type: 'patient',
      mood: '😊',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      notes: 'Completé las tareas asignadas. Me sentí bien al hacerlo.',
      activities: 'Lectura 20 min, meditación',
      symptoms: null,
      energy: 8, sleep: 9,
    },
  ]

  // Clinical notes (professional-side)
  const clinicalNotes = [
    {
      id: 'n1', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: 'Profesional', sessionNumber: patient.totalSessions || 1,
      text: `Sesión de seguimiento. El paciente reporta mejoría subjetiva en el manejo de la ansiedad. Se trabaja el registro de pensamientos automáticos con buena adherencia. Se propone continuar exposición gradual la próxima semana.`,
      tags: ['TCC', 'Exposición', 'Registro cognitivo'],
    },
    {
      id: 'n2', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      author: 'Profesional', sessionNumber: Math.max(1, (patient.totalSessions || 3) - 1),
      text: `Se revisa plan de seguridad. El paciente describe episodio de crisis leve que manejó de forma autónoma. Refuerzo positivo. Se ajusta la frecuencia de sesiones a semanal.`,
      tags: ['Plan de seguridad', 'Crisis', 'Ajuste de tratamiento'],
    },
    {
      id: 'n3', type: 'clinical',
      date: new Date(Date.now() - 86400000 * 16).toISOString(),
      author: 'Profesional', sessionNumber: Math.max(1, (patient.totalSessions || 4) - 2),
      text: `Evaluación inicial. Diagnóstico provisional. Se plantean objetivos terapéuticos y se explica el modelo cognitivo-conductual.`,
      tags: ['Evaluación', 'GAD-7', 'Psicoeducación'],
    },
  ]

  // Homework tasks
  const types = Object.keys(HOMEWORK_TYPES)
  const homeworkTasks = [
    {
      id: 'h1', type: types[seededInt(seed, 0, types.length - 1)],
      title: 'Registro de pensamientos automáticos',
      description: 'Anotar 3 pensamientos negativos diarios y sus alternativas racionales usando la hoja de registro TCC.',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      assignedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'h2', type: 'breathing',
      title: 'Práctica de respiración diafragmática',
      description: '10 minutos cada mañana al despertar siguiendo el audio enviado. Registrar nivel de ansiedad antes y después (escala 0-10).',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      completed: false,
      completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'h3', type: 'exercise',
      title: 'Activación conductual: actividad placentera',
      description: 'Realizar una actividad que solía disfrutar (30 min mínimo). Registrar humor antes y después.',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      assignedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'h4', type: 'reading',
      title: 'Lectura: capítulo 3 "El cerebro ansioso"',
      description: 'Leer el capítulo asignado y anotar los conceptos que más resuenen con su experiencia personal.',
      dueDate: new Date(Date.now() - 86400000 * 1).toISOString(), // overdue
      completed: false,
      completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: 'h5', type: 'journaling',
      title: 'Diario de gratitud',
      description: 'Escribir 3 cosas positivas del día cada noche antes de dormir. Duración: 2 semanas.',
      dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      completed: false,
      completedAt: null,
      assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  // Session history
  const sessionHistory = Array.from({ length: Math.min(patient.totalSessions || 5, 8) }, (_, i) => ({
    id: `s${i + 1}`,
    number: (patient.totalSessions || 5) - i,
    date: new Date(Date.now() - 86400000 * 7 * (i + 1)).toISOString(),
    duration: [50, 55, 60][i % 3],
    type: ['Presencial', 'Videollamada', 'Presencial'][i % 3],
    mood: seededInt(seed + i, 3, 9),
  }))

  return { diaryEntries, clinicalNotes, homeworkTasks, sessionHistory }
}

// ─── Mood Bar ─────────────────────────────────────────────────────────────────
const MoodBar = ({ value, max = 10 }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          value >= 7 ? 'bg-emerald-400' : value >= 4 ? 'bg-amber-400' : 'bg-rose-400'
        }`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
    <span className="text-[10px] text-gray-400 font-medium w-4 text-right">{value}</span>
  </div>
)

// ─── Relative date ────────────────────────────────────────────────────────────
const rel = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7)  return `Hace ${diff}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'caratula', label: 'Carátula',       icon: User        },
  { key: 'summary',  label: 'Evolución',      icon: BarChart2   },
  { key: 'diary',    label: 'Diario',         icon: BookOpen    },
  { key: 'homework', label: 'Tareas',          icon: ClipboardList },
  { key: 'notes',    label: 'Notas clínicas', icon: FileText    },
  { key: 'sessions', label: 'Historial',      icon: Calendar    },
]

// ─── Badge component ──────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const t = HOMEWORK_TYPES[type] || HOMEWORK_TYPES.other
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.bg}`}>
      <Icon className="w-2.5 h-2.5" /> {t.label}
    </span>
  )
}

// ─── Severity label ───────────────────────────────────────────────────────────
// ─── Main component ───────────────────────────────────────────────────────────
const PatientClinicalFile = ({ patient, onClose }) => {
  const { user } = useAuth()
  const [tab, setTab]                   = useState('caratula')
  const [entries, setEntries]           = useState([])
  const [hwTasks, setHwTasks]           = useState([])
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState(null)
  const [newNote, setNewNote]           = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const patientId = patient?.id || patient?._id

  const fetchData = useCallback(async () => {
    if (!patientId) { setIsLoading(false); return }
    setIsLoading(true); setError(null)
    try {
      const [notesRes, hwRes] = await Promise.all([
        diaryService.getNotes(patientId),
        homeworkService.getAll(patientId),
      ])
      const rawNotes = notesRes.data
      setEntries(
        Array.isArray(rawNotes) ? rawNotes
        : Array.isArray(rawNotes?.data) ? rawNotes.data
        : Array.isArray(rawNotes?.notes) ? rawNotes.notes
        : []
      )
      const rawHw = hwRes.data
      setHwTasks(
        Array.isArray(rawHw) ? rawHw
        : Array.isArray(rawHw?.data) ? rawHw.data
        : []
      )
    } catch (err) {
      console.error('Error fetching clinical file:', err)
      setError('No se pudieron cargar los datos del expediente.')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

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

  // ── Derived from real data
  const diaryEntries  = entries.filter(e => e.mood)
  const clinicalNotes = entries.filter(e => !e.mood && (e.text || e.notes))

  // ── Keep mock only for session history (no API yet)
  const mock = useMemo(() => buildMockData(patient), [patient])
  const { sessionHistory, clinicalNotes: mockClinicalNotes } = mock

  const grad      = getGradient(patient.id)
  const initials  = getInitials(
    patient.nombre || patient.name?.split(' ')[0],
    patient.apellido || patient.name?.split(' ').slice(1).join(' ')
  )
  const completedHW = hwTasks.filter(t => t.completed).length
  const totalHW     = Math.max(hwTasks.length, 1)

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-stretch justify-end"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 42, mass: 0.9 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-gray-50 shadow-2xl flex flex-col overflow-hidden"
          style={{ width: 'min(860px, 100vw)', height: '100dvh' }}
        >
          {/* ── Top header ─────────────────────────────────────────────── */}
          <div className={`bg-linear-to-r ${grad} px-6 pt-6 pb-0 shrink-0`}>
            {/* Back + close */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={onClose} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition">
                <ChevronLeft className="w-4 h-4" /> Carga de pacientes
              </button>
              <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient identity */}
            <div className="flex items-end gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center text-white text-xl font-black shrink-0 ring-2 ring-white/30">
                {initials}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-xl font-black text-white truncate">
                  {patient.nombre} {patient.apellido}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {patient.diagnosis && patient.diagnosis !== 'Pendiente' && (
                    <span className="text-xs font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                      {patient.diagnosis}
                    </span>
                  )}
                  {patient.age && (
                    <span className="text-xs text-white/70">{patient.age} años</span>
                  )}
                  {patient.riskLevel === 'high' && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      <ShieldAlert className="w-3 h-3" /> Alto riesgo
                    </span>
                  )}
                  {patient.riskLevel === 'medium' && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Riesgo medio
                    </span>
                  )}
                </div>
              </div>
              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-3 pb-1 shrink-0">
                {[
                  { value: patient.totalSessions ?? sessionHistory.length, label: 'Sesiones' },
                  { value: `${completedHW}/${totalHW}`, label: 'Tareas' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-lg font-black text-white leading-none">{value}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wide mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    tab === key
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="p-5 md:p-7"
              >
                {/* ── SUMMARY ─────────────────────────────────────────── */}
                {/* Global loading skeleton */}
                {isLoading && (
                  <div className="space-y-3 p-5">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CARÁTULA ──────────────────────────────────────────── */}
                {tab === 'caratula' && !isLoading && (
                  <div className="space-y-5">
                    {/* Datos del paciente */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-5">
                        <h3 className="font-bold text-gray-900">Datos del paciente</h3>
                        <button
                          onClick={() => setTab('notes')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nueva sesión
                        </button>
                      </div>
                      <div className="space-y-3 divide-y divide-gray-50">
                        {[
                          { label: 'Nombre',                 value: `${patient.nombre || patient.name?.split(' ')[0] || ''} ${patient.apellido || patient.name?.split(' ').slice(1).join(' ') || ''}`.trim() || '—' },
                          { label: 'Edad',                   value: patient.age ? `${patient.age} años` : '—' },
                          { label: 'Género',                 value: patient.gender || '—' },
                          { label: 'Email',                  value: patient.email || '—' },
                          { label: 'Teléfono',               value: patient.telefono || '—' },
                          { label: 'Contacto de emergencia', value: patient.emergencyContact || '—' },
                          { label: 'Motivo de consulta',     value: patient.treatmentGoal || '—' },
                          { label: 'Diagnóstico',            value: patient.diagnosis && patient.diagnosis !== 'Pendiente' ? patient.diagnosis : '—' },
                        ].filter(({ value }) => value !== '—' || true).map(({ label, value }) => (
                          <div key={label} className="grid grid-cols-[160px_1fr] gap-3 items-baseline pt-2.5 first:pt-0">
                            <span className="text-xs text-gray-400 font-medium shrink-0">{label}:</span>
                            <span className="text-sm text-gray-800 leading-relaxed">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notas recientes */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Notas recientes</h3>
                        <button
                          onClick={() => setTab('notes')}
                          className="text-xs text-blue-700 hover:underline flex items-center gap-0.5"
                        >
                          Ver todas <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      {(clinicalNotes.length > 0 ? clinicalNotes : mockClinicalNotes).slice(0, 3).map((note, i) => {
                        const dateStr = note.date || note.createdAt
                        return (
                          <div key={note._id || note.id || i} className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 last:mb-0">
                            {dateStr && (
                              <p className="text-[11px] text-gray-400 mb-1.5">
                                {new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 leading-relaxed">{note.text || note.notes}</p>
                            {note.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {note.tags.map(t => (
                                  <span key={t} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {clinicalNotes.length === 0 && mockClinicalNotes.length === 0 && (
                        <div className="text-center py-10">
                          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Sin notas clínicas aún</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'summary' && !isLoading && (
                  <div className="space-y-6">
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        <button onClick={() => { setError(null); fetchData() }} className="ml-auto text-xs underline">Reintentar</button>
                      </div>
                    )}
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: 'Sesiones totales', value: patient.totalSessions ?? sessionHistory.length,
                          sub: patient.lastSession ? `Última: ${rel(patient.lastSession)}` : null,
                          Icon: Calendar, bg: 'bg-sky-50', color: 'text-blue-700',
                        },
                        {
                          label: 'Tareas completas', value: hwTasks.length ? `${completedHW}/${hwTasks.length}` : '—',
                          sub: hwTasks.length ? `${Math.round((completedHW / totalHW) * 100)}% adherencia` : 'Sin tareas',
                          Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600',
                        },
                        {
                          label: 'Entradas diario', value: diaryEntries.length || '—',
                          sub: clinicalNotes.length ? `${clinicalNotes.length} notas clínicas` : null,
                          Icon: BookOpen,
                          bg: 'bg-sky-50',
                          color: 'text-sky-600',
                        },
                      ].map(({ label, value, sub, Icon, bg, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide font-semibold">{label}</p>
                            {sub && <p className={`text-[10px] mt-0.5 font-medium ${color}`}>{sub}</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Treatment goal + contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-sky-500" />
                          <h3 className="font-bold text-gray-900 text-sm">Objetivo terapéutico</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {patient.treatmentGoal || 'No definido aún.'}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-sky-500" />
                          <h3 className="font-bold text-gray-900 text-sm">Datos de contacto</h3>
                        </div>
                        <div className="space-y-2">
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" /> {patient.email}
                            </div>
                          )}
                          {patient.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" /> {patient.telefono}
                            </div>
                          )}
                          {patient.nextSession && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              Próxima sesión: {new Date(patient.nextSession).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Latest diary highlight */}
                    {diaryEntries[0] && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-sky-500" />
                            <h3 className="font-bold text-gray-900 text-sm">Última entrada del diario</h3>
                          </div>
                          <button onClick={() => setTab('diary')} className="text-xs text-blue-700 hover:underline flex items-center gap-0.5">
                            Ver todo <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <DiaryCard entry={diaryEntries[0]} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── DIARY ───────────────────────────────────────────── */}
                {tab === 'diary' && !isLoading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Entradas del diario</h3>
                      <span className="text-xs text-gray-400">{diaryEntries.length} {diaryEntries.length === 1 ? 'entrada' : 'entradas'}</span>
                    </div>
                    {diaryEntries.length === 0 ? (
                      <div className="text-center py-14">
                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="w-7 h-7 text-sky-300" />
                        </div>
                        <p className="font-semibold text-gray-600">Sin entradas</p>
                        <p className="text-sm text-gray-400 mt-1">El paciente aún no ha escrito en su diario</p>
                      </div>
                    ) : (
                      diaryEntries.map((entry, i) => (
                        <DiaryCard key={entry._id || entry.id || i} entry={entry} index={i} expanded />
                      ))
                    )}
                  </div>
                )}

                {/* ── HOMEWORK ─────────────────────────────────────────── */}
                {tab === 'homework' && !isLoading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Tareas terapéuticas</h3>
                      {hwTasks.length > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">
                          {completedHW}/{hwTasks.length} completadas
                        </span>
                      )}
                    </div>
                    {hwTasks.length === 0 ? (
                      <div className="text-center py-14">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <ClipboardList className="w-7 h-7 text-emerald-300" />
                        </div>
                        <p className="font-semibold text-gray-600">Sin tareas asignadas</p>
                        <p className="text-sm text-gray-400 mt-1">Las tareas aparecerán aquí cuando las asignes</p>
                      </div>
                    ) : (
                      <>
                        {/* Progress bar */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Adherencia general</span>
                            <span className="font-bold text-gray-900">{Math.round((completedHW / totalHW) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(completedHW / totalHW) * 100}%` }}
                              transition={{ duration: 0.3 }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                        {hwTasks.map((task, i) => (
                          <HomeworkCard key={task._id || task.id || i} task={task} index={i} />
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* ── CLINICAL NOTES ───────────────────────────────────── */}
                {tab === 'notes' && !isLoading && (
                  <div className="space-y-4">
                    {/* Add note form */}
                    <form onSubmit={handleAddNote} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nueva nota clínica</p>
                      <div className="flex gap-2 items-end">
                        <textarea
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder={`Añadir nota sobre ${patient.nombre || patient.name?.split(' ')[0] || 'el paciente'}…`}
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                        />
                        <motion.button
                          type="submit"
                          disabled={isSubmitting || !newNote.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="shrink-0 p-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Send className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      {error && (
                        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {error}
                          <button type="button" onClick={() => setError(null)} className="ml-auto underline">Cerrar</button>
                        </p>
                      )}
                    </form>

                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Notas clínicas</h3>
                      <span className="text-xs text-gray-400">{clinicalNotes.length} {clinicalNotes.length === 1 ? 'nota' : 'notas'}</span>
                    </div>
                    {clinicalNotes.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-7 h-7 text-sky-300" />
                        </div>
                        <p className="font-semibold text-gray-600">Sin notas clínicas</p>
                        <p className="text-sm text-gray-400 mt-1">Usa el formulario de arriba para añadir la primera nota</p>
                      </div>
                    ) : (
                      clinicalNotes.map((note, i) => (
                        <ClinicalNoteCard key={note._id || note.id || i} note={note} index={i} />
                      ))
                    )}
                  </div>
                )}

                {/* ── SESSION HISTORY ───────────────────────────────────── */}
                {tab === 'sessions' && !isLoading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Historial de sesiones</h3>
                      <span className="text-xs text-gray-400">{sessionHistory.length} sesiones</span>
                    </div>
                    <div className="space-y-2">
                      {sessionHistory.map((session, i) => (
                        <SessionRow key={session.id} session={session} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Sub-cards ────────────────────────────────────────────────────────────────
const DiaryCard = ({ entry, index = 0, expanded = false }) => {
  const meta = MOOD_META[entry.mood] || MOOD_META['😐']
  const [open, setOpen] = useState(expanded)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-2xl">{entry.mood}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            {entry.symptoms && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                {entry.symptoms}
              </span>
            )}
            {entry.activities && (
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                {entry.activities}
              </span>
            )}
          </div>
          {entry.notes && (
            <p className="text-xs text-gray-500 mt-1 truncate leading-relaxed">{entry.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-400">{rel(entry.date)}</p>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
              {entry.notes && (
                <p className="text-sm text-gray-700 leading-relaxed">{entry.notes}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Energía
                  </p>
                  <MoodBar value={entry.energy ?? 5} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Sueño
                  </p>
                  <MoodBar value={entry.sleep ?? 5} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const HomeworkCard = ({ task, index }) => {
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
      className={`bg-white rounded-2xl border p-4 ${
        task.completed ? 'border-emerald-100 opacity-75' :
        isOverdue      ? 'border-rose-200'                :
                         'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {task.completed
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Circle className={`w-5 h-5 ${isOverdue ? 'text-rose-400' : 'text-gray-300'}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </p>
            <TypeBadge type={task.type} />
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Vencida
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{task.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
            {due && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Vence: {due}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Completada {rel(task.completedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Asignada {rel(task.assignedAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const ClinicalNoteCard = ({ note, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
    className="bg-white rounded-2xl border border-sky-100 p-5"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-sky-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">Sesión #{note.sessionNumber}</p>
          <p className="text-[10px] text-gray-400">{note.author}</p>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 shrink-0">{rel(note.date)}</span>
    </div>
    <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
    {note.tags?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {note.tags.map(tag => (
          <span key={tag} className="flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-sky-50 px-2 py-0.5 rounded-full">
            <Hash className="w-2.5 h-2.5" /> {tag}
          </span>
        ))}
      </div>
    )}
  </motion.div>
)

const SessionRow = ({ session, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.03 }}
      className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
        #{session.number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800">
            {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {session.type}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{session.duration} min</p>
      </div>
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <p className="text-sm font-bold text-gray-700">{session.mood}</p>
      </div>
    </motion.div>
)

export default PatientClinicalFile
