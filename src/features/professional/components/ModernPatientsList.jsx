// ─── REDESIGNED: ModernPatientsList ──────────────────────────────────────────
// Clinical caseload view — not a generic contact list.
// Displays risk levels, homework status, insurance sessions,
// treatment goals, and outcome trends for each patient.
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { showToast } from '@components'
import { patientsService } from '@shared/services/patientsService'
import { invitationsService } from '@shared/services/invitationsService'
import PatientInvitation from './PatientInvitation'
import PatientClinicalFile from './PatientClinicalFile'
import {
    Users, UserPlus, Search, RefreshCw,
    LayoutGrid, List, ShieldAlert,
    BookOpen, MessageSquare, CalendarPlus, Calendar,
    ChevronRight, Minus,
    Clock, MoreHorizontal, CheckCircle2,
    XCircle, TimerOff
} from 'lucide-react'

// ─── Normalize backend patient → UI shape ────────────────────────────────────
// Backend uses firstName/lastName/_id; UI uses nombre/apellido/id.
// Clinical fields (riskLevel, etc.) not yet on backend default to null.
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
    treatmentGoal:     p.presentingConcern || p.treatmentGoal || '',
    homeworkCompleted: p.homeworkCompleted ?? null,
    diagnosis:         p.diagnosis  || (p.status === 'pending' ? 'Pendiente' : '—'),
    insuranceRemaining: p.insuranceRemaining ?? null,
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

// ─── Patient Card ─────────────────────────────────────────────────────────────
const PatientCard = ({ patient, onOpenDiary, onDelete, index }) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const status = statusConfig[patient.status] || statusConfig.inactive

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow ${
                patient.riskLevel === 'high' ? 'border-rose-200 dark:border-rose-800' : 'border-gray-200 dark:border-gray-700'
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
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{patient.nombre} {patient.apellido}</p>
                            {patient.riskLevel === 'high' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                            </span>
                            {patient.diagnosis && patient.diagnosis !== 'Pendiente' && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{patient.diagnosis}{patient.age ? ` · ${patient.age}a` : ''}</span>
                            )}
                        </div>
                    </div>
                    <div className="relative shrink-0">
                        <button onClick={() => setMenuOpen(o => !o)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-7 z-20 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg rounded-xl py-1 w-44"
                                >
                                    {[
                                        { icon: BookOpen,     label: 'Ver expediente', action: () => { onOpenDiary(patient); setMenuOpen(false) } },
                                        { icon: CalendarPlus, label: 'Agendar sesión',  action: () => setMenuOpen(false) },
                                        { icon: MessageSquare, label: 'Mensaje',        action: () => setMenuOpen(false) },
                                    ].map(({ icon: Icon, label, action }) => (
                                        <button key={label} onClick={action} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Icon className="w-3.5 h-3.5" /> {label}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                    <button onClick={() => { onDelete(patient.id); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                        <XCircle className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{patient.totalSessions}</p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sesiones</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{daysSince(patient.lastSession) || '—'}</p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Última</p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center ${patient.insuranceRemaining !== null && patient.insuranceRemaining <= 3 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                        <p className={`text-sm font-bold ${patient.insuranceRemaining !== null && patient.insuranceRemaining <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {patient.insuranceRemaining ?? '∞'}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Seguro</p>
                    </div>
                </div>

                {/* Homework + next */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                    {patient.homeworkCompleted === true  && <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Tarea entregada</span>}
                    {patient.homeworkCompleted === false && <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500"><XCircle className="w-3 h-3" /> Tarea pendiente</span>}
                    {patient.homeworkCompleted === null  && <span className="text-[10px] text-gray-300 dark:text-gray-600">Sin tarea</span>}
                    {patient.nextSession && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(patient.nextSession).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer CTA */}
            <button
                onClick={() => onOpenDiary(patient)}
                className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs font-semibold text-[#0075C9] dark:text-sky-400 hover:bg-[#0075C9]/5 dark:hover:bg-sky-400/10 hover:text-[#005fa0] dark:hover:text-sky-300 transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" /> Ver expediente <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
        </motion.div>
    )
}

// ─── Patient Row (table) ──────────────────────────────────────────────────────
const PatientRow = ({ patient, onOpenDiary, onDelete }) => {
    const status = statusConfig[patient.status] || statusConfig.inactive

    return (
        <tr className="group hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(patient.id)}`}>
                        {getInitials(patient.nombre, patient.apellido)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{patient.nombre} {patient.apellido}</p>
                            {patient.riskLevel === 'high' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{patient.diagnosis} · {patient.age}a</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
            </td>
            <td className="px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{patient.totalSessions}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{daysSince(patient.lastSession) || 'Sin sesiones'}</p>
            </td>
            <td className="px-5 py-3.5">
                {patient.homeworkCompleted === true  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {patient.homeworkCompleted === false && <XCircle className="w-4 h-4 text-rose-400" />}
                {patient.homeworkCompleted === null  && <Minus className="w-4 h-4 text-gray-300" />}
            </td>
            <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                {patient.nextSession
                    ? new Date(patient.nextSession).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : <span className="text-gray-300 dark:text-gray-600">—</span>}
            </td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onOpenDiary(patient)} title="Ver expediente" className="p-1.5 hover:bg-sky-50 rounded-lg transition-colors text-gray-400 hover:text-[#0075C9]"><BookOpen className="w-4 h-4" /></button>
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
            return 0
        })
        console.log('[PatientsList] filtered list:', list.length, 'filterStatus:', filterStatus, 'filterRisk:', filterRisk, 'patients in state:', patients.length)
        return list
    }, [patients, search, filterStatus, filterRisk, sortBy])

    const total    = patients.length
    const active   = patients.filter(p => p.status === 'active').length
    const highRisk = patients.filter(p => p.riskLevel === 'high').length
    const pendingHW = patients.filter(p => p.homeworkCompleted === false).length

    return (
        <>
        <div className="bg-transparent">
            <div className="p-3 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">

                {/* KPI chips */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {[
                            { label: 'Pacientes', value: total,     icon: Users,       iconColor: 'text-blue-400'    },
                            { label: 'Activos',   value: active,    icon: Users,       iconColor: 'text-sky-400'     },
                            { label: 'Alto riesgo', value: highRisk, icon: ShieldAlert, iconColor: 'text-rose-400'   },
                            { label: 'Tarea pend.', value: pendingHW, icon: BookOpen,  iconColor: 'text-amber-400'   },
                        ].map(({ label, value, icon: Icon, iconColor }) => (
                            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 pt-2.5 pb-3 w-full flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Icon size={12} className={iconColor} strokeWidth={2.5} />
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">{label}</span>
                                </div>
                                <p className="text-[22px] font-black text-gray-900 dark:text-white leading-none tabular-nums tracking-tight">{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <button
                            onClick={loadPatients}
                            title="Actualizar"
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowAddPatient(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0075C9] text-white rounded-xl text-xs font-semibold hover:bg-[#005fa0] transition-colors"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nuevo paciente</span>
                        </button>
                    </div>
                </motion.div>

                {/* Alert banner */}
                <AlertBanner patients={patients} />

                {/* Search + filters */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-48">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text" placeholder="Buscar por nombre, diagnóstico..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0075C9]/20 focus:border-[#0075C9] dark:focus:border-sky-500"
                        />
                    </div>
                    {[
                        { value: filterStatus, setter: setFilterStatus, options: [['all','Todos los estados'],['active','Activos'],['pending','Pendientes'],['inactive','Inactivos'],['invited','Invitados']] },
                        { value: filterRisk,   setter: setFilterRisk,   options: [['all','Todos los riesgos'],['high','Alto riesgo'],['medium','Riesgo medio'],['low','Bajo riesgo']] },
                        { value: sortBy,       setter: setSortBy,       options: [['name','Orden: Nombre'],['risk','Orden: Riesgo'],['lastSession','Orden: Última sesión']] },
                    ].map(({ value, setter, options }, i) => (
                        <select key={i} value={value} onChange={e => setter(e.target.value)}
                            className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0075C9]/20">
                            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ))}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5 ml-auto">
                        {[['grid', LayoutGrid], ['list', List]].map(([m, Icon]) => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={`p-2 rounded-lg transition-colors ${viewMode === m ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Results count */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">
                    {filtered.length} paciente{filtered.length !== 1 ? 's' : ''}
                    {(filterStatus !== 'all' || filterRisk !== 'all' || search) && (
                        <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRisk('all') }}
                            className="ml-2 text-[#0075C9] hover:text-[#005fa0] font-medium">
                            Limpiar filtros
                        </button>
                    )}
                </p>

                {/* Loading */}
                {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0075C9] border-t-transparent rounded-full animate-spin" /></div>}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
                        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Sin resultados</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{search ? 'Prueba con otro término.' : 'No hay pacientes con estos filtros.'}</p>
                        {patients.length > 0 && (filterStatus !== 'all' || filterRisk !== 'all') && (
                            <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRisk('all') }}
                                className="mt-3 text-sm text-blue-700 hover:underline">
                                Limpiar filtros ({patients.length} paciente{patients.length !== 1 ? 's' : ''} en total)
                            </button>
                        )}
                        {patients.length === 0 && !search && (
                            <p className="text-xs text-gray-300 mt-3">Revisa la consola del navegador (F12) para ver la respuesta de la API</p>
                        )}
                    </motion.div>
                )}

                {/* Grid */}
                {!loading && viewMode === 'grid' && filtered.length > 0 && (
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">  
                        <AnimatePresence>
                            {filtered.map((p, i) => {
                                console.log('[PatientsList] rendering card for:', p.nombre, p.apellido, 'id:', p.id, 'status:', p.status)
                                return <PatientCard key={p.id ?? i} patient={p} index={i} onOpenDiary={openDiary} onDelete={handleDelete} />
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Table */}
                {!loading && viewMode === 'list' && filtered.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                        <table className="w-full min-w-195 text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    {['Paciente','Estado','Sesiones','Tarea','Próxima',''].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
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
                    <PatientInvitation 
                        onClose={() => { setShowAddPatient(false); loadPatients() }} 
                        onSuccess={() => { setShowAddPatient(false); loadPatients() }}
                    />
                )}
            </AnimatePresence>
        </div>

        {/* Clinical file drawer */}
        <AnimatePresence>
            {showDiary && selectedPatient && (
                <PatientClinicalFile
                    patient={selectedPatient}
                    onClose={() => { setShowDiary(false); setSelectedPatient(null) }}
                />
            )}
        </AnimatePresence>
        </>
    )
}

export default ModernPatientsList
