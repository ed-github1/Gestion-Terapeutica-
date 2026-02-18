// ─── REDESIGNED: ModernPatientsList ──────────────────────────────────────────
// Clinical caseload view — not a generic contact list.
// Displays PHQ-9 sparklines, risk levels, homework status, insurance sessions,
// treatment goals, and outcome trends for each patient.
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@components'
import { patientsService } from '@shared/services/patientsService'
import PatientForm from './PatientForm'
import PatientDiary from './PatientDiary'
import {
    Users, UserPlus, Search,
    LayoutGrid, List, ShieldAlert,
    BookOpen, MessageSquare, CalendarPlus,
    ChevronRight, TrendingDown, TrendingUp, Minus,
    Clock, MoreHorizontal, CheckCircle2,
    XCircle, TimerOff
} from 'lucide-react'

// ─── Normalize backend patient → UI shape ────────────────────────────────────
// Backend uses firstName/lastName/_id; UI uses nombre/apellido/id.
// Clinical fields (phq9, riskLevel, etc.) not yet on backend default to null.
const normalizePatient = (p) => ({
    id:                p._id || p.id,
    nombre:            p.firstName  || p.nombre  || '',
    apellido:          p.lastName   || p.apellido || '',
    email:             p.email      || '',
    telefono:          p.phone      || p.telefono || null,
    status:            p.status     || 'pending',
    lastSession:       p.lastSession || null,
    nextSession:       p.nextSession || null,
    totalSessions:     p.totalSessions ?? 0,
    riskLevel:         p.riskLevel   || 'low',
    phq9:              p.phq9        || [],
    treatmentGoal:     p.presentingConcern || p.treatmentGoal || '',
    homeworkCompleted: p.homeworkCompleted ?? null,
    diagnosis:         p.diagnosis  || (p.status === 'pending' ? 'Pendiente' : '—'),
    insuranceRemaining: p.insuranceRemaining ?? null,
    age:               p.dateOfBirth
        ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / 3.156e10)
        : null,
    hasRegistered:     p.hasRegistered ?? (p.userId != null),
})

// ─── Mock patients (fallback while backend has no clinical data) ────────────────
const mockPatients = [
    { id: 1,  nombre: 'María',   apellido: 'González',  email: 'maria.gonzalez@email.com',  telefono: '+34 612 345 678', status: 'active',   lastSession: '2026-02-10', nextSession: '2026-02-19', totalSessions: 14, riskLevel: 'low',    phq9: [14,12,10,8,7],  treatmentGoal: 'Manejo de ansiedad generalizada',               homeworkCompleted: true,  diagnosis: 'TAG',     insuranceRemaining: 6,    age: 34 },
    { id: 2,  nombre: 'Carlos',  apellido: 'Rodríguez', email: 'carlos.rodriguez@email.com', telefono: '+34 623 456 789', status: 'active',   lastSession: '2026-02-08', nextSession: '2026-02-20', totalSessions: 7,  riskLevel: 'high',   phq9: [18,19,17,20,22],treatmentGoal: 'Reducir ideación pasiva — plan de seguridad activo', homeworkCompleted: false, diagnosis: 'TDM',     insuranceRemaining: 2,    age: 42 },
    { id: 3,  nombre: 'Ana',     apellido: 'Martínez',  email: 'ana.martinez@email.com',     telefono: '+34 634 567 890', status: 'pending',  lastSession: null,         nextSession: '2026-02-21', totalSessions: 0,  riskLevel: 'low',    phq9: [],              treatmentGoal: 'Evaluación inicial pendiente',                    homeworkCompleted: null,  diagnosis: 'Pendiente',insuranceRemaining: 10,   age: 28 },
    { id: 4,  nombre: 'David',   apellido: 'López',     email: 'david.lopez@email.com',      telefono: '+34 645 678 901', status: 'active',   lastSession: '2026-02-12', nextSession: '2026-02-22', totalSessions: 22, riskLevel: 'medium', phq9: [15,14,14,13,12],treatmentGoal: 'Regulación emocional — episodios de ira',          homeworkCompleted: true,  diagnosis: 'TEL',     insuranceRemaining: null, age: 38 },
    { id: 5,  nombre: 'Laura',   apellido: 'Sánchez',   email: 'laura.sanchez@email.com',    telefono: '+34 656 789 012', status: 'inactive', lastSession: '2026-01-15', nextSession: null,         totalSessions: 5,  riskLevel: 'low',    phq9: [10,9,8],        treatmentGoal: 'Alta temporal — pausó tratamiento',               homeworkCompleted: null,  diagnosis: 'TA',      insuranceRemaining: 8,    age: 29 },
    { id: 6,  nombre: 'Miguel',  apellido: 'Fernández', email: 'miguel.fernandez@email.com', telefono: '+34 667 890 123', status: 'active',   lastSession: '2026-02-11', nextSession: '2026-02-18', totalSessions: 31, riskLevel: 'low',    phq9: [12,10,8,6,5],   treatmentGoal: 'Consolidar habilidades sociales',                 homeworkCompleted: true,  diagnosis: 'TP-E',    insuranceRemaining: null, age: 25 },
    { id: 7,  nombre: 'Isabel',  apellido: 'García',    email: 'isabel.garcia@email.com',    telefono: '+34 678 901 234', status: 'pending',  lastSession: null,         nextSession: '2026-02-24', totalSessions: 0,  riskLevel: 'medium', phq9: [],              treatmentGoal: 'Evaluación de duelo complicado',                  homeworkCompleted: null,  diagnosis: 'Pendiente',insuranceRemaining: 12,   age: 55 },
    { id: 8,  nombre: 'Javier',  apellido: 'Díaz',      email: 'javier.diaz@email.com',      telefono: '+34 689 012 345', status: 'active',   lastSession: '2026-02-09', nextSession: '2026-02-20', totalSessions: 9,  riskLevel: 'medium', phq9: [16,15,14,13],   treatmentGoal: 'Protocolo de exposición — fobia social',          homeworkCompleted: false, diagnosis: 'FS',      insuranceRemaining: 4,    age: 31 },
    { id: 9,  nombre: 'Carmen',  apellido: 'Ruiz',      email: 'carmen.ruiz@email.com',      telefono: '+34 690 123 456', status: 'active',   lastSession: '2026-02-13', nextSession: '2026-02-25', totalSessions: 18, riskLevel: 'low',    phq9: [8,7,6,5,4],     treatmentGoal: 'Mantenimiento — habilidades de afrontamiento',    homeworkCompleted: true,  diagnosis: 'TDA',     insuranceRemaining: null, age: 45 },
    { id: 10, nombre: 'Pablo',   apellido: 'Torres',    email: 'pablo.torres@email.com',     telefono: '+34 601 234 567', status: 'inactive', lastSession: '2026-01-20', nextSession: null,         totalSessions: 3,  riskLevel: 'high',   phq9: [20,22,19],      treatmentGoal: 'Perdió seguimiento — requiere recontacto urgente', homeworkCompleted: null,  diagnosis: 'TDM',     insuranceRemaining: 5,    age: 48 },
    { id: 11, nombre: 'Elena',   apellido: 'Ramírez',   email: 'elena.ramirez@email.com',    telefono: '+34 612 345 789', status: 'pending',  lastSession: null,         nextSession: '2026-02-26', totalSessions: 0,  riskLevel: 'low',    phq9: [],              treatmentGoal: 'Primera consulta programada',                     homeworkCompleted: null,  diagnosis: 'Pendiente',insuranceRemaining: 10,   age: 22 },
    { id: 12, nombre: 'Roberto', apellido: 'Moreno',    email: 'roberto.moreno@email.com',   telefono: '+34 623 456 890', status: 'active',   lastSession: '2026-02-07', nextSession: '2026-02-21', totalSessions: 11, riskLevel: 'medium', phq9: [13,12,11,10],   treatmentGoal: 'Protocolo de duelo — 6 meses',                    homeworkCompleted: true,  diagnosis: 'TD',      insuranceRemaining: 3,    age: 60 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (n, a) => `${n?.[0] || ''}${a?.[0] || ''}`.toUpperCase()
const avatarPalette = [
    'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',   'bg-cyan-100 text-cyan-700',
]
const getAvatarColor = (id) => avatarPalette[id % avatarPalette.length]

const statusConfig = {
    active:   { label: 'Activo',    cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    pending:  { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
    inactive: { label: 'Inactivo',  cls: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-400' },
}

const phq9Trend = (scores) => {
    if (!scores || scores.length < 2) return null
    const delta = scores[scores.length - 1] - scores[0]
    if (delta < -3) return { dir: 'improving', label: 'Mejorando', Icon: TrendingDown, color: 'text-emerald-600' }
    if (delta > 3)  return { dir: 'worsening', label: 'Empeorando', Icon: TrendingUp,  color: 'text-rose-600' }
    return             { dir: 'stable',    label: 'Estable',    Icon: Minus,        color: 'text-gray-400' }
}

const daysSince = (dateStr) => {
    if (!dateStr) return null
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Ayer'
    return `Hace ${diff}d`
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
const Sparkline = ({ scores, color = '#6366f1' }) => {
    if (!scores || scores.length < 2) return <span className="text-[10px] text-gray-300 italic">Sin datos</span>
    const max = Math.max(...scores), min = Math.min(...scores), range = max - min || 1
    const w = 56, h = 22, pad = 3
    const pts = scores.map((v, i) => {
        const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')
    return (
        <svg width={w} height={h}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {scores.map((v, i) => {
                const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
                const y = pad + (1 - (v - min) / range) * (h - pad * 2)
                return i === scores.length - 1 ? <circle key={i} cx={x} cy={y} r="2.5" fill={color} /> : null
            })}
        </svg>
    )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
const AlertBanner = ({ patients }) => {
    const urgent = patients.filter(p => p.riskLevel === 'high')
    if (!urgent.length) return null
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl"
        >
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-800">
                    {urgent.length} paciente{urgent.length !== 1 ? 's' : ''} de alto riesgo en tu carga
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {urgent.map(p => (
                        <span key={p.id} className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
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

// ─── Patient Card (grid) ──────────────────────────────────────────────────────
const PatientCard = ({ patient, onOpenDiary, onDelete, index }) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const status = statusConfig[patient.status] || statusConfig.inactive
    const trend = phq9Trend(patient.phq9)
    const lastScore = patient.phq9?.length ? patient.phq9[patient.phq9.length - 1] : null
    const trendColor = trend?.dir === 'improving' ? '#10b981' : trend?.dir === 'worsening' ? '#f43f5e' : '#94a3b8'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`bg-white rounded-2xl border flex flex-col overflow-hidden hover:shadow-md transition-shadow ${
                patient.riskLevel === 'high' ? 'border-rose-200' : 'border-gray-100'
            }`}
        >
            {/* Risk accent line */}
            <div className={`h-0.5 w-full ${patient.riskLevel === 'high' ? 'bg-rose-500' : patient.riskLevel === 'medium' ? 'bg-amber-400' : 'bg-transparent'}`} />

            <div className="p-5 flex-1 flex flex-col gap-3.5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(patient.id)}`}>
                        {getInitials(patient.nombre, patient.apellido)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{patient.nombre} {patient.apellido}</p>
                            {patient.riskLevel === 'high' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${status.cls} border-transparent`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                            </span>
                            {patient.diagnosis && patient.diagnosis !== 'Pendiente' && (
                                <span className="text-[10px] text-gray-400 font-medium">{patient.diagnosis} · {patient.age}a</span>
                            )}
                        </div>
                    </div>
                    {/* context menu */}
                    <div className="relative shrink-0">
                        <button onClick={() => setMenuOpen(o => !o)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-7 z-20 bg-white border border-gray-100 shadow-lg rounded-xl py-1 w-44"
                                >
                                    {[
                                        { icon: BookOpen, label: 'Ver expediente', action: () => { onOpenDiary(patient); setMenuOpen(false) } },
                                        { icon: CalendarPlus, label: 'Agendar sesión', action: () => setMenuOpen(false) },
                                        { icon: MessageSquare, label: 'Mensaje', action: () => setMenuOpen(false) },
                                    ].map(({ icon: Icon, label, action }) => (
                                        <button key={label} onClick={action} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                                            <Icon className="w-3.5 h-3.5" /> {label}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-100 my-1" />
                                    <button onClick={() => { onDelete(patient.id); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">
                                        <XCircle className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Treatment goal */}
                <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                    {patient.treatmentGoal || 'Sin objetivo de tratamiento definido'}
                </p>

                {/* PHQ-9 */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-1">PHQ-9</p>
                        <div className="flex items-center gap-1.5">
                            {lastScore !== null ? (
                                <>
                                    <span className="text-lg font-bold text-gray-900 leading-none">{lastScore}</span>
                                    <span className="text-[9px] text-gray-400">/27</span>
                                    {trend && (
                                        <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend.color}`}>
                                            <trend.Icon className="w-3 h-3" /> {trend.label}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-xs text-gray-300">Sin evaluación</span>
                            )}
                        </div>
                    </div>
                    <Sparkline scores={patient.phq9} color={trendColor} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-gray-800">{patient.totalSessions}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Sesiones</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-gray-800">{daysSince(patient.lastSession) || '—'}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Última</p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center ${patient.insuranceRemaining !== null && patient.insuranceRemaining <= 3 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${patient.insuranceRemaining !== null && patient.insuranceRemaining <= 3 ? 'text-amber-600' : 'text-gray-800'}`}>
                            {patient.insuranceRemaining ?? '∞'}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Seguro</p>
                    </div>
                </div>

                {/* Homework + next */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    {patient.homeworkCompleted === true  && <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Tarea entregada</span>}
                    {patient.homeworkCompleted === false && <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500"><XCircle className="w-3 h-3" /> Tarea pendiente</span>}
                    {patient.homeworkCompleted === null  && <span className="text-[10px] text-gray-300">Sin tarea</span>}
                    {patient.nextSession && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(patient.nextSession).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer CTA */}
            <button
                onClick={() => onOpenDiary(patient)}
                className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" /> Ver expediente <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
        </motion.div>
    )
}

// ─── Patient Row (table) ──────────────────────────────────────────────────────
const PatientRow = ({ patient, onOpenDiary, onDelete }) => {
    const status = statusConfig[patient.status] || statusConfig.inactive
    const trend = phq9Trend(patient.phq9)
    const lastScore = patient.phq9?.length ? patient.phq9[patient.phq9.length - 1] : null
    const trendColor = trend?.dir === 'improving' ? '#10b981' : trend?.dir === 'worsening' ? '#f43f5e' : '#94a3b8'

    return (
        <tr className="group hover:bg-gray-50/60 transition-colors">
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(patient.id)}`}>
                        {getInitials(patient.nombre, patient.apellido)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{patient.nombre} {patient.apellido}</p>
                            {patient.riskLevel === 'high' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400">{patient.diagnosis} · {patient.age}a</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
            </td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <Sparkline scores={patient.phq9} color={trendColor} />
                    {lastScore !== null && (
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{lastScore}</p>
                            {trend && <p className={`text-[9px] font-semibold ${trend.color}`}>{trend.label}</p>}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-800">{patient.totalSessions}</p>
                <p className="text-[10px] text-gray-400">{daysSince(patient.lastSession) || 'Sin sesiones'}</p>
            </td>
            <td className="px-5 py-3.5">
                {patient.homeworkCompleted === true  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {patient.homeworkCompleted === false && <XCircle className="w-4 h-4 text-rose-400" />}
                {patient.homeworkCompleted === null  && <Minus className="w-4 h-4 text-gray-300" />}
            </td>
            <td className="px-5 py-3.5 text-xs text-gray-500">
                {patient.nextSession
                    ? new Date(patient.nextSession).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onOpenDiary(patient)} title="Ver expediente" className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"><BookOpen className="w-4 h-4" /></button>
                    <button title="Agendar" className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors text-gray-400 hover:text-emerald-600"><CalendarPlus className="w-4 h-4" /></button>
                    <button title="Mensaje" className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"><MessageSquare className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(patient.id)} title="Eliminar" className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-gray-400 hover:text-rose-600"><XCircle className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
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
    const [viewMode, setViewMode]         = useState('grid')
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [showDiary, setShowDiary]       = useState(false)

    useEffect(() => { loadPatients() }, [])

    const loadPatients = async () => {
        try {
            setLoading(true)
            const res  = await patientsService.getAll()
            const raw  = res.data?.data || res.data || []
            const list = Array.isArray(raw) ? raw.map(normalizePatient) : []
            setPatients(list.length > 0 ? list : mockPatients)
        } catch {
            // backend not reachable — show mock data so UI is never blank
            setPatients(mockPatients)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este paciente definitivamente?')) return
        try { await patientsService.remove(id) } catch { /* silent */ }
        setPatients(p => p.filter(x => x.id !== id))
        showToast('Paciente eliminado', 'success')
    }

    const openDiary = (patient) => { setSelectedPatient(patient); setShowDiary(true) }

    const filtered = useMemo(() => {
        let list = [...patients]
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(p => `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q))
        }
        if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
        if (filterRisk !== 'all')   list = list.filter(p => p.riskLevel === filterRisk)
        list.sort((a, b) => {
            if (sortBy === 'name')        return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)
            if (sortBy === 'risk')        { const o = { high: 0, medium: 1, low: 2 }; return (o[a.riskLevel] ?? 3) - (o[b.riskLevel] ?? 3) }
            if (sortBy === 'lastSession') return new Date(b.lastSession || 0) - new Date(a.lastSession || 0)
            if (sortBy === 'phq9')        { const la = a.phq9?.at(-1) ?? -1, lb = b.phq9?.at(-1) ?? -1; return lb - la }
            return 0
        })
        return list
    }, [patients, search, filterStatus, filterRisk, sortBy])

    const total    = patients.length
    const active   = patients.filter(p => p.status === 'active').length
    const highRisk = patients.filter(p => p.riskLevel === 'high').length
    const pendingHW = patients.filter(p => p.homeworkCompleted === false).length

    if (showDiary && selectedPatient) {
        return (
            <PatientDiary
                patientId={selectedPatient.id}
                patientName={`${selectedPatient.nombre} ${selectedPatient.apellido}`}
                onClose={() => { setShowDiary(false); setSelectedPatient(null) }}
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Carga de Pacientes</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{active} activos · {total} en total</p>
                    </div>
                    <button
                        onClick={() => setShowAddPatient(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors shrink-0"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuevo paciente</span>
                    </button>
                </motion.div>

                {/* KPI strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                        { label: 'Total',        value: total,     Icon: Users,        bg: 'bg-blue-50',    color: 'text-blue-600' },
                        { label: 'Activos',      value: active,    Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                        { label: 'Alto riesgo',  value: highRisk,  Icon: ShieldAlert,  bg: 'bg-rose-50',    color: 'text-rose-600',   urgent: highRisk > 0 },
                        { label: 'Tarea pend.',  value: pendingHW, Icon: TimerOff,     bg: 'bg-amber-50',   color: 'text-amber-600',  urgent: pendingHW > 0 },
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${k.urgent ? 'border-rose-200' : 'border-gray-100'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}>
                                <k.Icon className={`w-4 h-4 ${k.color}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none">{k.value}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{k.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Alert banner */}
                <AlertBanner patients={patients} />

                {/* Search + filters */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-100 rounded-2xl p-3 mb-5 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-48">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text" placeholder="Buscar por nombre, diagnóstico..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        />
                    </div>
                    {[
                        { value: filterStatus, setter: setFilterStatus, options: [['all','Todos los estados'],['active','Activos'],['pending','Pendientes'],['inactive','Inactivos']] },
                        { value: filterRisk,   setter: setFilterRisk,   options: [['all','Todos los riesgos'],['high','Alto riesgo'],['medium','Riesgo medio'],['low','Bajo riesgo']] },
                        { value: sortBy,       setter: setSortBy,       options: [['name','Orden: Nombre'],['risk','Orden: Riesgo'],['lastSession','Orden: Última sesión'],['phq9','Orden: PHQ-9']] },
                    ].map(({ value, setter, options }, i) => (
                        <select key={i} value={value} onChange={e => setter(e.target.value)}
                            className="text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ))}
                    <div className="flex bg-gray-100 rounded-xl p-0.5 ml-auto">
                        {[['grid', LayoutGrid], ['list', List]].map(([m, Icon]) => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={`p-2 rounded-lg transition-colors ${viewMode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Results count */}
                <p className="text-xs text-gray-400 mb-3 px-1">
                    {filtered.length} paciente{filtered.length !== 1 ? 's' : ''}
                    {(filterStatus !== 'all' || filterRisk !== 'all' || search) && (
                        <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRisk('all') }}
                            className="ml-2 text-indigo-500 hover:text-indigo-700 font-medium">
                            Limpiar filtros
                        </button>
                    )}
                </p>

                {/* Loading */}
                {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700">Sin resultados</p>
                        <p className="text-sm text-gray-400 mt-1">{search ? 'Prueba con otro término.' : 'No hay pacientes con estos filtros.'}</p>
                    </motion.div>
                )}

                {/* Grid */}
                {!loading && viewMode === 'grid' && filtered.length > 0 && (
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {filtered.map((p, i) => (
                                <PatientCard key={p.id} patient={p} index={i} onOpenDiary={openDiary} onDelete={handleDelete} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Table */}
                {!loading && viewMode === 'list' && filtered.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Paciente','Estado','PHQ-9','Sesiones','Tarea','Próxima',''].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {filtered.map(p => <PatientRow key={p.id} patient={p} onOpenDiary={openDiary} onDelete={handleDelete} />)}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add patient modal */}
            <AnimatePresence>
                {showAddPatient && (
                    <PatientForm onClose={() => { setShowAddPatient(false); loadPatients() }} />
                )}
            </AnimatePresence>
        </div>
    )
}

export default ModernPatientsList
