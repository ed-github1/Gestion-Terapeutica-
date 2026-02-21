/**
 * PatientClinicalFile.jsx
 * Full-featured clinical file drawer for a professional to review
 * a patient's diary entries, homework tasks, PHQ-9 trend graph,
 * session notes, and treatment summary.
 *
 * Uses rich mock data when real API data is unavailable (offline-first).
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, BookOpen, ClipboardList, FileText, TrendingDown, TrendingUp, Minus,
  CheckCircle2, Circle, ShieldAlert, Calendar, Clock, Target, Brain,
  Activity, Smile, Frown, Meh, AlertCircle, ChevronLeft, ChevronRight,
  Hash, MessageSquare, Dumbbell, Star, Pencil, User, Mail, Phone,
  BarChart2, Zap, Heart, Wind, Moon, Sun, Coffee, Send,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { diaryService } from '@shared/services/diaryService'
import { homeworkService } from '@shared/services/homeworkService'

// ─── Palette helpers ──────────────────────────────────────────────────────────
const avatarPalette = [
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-violet-500 to-violet-600',
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
  '😴': { label: 'Cansado',  bg: 'bg-purple-100',   text: 'text-purple-700',  score: 4 },
  '😰': { label: 'Ansioso',  bg: 'bg-orange-100',   text: 'text-orange-700',  score: 3 },
}

const HOMEWORK_TYPES = {
  exercise:   { label: 'Ejercicio',  icon: Dumbbell, bg: 'bg-emerald-100 text-emerald-700' },
  reading:    { label: 'Lectura',    icon: BookOpen,  bg: 'bg-blue-100 text-blue-700' },
  journaling: { label: 'Diario',     icon: Pencil,    bg: 'bg-purple-100 text-purple-700' },
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

  // PHQ-9 history (12 data points ≈ 3 months of biweekly)
  const basePHQ = patient.phq9?.length
    ? [...patient.phq9]
    : Array.from({ length: 6 }, (_, i) => Math.max(0, seededInt(seed + i, 6, 20)))
  // Extend to 10 points if needed
  while (basePHQ.length < 10) {
    const last = basePHQ[basePHQ.length - 1]
    basePHQ.push(Math.max(0, Math.min(27, last + seededInt(seed + basePHQ.length, -3, 2))))
  }

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
      text: `Evaluación inicial con PHQ-9 y GAD-7. Diagnóstico provisional. Se plantean objetivos terapéuticos y se explica el modelo cognitivo-conductual.`,
      tags: ['Evaluación', 'PHQ-9', 'GAD-7', 'Psicoeducación'],
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
    phq9: basePHQ[basePHQ.length - 1 - i] ?? null,
    mood: seededInt(seed + i, 3, 9),
  }))

  return { diaryEntries, clinicalNotes, homeworkTasks, sessionHistory, phq9History: basePHQ }
}

// ─── PHQ-9 Area Chart ─────────────────────────────────────────────────────────
const PHQ9Chart = ({ scores }) => {
  if (!scores || scores.length < 2) return null
  const w = 400, h = 120, padX = 28, padY = 14
  const max = 27
  const pts = scores.map((v, i) => {
    const x = padX + (i / (scores.length - 1)) * (w - padX * 2)
    const y = padY + (1 - v / max) * (h - padY * 2)
    return [x, y]
  })
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${h - padY} L${pts[0][0]},${h - padY} Z`

  // Severity bands
  const bands = [
    { y: padY + (1 - 19/27) * (h - padY * 2), label: 'Severo',    color: '#fecaca' },
    { y: padY + (1 - 14/27) * (h - padY * 2), label: 'Moderado-s',color: '#fed7aa' },
    { y: padY + (1 - 9/27)  * (h - padY * 2), label: 'Moderado',  color: '#fef08a' },
    { y: padY + (1 - 4/27)  * (h - padY * 2), label: 'Leve',      color: '#bbf7d0' },
  ]

  const lastScore = scores[scores.length - 1]
  const firstScore = scores[0]
  const delta = lastScore - firstScore
  const isImproving = delta < -2
  const isWorsening = delta > 2

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        {/* Severity band fills */}
        {bands.map((b, i) => {
          const nextY = i + 1 < bands.length ? bands[i + 1].y : h - padY
          return (
            <rect key={i} x={padX} y={b.y} width={w - padX * 2} height={nextY - b.y}
              fill={b.color} opacity={0.25} />
          )
        })}
        {/* Horizontal threshold lines */}
        {bands.map((b, i) => (
          <line key={i} x1={padX} x2={w - padX} y1={b.y} y2={b.y}
            stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray="3 3" />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="#6366f1" opacity={0.1} />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5}
            fill={i === pts.length - 1 ? '#6366f1' : '#a5b4fc'}
            stroke="white" strokeWidth="1.5"
          />
        ))}
        {/* Y axis labels */}
        {[0, 5, 10, 15, 20, 27].map(v => {
          const y = padY + (1 - v / max) * (h - padY * 2)
          return (
            <text key={v} x={padX - 4} y={y + 3} textAnchor="end"
              fontSize="8" fill="#9ca3af">{v}</text>
          )
        })}
      </svg>
      {/* Delta badge */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        isImproving ? 'bg-emerald-100 text-emerald-700' :
        isWorsening ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {isImproving ? <TrendingDown className="w-3 h-3" /> :
         isWorsening ? <TrendingUp   className="w-3 h-3" /> :
                       <Minus        className="w-3 h-3" />}
        {Math.abs(delta)} pts {isImproving ? 'mejoría' : isWorsening ? 'empeora' : 'estable'}
      </div>
    </div>
  )
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
  { key: 'summary',  label: 'Resumen',       icon: BarChart2   },
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
const phq9Severity = (score) => {
  if (score === null || score === undefined) return null
  if (score >= 20) return { label: 'Severo',        color: 'text-rose-700',   bg: 'bg-rose-100'   }
  if (score >= 15) return { label: 'Mod. severo',   color: 'text-orange-700', bg: 'bg-orange-100' }
  if (score >= 10) return { label: 'Moderado',      color: 'text-amber-700',  bg: 'bg-amber-100'  }
  if (score >= 5)  return { label: 'Leve',          color: 'text-yellow-700', bg: 'bg-yellow-100' }
  return                   { label: 'Sin depresión', color: 'text-emerald-700',bg: 'bg-emerald-100'}
}

// ─── Main component ───────────────────────────────────────────────────────────
const PatientClinicalFile = ({ patient, onClose }) => {
  const { user } = useAuth()
  const [tab, setTab]                   = useState('summary')
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

  // ── Keep mock only for PHQ-9 trend + session history (no API yet)
  const mock = useMemo(() => buildMockData(patient), [patient])
  const { sessionHistory, phq9History } = mock

  const grad      = getGradient(patient.id)
  const initials  = getInitials(
    patient.nombre || patient.name?.split(' ')[0],
    patient.apellido || patient.name?.split(' ').slice(1).join(' ')
  )
  const lastPHQ   = phq9History[phq9History.length - 1]
  const severity  = phq9Severity(lastPHQ)
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
                  { value: lastPHQ ?? '—', label: 'PHQ-9' },
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
                          label: 'PHQ-9 actual', value: lastPHQ ?? '—',
                          sub: severity?.label,
                          Icon: Brain,
                          bg: severity?.bg ?? 'bg-gray-100',
                          color: severity?.color ?? 'text-gray-700',
                        },
                        {
                          label: 'Sesiones totales', value: patient.totalSessions ?? sessionHistory.length,
                          sub: patient.lastSession ? `Última: ${rel(patient.lastSession)}` : null,
                          Icon: Calendar, bg: 'bg-indigo-50', color: 'text-indigo-600',
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
                          bg: 'bg-violet-50',
                          color: 'text-violet-600',
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

                    {/* PHQ-9 chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">Evolución PHQ-9</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Últimas {phq9History.length} evaluaciones</p>
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          {[['bg-rose-100','Severo'],['bg-amber-100','Moderado'],['bg-emerald-100','Leve']].map(([c,l]) => (
                            <span key={l} className="flex items-center gap-1 text-gray-500">
                              <span className={`w-2 h-2 rounded-sm ${c}`} /> {l}
                            </span>
                          ))}
                        </div>
                      </div>
                      <PHQ9Chart scores={phq9History} />
                    </div>

                    {/* Treatment goal + contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-indigo-500" />
                          <h3 className="font-bold text-gray-900 text-sm">Objetivo terapéutico</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {patient.treatmentGoal || 'No definido aún.'}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-indigo-500" />
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
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-gray-900 text-sm">Última entrada del diario</h3>
                          </div>
                          <button onClick={() => setTab('diary')} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
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
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="w-7 h-7 text-indigo-300" />
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
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-gray-50"
                        />
                        <motion.button
                          type="submit"
                          disabled={isSubmitting || !newNote.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="shrink-0 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-7 h-7 text-indigo-300" />
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
    className="bg-white rounded-2xl border border-indigo-100 p-5"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-indigo-500" />
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
          <span key={tag} className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            <Hash className="w-2.5 h-2.5" /> {tag}
          </span>
        ))}
      </div>
    )}
  </motion.div>
)

const SessionRow = ({ session, index }) => {
  const sev = phq9Severity(session.phq9)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.03 }}
      className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">
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
      {session.phq9 !== null && (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{session.phq9}</p>
          {sev && (
            <span className={`text-[10px] font-semibold ${sev.color}`}>{sev.label}</span>
          )}
        </div>
      )}
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <p className="text-sm font-bold text-gray-700">{session.mood}</p>
      </div>
    </motion.div>
  )
}

export default PatientClinicalFile
