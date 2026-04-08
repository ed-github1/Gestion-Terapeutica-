// ─── REDESIGNED: ModernPatientsList ──────────────────────────────────────────
// Clinical caseload view — not a generic contact list.
// Displays risk levels, homework status, insurance sessions,
// treatment goals, and outcome trends for each patient.
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@shared/ui/Toast'
import { patientsService } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import { appointmentsService } from '@shared/services/appointmentsService'
import PatientInvitation from './PatientInvitation'
import PatientClinicalFile from './PatientClinicalFile'
import { homeworkService } from '@shared/services/homeworkService'
import {
    Users, UserPlus, Search, RefreshCw,
    ShieldAlert, X,
    BookOpen,
    Clock,
    TimerOff,
    ChevronLeft,
    CheckSquare,
    Square,
    Plus,
    Zap,
    Loader2,
    Trash2,
} from 'lucide-react'

// ─── Normalize backend patient → UI shape ────────────────────────────────────
// Backend uses firstName/lastName/_id; UI uses nombre/apellido/id.
// Clinical fields (riskLevel, etc.) not yet on backend default to null.
const normalizePatient = (p) => ({
    id:                p._id || p.id,
    userId:            p.userId || null,
    nombre:            p.firstName  || p.nombre  || '',
    apellido:          p.lastName   || p.apellido || '',
    // Keep original firstName/lastName so clinical file can read them directly
    firstName:         p.firstName  || p.nombre  || '',
    lastName:          p.lastName   || p.apellido || '',
    email:             p.email      || '',
    phone:             p.phone      || p.telefono || null,
    telefono:          p.phone      || p.telefono || null,
    status:            p.status     || 'pending',
    lastSession:       p.lastSession || null,
    nextSession:       p.nextSession || null,
    totalSessions:     p.totalSessions ?? 0,
    riskLevel:         p.riskLevel   || 'low',
    // Keep both aliases so clinical file finds it either way
    presentingConcern: p.presentingConcern || p.treatmentGoal || '',
    treatmentGoal:     p.presentingConcern || p.treatmentGoal || '',
    homeworkCompleted: p.homeworkCompleted ?? null,
    diagnosis:         p.diagnosis  || (p.status === 'pending' ? 'Pendiente' : '—'),
    insuranceRemaining: p.insuranceRemaining ?? null,
    // Raw fields needed by clinical file — keep them alongside computed age
    dateOfBirth:       p.dateOfBirth || null,
    gender:            p.gender      || null,
    emergencyContact:  p.emergencyContact || null,
    preferredMode:     p.preferredMode || p.modalidad || null,
    age:               p.dateOfBirth
        ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / 3.156e10)
        : null,
    hasRegistered:     p.hasRegistered ?? (p.userId != null),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (n, a) => `${n?.[0] || ''}${a?.[0] || ''}`.toUpperCase()
const avatarPalette = [
    'bg-sky-100 dark:bg-sky-900/50 text-blue-800 dark:text-sky-300',
    'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300',
    'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
]
const getAvatarColor = (id) => {
    // id may be a MongoDB ObjectId string — derive a stable numeric index from it
    const n = typeof id === 'number' ? id : String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return avatarPalette[n % avatarPalette.length] || avatarPalette[0]
}

const statusConfig = {
    active:   { label: 'Activo',    cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    pending:  { label: 'Pendiente', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',         dot: 'bg-amber-400' },
    inactive: { label: 'Inactivo',  cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',              dot: 'bg-gray-400 dark:bg-gray-500' },
    invited:  { label: 'Invitado',  cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',            dot: 'bg-blue-400' },
}

const daysSince = (dateStr) => {
    if (!dateStr) return null
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Ayer'
    return `Hace ${diff}d`
}

// ─── Therapy Reasons & Motivo Colors ──────────────────────────────────────────
const THERAPY_REASONS = [
    'Ansiedad', 'Depresión', 'Estrés', 'Duelo', 'Autoestima',
    'Problemas de pareja', 'Problemas familiares', 'Trauma / TEPT',
    'Adicciones', 'Trastorno alimentario',
]

const motivoColors = {
    'Ansiedad':             'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Depresión':            'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Estrés':               'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Duelo':                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'Autoestima':           'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Problemas de pareja':  'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'Problemas familiares': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Trauma / TEPT':        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Adicciones':           'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Trastorno alimentario':'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}
const defaultMotivoCls = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
const getMotivoCls = (motivo) => motivoColors[motivo] || defaultMotivoCls

const getSessionTrend = (patient) => {
    if (!patient.totalSessions) return { label: 'Sin sesiones', cls: 'text-gray-400 dark:text-gray-500', up: null }
    if (!patient.lastSession) return { label: `${patient.totalSessions} ses.`, cls: 'text-gray-500 dark:text-gray-400', up: null }
    const d = Math.floor((Date.now() - new Date(patient.lastSession).getTime()) / 86400000)
    if (d <= 7)  return { label: 'Al día',    cls: 'text-emerald-600 dark:text-emerald-400', up: true }
    if (d <= 14) return { label: 'Regular',   cls: 'text-sky-600 dark:text-sky-400',        up: true }
    if (d <= 30) return { label: 'Espaciado', cls: 'text-amber-600 dark:text-amber-400',    up: false }
    return { label: 'Inactivo', cls: 'text-rose-500 dark:text-rose-400', up: false }
}

const nextSessionLabel = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
const AlertBanner = ({ patients }) => {
    const urgent = patients.filter(p => p.riskLevel === 'high')
    if (!urgent.length) return null
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl"
        >
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                    {urgent.length} paciente{urgent.length !== 1 ? 's' : ''} de alto riesgo en tu carga
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {urgent.map(p => (
                        <span key={p.id} className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {p.status === 'inactive' && <TimerOff className="w-2.5 h-2.5" />}
                            {p.nombre} {p.apellido}
                            {p.status === 'inactive' && ' — perdió seguimiento'}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Patient Row ─────────────────────────────────────────────────────────────
const PatientRow = ({ patient, onSelect, isSelected, index }) => {
    const status = statusConfig[patient.status] || statusConfig.inactive
    const lastLabel = daysSince(patient.lastSession)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.03, duration: 0.22 }}
            onClick={() => onSelect(patient)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
                isSelected
                    ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200/80 dark:border-sky-800/50'
                    : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/30 border border-transparent'
            }`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(patient.id)}`}>
                {getInitials(patient.nombre, patient.apellido)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{patient.nombre} {patient.apellido}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    {patient.age ? `${patient.age} años` : ''}
                    {patient.age && lastLabel ? ' · ' : ''}
                    {lastLabel ? `última sesión ${lastLabel.toLowerCase()}` : (patient.totalSessions === 0 ? 'sin sesiones' : '')}
                </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.cls}`}>
                {status.label}
            </span>
        </motion.div>
    )
}

// ─── Quick-assign suggestion templates ───────────────────────────────────────
const HOMEWORK_SUGGESTIONS = [
    { title: 'Diario de emociones', description: 'Registra tus emociones 3 veces al día: qué sentiste, cuándo y qué lo desencadenó.' },
    { title: 'Registro de pensamientos', description: 'Anota un pensamiento automático negativo y evalúa su veracidad con evidencia a favor y en contra.' },
    { title: 'Respiración diafragmática', description: 'Practica 5 minutos de respiración profunda por la mañana y antes de dormir.' },
    { title: 'Mindfulness 5 min', description: 'Una vez al día, dedica 5 minutos a la meditación de atención plena guiada.' },
    { title: 'Actividades placenteras', description: 'Realiza una actividad que disfrutes cada día y regístrala con tu estado de ánimo antes y después.' },
    { title: 'Reestructuración cognitiva', description: 'Identifica una creencia disfuncional esta semana y escribe una alternativa más equilibrada.' },
    { title: 'Carta de autocompasión', description: 'Escríbete una carta como si le hablaras a un buen amigo que pasa por tu misma situación.' },
    { title: 'Registro de sueño', description: 'Apunta a qué hora te vas a dormir, te despiertas y la calidad percibida cada mañana.' },
    { title: 'Activación conductual', description: 'Planifica y realiza una tarea pendiente que hayas estado postergando.' },
]

// ─── TareasTab ────────────────────────────────────────────────────────────────
const TareasTab = ({ patient }) => {
    const [tasks, setTasks]           = useState([])
    const [loading, setLoading]       = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [newTitle, setNewTitle]     = useState('')
    const [showInput, setShowInput]   = useState(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        homeworkService.getAll(patient.id)
            .then(res => {
                if (cancelled) return
                const raw = res.data?.data ?? res.data ?? []
                setTasks(Array.isArray(raw) ? raw : [])
            })
            .catch(() => { if (!cancelled) setTasks([]) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [patient.id])

    const assign = useCallback(async (title, description = '') => {
        if (!title.trim() || submitting) return
        setSubmitting(true)
        try {
            const res = await homeworkService.assign(patient.id, { title: title.trim(), description })
            const created = res.data?.data ?? res.data
            if (created) setTasks(prev => [created, ...prev])
            setNewTitle('')
            setShowInput(false)
        } catch {
            // silent — toast not needed for inline panel
        } finally {
            setSubmitting(false)
        }
    }, [patient.id, submitting])

    const toggleDone = useCallback(async (task) => {
        const updated = { ...task, completed: !task.completed }
        setTasks(prev => prev.map(t => t._id === task._id ? updated : t))
        try {
            await homeworkService.update(patient.id, task._id, { completed: updated.completed })
        } catch {
            setTasks(prev => prev.map(t => t._id === task._id ? task : t))
        }
    }, [patient.id])

    const remove = useCallback(async (taskId) => {
        setTasks(prev => prev.filter(t => t._id !== taskId))
        try {
            await homeworkService.remove(patient.id, taskId)
        } catch {
            // silent
        }
    }, [patient.id])

    const pending   = tasks.filter(t => !t.completed)
    const completed = tasks.filter(t =>  t.completed)

    // Filter suggestions not yet assigned
    const unusedSuggestions = HOMEWORK_SUGGESTIONS.filter(
        s => !tasks.some(t => t.title?.toLowerCase() === s.title.toLowerCase())
    )

    if (loading) return (
        <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
        </div>
    )

    return (
        <div className="space-y-4">
            {/* ── Pending tasks ── */}
            {pending.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Pendientes · {pending.length}
                    </p>
                    {pending.map(task => (
                        <div
                            key={task._id}
                            className="flex items-start gap-2.5 p-3 bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl group"
                        >
                            <button
                                onClick={() => toggleDone(task)}
                                className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                            >
                                <Square className="w-4 h-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">{task.title}</p>
                                {task.description && (
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{task.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => remove(task._id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-rose-400 dark:hover:text-rose-500 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Completed tasks ── */}
            {completed.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                        Completadas · {completed.length}
                    </p>
                    {completed.map(task => (
                        <div
                            key={task._id}
                            className="flex items-start gap-2.5 p-3 bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl group"
                        >
                            <button
                                onClick={() => toggleDone(task)}
                                className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400 hover:text-gray-400 transition-colors"
                            >
                                <CheckSquare className="w-4 h-4" />
                            </button>
                            <p className="flex-1 min-w-0 text-xs font-medium text-gray-400 dark:text-gray-500 line-through leading-snug">{task.title}</p>
                            <button
                                onClick={() => remove(task._id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-rose-400 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {tasks.length === 0 && (
                <div className="text-center py-6">
                    <BookOpen className="w-7 h-7 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sin tareas asignadas aún</p>
                </div>
            )}

            {/* ── Quick suggestions ── */}
            {unusedSuggestions.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sugerencias rápidas</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {unusedSuggestions.slice(0, 5).map(s => (
                            <button
                                key={s.title}
                                disabled={submitting}
                                onClick={() => assign(s.title, s.description)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-50"
                            >
                                + {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Custom task input ── */}
            {showInput ? (
                <div className="flex items-center gap-2 mt-1">
                    <input
                        autoFocus
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') assign(newTitle); if (e.key === 'Escape') { setShowInput(false); setNewTitle('') } }}
                        placeholder="Nombre de la tarea…"
                        className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                    />
                    <button
                        onClick={() => assign(newTitle)}
                        disabled={!newTitle.trim() || submitting}
                        className="px-3 py-2 bg-[#0075C9] text-white rounded-xl text-xs font-semibold hover:bg-[#005fa0] disabled:opacity-40 transition-colors"
                    >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Asignar'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowInput(true)}
                    className="flex items-center gap-1.5 w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500 hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tarea personalizada
                </button>
            )}
        </div>
    )
}

// ─── InlinePatientPanel ───────────────────────────────────────────────────────
// Compact patient detail shown on the right side of the split layout
const InlinePatientPanel = ({ patient, onClose, onOpenFull }) => {
    const [tab, setTab] = useState('caratula')
    const avatarColor = getAvatarColor(patient.id)
    const initials = getInitials(patient.nombre, patient.apellido)
    const status = statusConfig[patient.status] || statusConfig.inactive
    const pAge = patient.age

    const INLINE_TABS = [
        { key: 'caratula', label: 'Carátula' },
        { key: 'evolucion', label: 'Evolución' },
        { key: 'notas', label: 'Notas' },
        { key: 'tareas', label: 'Tareas' },
    ]

    return (
        <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700/60">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700/60">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Detalle del paciente</p>
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Identity */}
            <div className="flex items-center gap-3.5 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor}`}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{patient.nombre} {patient.apellido}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {pAge ? `${pAge} años` : ''}
                        {pAge ? ' · ' : ''}
                        <span className={`font-semibold ${status.cls.replace(/bg-\S+ /, '').replace(/dark:bg-\S+ /, '')}`}>{status.label}</span>
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-700/50 divide-x divide-gray-100 dark:divide-gray-700/50">
                <div className="px-5 py-3.5">
                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{patient.totalSessions}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Sesiones</p>
                </div>
                <div className="px-5 py-3.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug mt-1">
                        {patient.nextSession
                            ? new Date(patient.nextSession).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                            : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Próxima</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700/60 px-5">
                {INLINE_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`py-2.5 mr-4 text-xs font-semibold transition-all border-b-2 ${
                            tab === key
                                ? 'text-sky-600 dark:text-sky-400 border-sky-500'
                                : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
                {tab === 'caratula' && (
                    <>
                        {patient.email && (
                            <div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Email</p>
                                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 break-all">{patient.email}</p>
                            </div>
                        )}
                        {patient.telefono && (
                            <div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Teléfono</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{patient.telefono}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Género</p>
                            <p className="text-xs text-gray-300 dark:text-gray-600">+ Agregar</p>
                        </div>
                        {patient.treatmentGoal && (
                            <div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Motivo de consulta</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{patient.treatmentGoal}</p>
                            </div>
                        )}
                    </>
                )}
                {tab === 'tareas' && (
                    <TareasTab patient={patient} />
                )}
                {(tab === 'evolucion' || tab === 'notas') && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="w-8 h-8 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">Abre el expediente completo</p>
                    </div>
                )}
            </div>

            {/* Footer: open full record */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50">
                <button
                    onClick={onOpenFull}
                    className="w-full py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                    Ver expediente completo →
                </button>
            </div>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ModernPatientsList = () => {
    const [patients, setPatients]         = useState([])
    const [loading, setLoading]           = useState(true)
    const [search, setSearch]             = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterRisk, setFilterRisk]     = useState('all')
    const [sortBy, setSortBy]             = useState('name')
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [showDiary, setShowDiary]       = useState(false)
    const [panelPatient, setPanelPatient]  = useState(null)
    const [mobileView, setMobileView]      = useState('list') // 'list' | 'detail'

    const loadPatients = useCallback(async () => {
        setLoading(true)
        let realPatients = []

        // ── /patients ────────────────────────────────────────────────────
        try {
            const res = await patientsService.getAll()
            console.log('[PatientsList] /patients raw response:', res.data)
            // Handle all common shapes: { data: [...] }, { data: { data: [...] } }, [...]
            const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
            realPatients = Array.isArray(raw) ? raw.map(normalizePatient) : []
            console.log('[PatientsList] normalized patients:', realPatients)
        } catch (err) {
            console.error('[PatientsList] /patients error:', err)
        }

        // ── /invitations (merge any that aren't already in /patients) ────
        try {
            const invRes = await invitationsService.getAll()
            console.log('[PatientsList] /invitations raw response:', invRes.data)

            // Deep-log the inner data so we can see the exact backend shape
            const invOuter = invRes.data?.data ?? invRes.data ?? []
            console.log('[PatientsList] invOuter (stringified):', JSON.stringify(invOuter))

            // Try every known envelope shape, then fall back to scanning all values
            let invList = []
            if (Array.isArray(invOuter)) {
                invList = invOuter
            } else if (Array.isArray(invOuter?.invitations)) {
                invList = invOuter.invitations
            } else if (Array.isArray(invOuter?.data)) {
                invList = invOuter.data
            } else if (Array.isArray(invOuter?.items)) {
                invList = invOuter.items
            } else if (Array.isArray(invOuter?.results)) {
                invList = invOuter.results
            } else {
                // Last resort: find the first array-valued property anywhere in the object
                invList = Object.values(invOuter).find(v => Array.isArray(v) && v.length > 0)
                    ?? Object.values(invOuter).find(v => Array.isArray(v))
                    ?? []
            }

            console.log('[PatientsList] invitations list:', invList)
            const existingEmails = new Set(realPatients.map(p => p.email?.toLowerCase()))

            const fromInvites = invList
                .filter(inv => {
                    const email = (inv.patientEmail || inv.email || '').toLowerCase()
                    // Skip if already in /patients OR if there is no identifiable data at all
                    if (existingEmails.has(email)) return false
                    const hasName  = !!(inv.firstName || inv.lastName || inv.patientName)
                    const hasEmail = !!email
                    return hasName || hasEmail
                })
                .map(inv => {
                    const email = inv.patientEmail || inv.email || ''
                    // Use email local-part as fallback when no real name exists
                    const fallbackFirst = email ? email.split('@')[0] : ''
                    return normalizePatient({
                        _id:               inv._id || inv.id || `inv-${email}`,
                        firstName:         inv.firstName || inv.patientName?.split(' ')[0] || fallbackFirst,
                        lastName:          inv.lastName  || inv.patientName?.split(' ').slice(1).join(' ') || '',
                        email,
                        phone:             inv.phone || null,
                        status:            (inv.hasRegistered || inv.status === 'accepted') ? 'pending' : 'invited',
                        presentingConcern: inv.presentingConcern || '',
                        hasRegistered:     inv.hasRegistered ?? (inv.status === 'accepted'),
                        _fromInvitation:   true,
                    })
                })

            console.log('[PatientsList] from invitations (not in /patients):', fromInvites)
            realPatients = [...realPatients, ...fromInvites]
        } catch (err) {
            console.warn('[PatientsList] /invitations error (non-fatal):', err)
        }

        // ── /appointments — compute real session stats per patient ──────────
        try {
            const apptRes = await appointmentsService.getAllAsProf()
            const apptEnv = apptRes.data?.data?.data ?? apptRes.data?.data ?? apptRes.data ?? []
            // Handle both array and { appointments: [] } / { data: [] } envelopes
            const appointments = Array.isArray(apptEnv)
                ? apptEnv
                : (Array.isArray(apptEnv?.appointments) ? apptEnv.appointments
                    : Array.isArray(apptEnv?.data) ? apptEnv.data : [])
            console.log('[PatientsList] appointments for session stats:', appointments.length, 'sample patientId:', appointments[0]?.patientId)

            const parseApptDate = (d) => {
                if (!d) return null
                if (typeof d === 'string') return new Date(d)
                if (d.$date) return new Date(d.$date)
                return new Date(d)
            }

            const sessionStats = {}       // keyed by any patient id string
            const statsByEmail = {}       // keyed by lowercase email (fallback)
            const now = Date.now()

            for (const appt of appointments) {
                // patientId may be: a string, { $oid }, or a populated object { _id, email, ... }
                const rawPid = appt.patientId
                const pid = typeof rawPid === 'string'
                    ? rawPid
                    : (rawPid?._id ?? rawPid?.$oid ?? null)
                const apptEmail = (
                    typeof rawPid === 'object' && rawPid !== null ? rawPid.email : null
                ) ?? appt.patientEmail ?? null

                if (!pid && !apptEmail) continue

                const key = pid ?? `email:${apptEmail?.toLowerCase()}`
                if (!sessionStats[key]) sessionStats[key] = { total: 0, lastDate: null, nextDate: null }
                const s = sessionStats[key]

                // Also index by email for the fallback lookup
                if (apptEmail) {
                    const ekey = apptEmail.toLowerCase()
                    statsByEmail[ekey] = s   // same reference — both keys point to same stats object
                }

                const d = parseApptDate(appt.date)

                if (appt.status === 'completed') {
                    s.total++
                    if (d && (!s.lastDate || d.getTime() > new Date(s.lastDate).getTime())) {
                        s.lastDate = d.toISOString()
                    }
                } else if (['reserved', 'confirmed', 'accepted'].includes(appt.status)) {
                    if (d && d.getTime() >= now) {
                        if (!s.nextDate || d.getTime() < new Date(s.nextDate).getTime()) {
                            s.nextDate = d.toISOString()
                        }
                    }
                }
            }

            console.log('[PatientsList] session stats by patientId:', sessionStats, 'by email:', statsByEmail)

            // Build userId → profileId reverse index so appointments stored
            // with the user account ID resolve to the right patient profile.
            const userIdToProfileId = {}
            for (const p of realPatients) {
                if (p.userId) userIdToProfileId[String(p.userId)] = String(p.id)
            }

            realPatients = realPatients.map(p => {
                const pid = String(p.id)
                const uid = p.userId ? String(p.userId) : null
                const email = p.email?.toLowerCase() ?? null
                // Try: profile id → user id → email fallback
                const s = sessionStats[pid]
                    ?? (uid ? sessionStats[uid] : undefined)
                    ?? (email ? statsByEmail[email] : undefined)
                if (!s) return p
                return {
                    ...p,
                    totalSessions: s.total > 0 ? s.total : p.totalSessions,
                    lastSession:   s.lastDate ?? p.lastSession,
                    nextSession:   s.nextDate ?? p.nextSession,
                }
            })
        } catch (err) {
            console.warn('[PatientsList] /appointments stats error (non-fatal):', err)
        }

        console.log('[PatientsList] final list to render:', realPatients)
        setPatients(realPatients)
        setLoading(false)
    }, [])

    useEffect(() => { loadPatients() }, [loadPatients])

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este paciente definitivamente?')) return
        try { await patientsService.remove(id) } catch { /* silent */ }
        setPatients(p => p.filter(x => x.id !== id))
        showToast('Paciente eliminado', 'success')
    }

    const openDiary = (patient) => { setSelectedPatient(patient); setShowDiary(true) }
    const closePatientPanel = () => { setPanelPatient(null); setMobileView('list') }
    const selectPatient = (patient) => {
        const isSame = panelPatient?.id === patient.id
        setPanelPatient(isSame ? null : patient)
        setMobileView(isSame ? 'list' : 'detail')
    }

    const filtered = useMemo(() => {
        let list = [...patients]
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(p => `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q) || p.treatmentGoal?.toLowerCase().includes(q))
        }
        if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
        if (filterRisk !== 'all')   list = list.filter(p => p.riskLevel === filterRisk)
        list.sort((a, b) => {
            if (sortBy === 'name')        return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)
            if (sortBy === 'risk')        { const o = { high: 0, medium: 1, low: 2 }; return (o[a.riskLevel] ?? 3) - (o[b.riskLevel] ?? 3) }
            if (sortBy === 'lastSession') return new Date(b.lastSession || 0) - new Date(a.lastSession || 0)
            return 0
        })
        console.log('[PatientsList] filtered list:', list.length, 'filterStatus:', filterStatus, 'filterRisk:', filterRisk, 'patients in state:', patients.length)
        return list
    }, [patients, search, filterStatus, filterRisk, sortBy])

    const total    = patients.length
    const active   = patients.filter(p => p.status === 'active').length
    const highRisk = patients.filter(p => p.riskLevel === 'high').length
    const needsFollowUp = patients.filter(p => {
        if (!p.totalSessions) return false
        if (!p.lastSession) return true
        return Math.floor((Date.now() - new Date(p.lastSession).getTime()) / 86400000) > 14
    }).length

    return (
        <>
        <div className="flex h-full min-h-screen">

            {/* ── LEFT: Patient list panel ── */}
            <div className={`flex-col shrink-0 bg-white dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700/60 w-full md:max-w-95 md:min-w-70 ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}`}>

                {/* List header */}
                <div className="px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-bold text-gray-900 dark:text-white">Pacientes</h1>
                            {active > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                    {active} activos
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button onClick={loadPatients} title="Actualizar" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setShowAddPatient(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0075C9] text-white rounded-xl text-xs font-semibold hover:bg-[#005fa0] transition-colors">
                                <UserPlus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Nuevo</span>
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar paciente…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        />
                    </div>
                </div>

                {/* List body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">

                    <AlertBanner patients={patients} />

                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#0075C9] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-8 h-8 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin resultados</p>
                            {(filterStatus !== 'all' || search) && (
                                <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRisk('all') }} className="mt-2 text-xs text-sky-600 hover:underline">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <AnimatePresence>
                            {filtered.map((p, i) => (
                                <PatientRow
                                    key={p.id ?? i}
                                    patient={p}
                                    index={i}
                                    isSelected={panelPatient?.id === p.id}
                                    onSelect={selectPatient}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Detail panel or suggestions ── */}
            <div className={`min-w-0 flex-col ${mobileView === 'list' ? 'hidden md:flex md:flex-1' : 'flex flex-1'}`}>
                {/* Mobile back button */}
                <div className="md:hidden shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/60">
                    <button
                        onClick={closePatientPanel}
                        className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Pacientes
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {panelPatient ? (
                        <motion.div
                            key={panelPatient.id ?? panelPatient._id ?? 'panel'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="h-full"
                        >
                            <PatientClinicalFile
                                patient={panelPatient}
                                onClose={closePatientPanel}
                                inline
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="suggestions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="h-full flex flex-col items-center justify-center px-10 py-16 text-center gap-6"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                                <Users className="w-7 h-7 text-sky-400 dark:text-sky-500" />
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Selecciona un paciente
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
                                    Haz clic en cualquier paciente de la lista para ver su información rápida aquí.
                                </p>
                            </div>

                            {/* Quick stats */}
                            {!loading && patients.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                    {[
                                        { label: 'Total', value: patients.length, color: 'text-gray-900 dark:text-white' },
                                        { label: 'Activos', value: active, color: 'text-emerald-600 dark:text-emerald-400' },
                                        { label: 'Alto riesgo', value: highRisk, color: 'text-rose-500 dark:text-rose-400' },
                                        { label: 'Seguimiento', value: needsFollowUp, color: 'text-amber-600 dark:text-amber-400' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-4 py-3 text-left">
                                            <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide font-semibold">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Suggestions list */}
                            {!loading && filtered.length > 0 && (
                                <div className="w-full max-w-xs space-y-2">
                                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Sugeridos</p>
                                    {filtered.slice(0, 3).map((p) => {
                                        const sc = statusConfig[p.status] || statusConfig.inactive
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => selectPatient(p)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all text-left"
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(p.id)}`}>
                                                    {getInitials(p.nombre, p.apellido)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{p.nombre} {p.apellido}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{sc.label}{p.age ? ` · ${p.age}a` : ''}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            <button
                                onClick={() => setShowAddPatient(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500 hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-600 dark:hover:text-sky-400 transition-colors"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Añadir nuevo paciente
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </div>

        </div>

        {/* Add patient modal */}
        <AnimatePresence>
            {showAddPatient && (
                <PatientInvitation
                    onClose={() => { setShowAddPatient(false); loadPatients() }}
                    onSuccess={() => { setShowAddPatient(false); loadPatients() }}
                />
            )}
        </AnimatePresence>

        </>
    )
}

export default ModernPatientsList
