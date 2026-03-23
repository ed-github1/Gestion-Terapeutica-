import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2, Clock, ArrowLeft,
  Edit3, Mic, Copy, AlertCircle,
  Video, MapPin, Save, Check,
} from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { ROUTES } from '@shared/constants/routes'

/* ═══════════════════════════════════════════════════════════════
   1. HELPERS
═══════════════════════════════════════════════════════════════ */
const fmtTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
const fmtDuration = (mins) => {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

/* ═══════════════════════════════════════════════════════════════
   2. SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════════════════ */

/** Inline metadata pill rendered inside the hero banner */
const MetaPill = ({ icon: Icon, label, iconColor = 'text-white/60' }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium border border-white/10">
    <Icon className={`w-3 h-3 shrink-0 ${iconColor}`} />
    {label}
  </span>
)

/** Underline-style tab button */
const TabBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-0.5 pt-3 pb-2.75 text-xs font-semibold border-b-2 transition-all ${
      active
        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
        : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
)

/* ═══════════════════════════════════════════════════════════════
   3. TRANSCRIPT SUB-STATES
═══════════════════════════════════════════════════════════════ */
const TranscriptIdle = () => (
  <div className="flex flex-col items-center gap-2 py-6 text-center">
    <Mic className="w-5 h-5 text-gray-300 dark:text-gray-600" />
    <p className="text-xs text-gray-400 dark:text-gray-500">No hay transcripción disponible</p>
  </div>
)

const TranscriptProcessing = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate progress: fast at first, slows down, caps at 92% until ready
    const TOTAL_MS = 150_000 // ~2.5 min estimate
    const TICK_MS  = 400
    const startedAt = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      // Ease-out curve: fast start, slow finish, never reaches 100%
      const raw = 1 - Math.exp(-3.5 * (elapsed / TOTAL_MS))
      setProgress(Math.min(raw * 100, 92))
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [])

  const stages = [
    { at: 0,  label: 'Subiendo audio…' },
    { at: 15, label: 'Analizando audio…' },
    { at: 35, label: 'Transcribiendo…' },
    { at: 65, label: 'Identificando hablantes…' },
    { at: 82, label: 'Finalizando…' },
  ]
  const currentStage = [...stages].reverse().find(s => progress >= s.at) || stages[0]

  return (
    <div className="py-5 space-y-4">
      {/* label + percentage */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">{currentStage.label}</p>
        <span className="text-[10px] font-semibold tabular-nums text-sky-500 dark:text-sky-400">
          {Math.round(progress)}%
        </span>
      </div>

      {/* progress track */}
      <div className="relative h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* animated fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-linear-to-r from-sky-400 to-teal-400 rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        {/* shimmer overlay */}
        <motion.div
          className="absolute inset-y-0 w-16 bg-linear-to-r from-transparent via-white/30 to-transparent"
          animate={{ left: ['-4rem', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'linear', repeatDelay: 0.4 }}
        />
      </div>

      <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center">
        La transcripción puede tardar 1–3 minutos
      </p>
    </div>
  )
}

const TranscriptReady = ({ text, onChange, edited }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-2">
        {edited && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            Editado
          </span>
        )}
        <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <textarea
        rows={18}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-0 outline-none text-sm text-gray-700 dark:text-gray-300 resize-none leading-relaxed focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
      />
    </div>
  )
}

const TranscriptError = () => (
  <div className="flex flex-col items-center gap-2 py-6 text-center">
    <AlertCircle className="w-5 h-5 text-rose-300 dark:text-rose-500" />
    <p className="text-xs text-gray-400 dark:text-gray-500">No se pudo procesar el audio</p>
  </div>
)

/* ═══════════════════════════════════════════════════════════════
   5. MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const SessionSummary = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()

  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [activeTab, setActiveTab]       = useState('manual')
  const [manualNotes, setManualNotes]   = useState('')
  const [savingNotes, setSavingNotes]   = useState(false)
  const [notesSaved, setNotesSaved]     = useState(false)

  const [transcriptState, setTranscriptState]     = useState('idle')
  const [transcript, setTranscript]               = useState('')
  const [transcriptEdited, setTranscriptEdited]   = useState(false)
  const [originalTranscript, setOriginalTranscript] = useState('')
  const pollRef    = useRef(null)
  const idlePollRef = useRef(null)

  /* ── transcript loader ── */
  const applyTranscriptFromData = (data) => {
    const status = data?.transcriptStatus
    const text   = data?.transcript
    if (status === 'ready' && text) {
      setTranscript(text)
      setOriginalTranscript(text)
      setTranscriptState('ready')
    } else if (status === 'processing') {
      setTranscriptState('processing')
    } else if (status === 'failed') {
      setTranscriptState('error')
    } else {
      setTranscriptState('idle')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await appointmentsService.getById(appointmentId)
        const d = res.data?.data ?? res.data ?? res
        setAppointment(d)
        if (d?.sessionNotes) setManualNotes(d.sessionNotes)
        applyTranscriptFromData(d)
      } catch (err) {
        setError(err?.response?.data?.message ?? 'No se pudo cargar la sesión')
      } finally { setLoading(false) }
    })()
  }, [appointmentId])

  // Poll while processing
  useEffect(() => {
    if (transcriptState !== 'processing') { clearInterval(pollRef.current); return }
    pollRef.current = setInterval(async () => {
      try {
        const res = await appointmentsService.getById(appointmentId)
        applyTranscriptFromData(res.data?.data ?? res.data ?? res)
      } catch { /* keep polling */ }
    }, 6000)
    return () => clearInterval(pollRef.current)
  }, [transcriptState, appointmentId])

  // Grace-period poll when idle — handles race where we arrive before backend
  // sets transcriptStatus to 'processing'. Poll for up to 90s after page load.
  useEffect(() => {
    if (transcriptState !== 'idle') { clearInterval(idlePollRef.current); return }
    let attempts = 0
    const MAX_ATTEMPTS = 15 // 15 × 6s = 90 seconds
    idlePollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await appointmentsService.getById(appointmentId)
        applyTranscriptFromData(res.data?.data ?? res.data ?? res)
      } catch { /* ignore */ }
      if (attempts >= MAX_ATTEMPTS) clearInterval(idlePollRef.current)
    }, 6000)
    return () => clearInterval(idlePollRef.current)
  }, [transcriptState, appointmentId])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await appointmentsService.updateSessionNotes(appointmentId, manualNotes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2500)
    } catch { /* retry manually */ } finally { setSavingNotes(false) }
  }

  const handleTranscriptChange = (val) => {
    setTranscript(val)
    setTranscriptEdited(val !== originalTranscript)
  }

  /* ── Loading / Error states ── */
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 max-w-sm w-full text-center">
        <p className="text-rose-500 text-sm mb-3">{error}</p>
        <button onClick={() => navigate(ROUTES.PROFESSIONAL_DASHBOARD)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
          Volver al panel
        </button>
      </div>
    </div>
  )

  /* ── Derived data ── */
  const isCompleted = appointment?.status === 'completed'
  const isVideoCall = appointment?.isVideoCall || appointment?.mode === 'videollamada'
  const sessionType = appointment?.type ?? 'Consulta'
  const startDate   = fmtDate(appointment?.callStartedAt ?? appointment?.fechaHora)
  const startTime   = fmtTime(appointment?.callStartedAt ?? appointment?.fechaHora)
  const endTime     = fmtTime(appointment?.callEndedAt)
  const hasEndTime  = !!appointment?.callEndedAt
  const duration    = fmtDuration(appointment?.callDuration)
  const patientName = appointment?.nombrePaciente ?? appointment?.patient?.name ?? 'Paciente'
  const avatar      = patientName.charAt(0).toUpperCase()

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="bg-transparent dark:bg-gray-900/50 min-h-full">
      <div className="p-2 md:p-3 lg:p-4 max-w-3xl mx-auto">

        {/* ── HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="relative rounded-2xl overflow-hidden mb-4"
        >
          {/* gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900" />
          {/* subtle dot texture */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
          />
          {/* ambient glow */}
          <div className="absolute -top-10 -left-6 w-40 h-40 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative px-5 py-5">
            <div className="flex items-start gap-3">
              {/* back button */}
              <button
                onClick={() => navigate(ROUTES.PROFESSIONAL_DASHBOARD)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors shrink-0 mt-0.5"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* avatar */}
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-sky-300">{avatar}</span>
              </div>

              {/* text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-[15px] font-bold text-white leading-tight truncate">{patientName}</h1>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {isCompleted ? 'Completada' : (appointment?.status ?? '—')}
                  </span>
                </div>
                <p className="text-[11px] text-white/45 mb-3">
                  Resumen de sesión · {startDate}{hasEndTime && ` · ${startTime} – ${endTime}`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <MetaPill icon={Clock} label={duration} />
                  <MetaPill
                    icon={isVideoCall ? Video : MapPin}
                    label={isVideoCall ? 'Videollamada' : 'Presencial'}
                    iconColor={isVideoCall ? 'text-sky-400' : 'text-amber-400'}
                  />
                  <MetaPill icon={Edit3} label={sessionType} iconColor="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── NOTES & TRANSCRIPTION CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          {/* underline tab bar */}
          <div className="px-4 flex items-center gap-5 border-b border-gray-100 dark:border-gray-700">
            <TabBtn active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon={Edit3} label="Notas" />
            <TabBtn active={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')} icon={Mic} label="Transcripción" />
            {activeTab === 'manual' && (
              <div className="ml-auto py-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    notesSaved
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-85'
                  }`}
                >
                  {notesSaved
                    ? <><Check className="w-3 h-3" /> Guardado</>
                    : savingNotes
                    ? 'Guardando…'
                    : <><Save className="w-3 h-3" /> Guardar</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* body */}
          <div className="px-4 pt-4 pb-5">
            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <textarea
                    rows={20}
                    value={manualNotes}
                    onChange={(e) => { setManualNotes(e.target.value); setNotesSaved(false) }}
                    placeholder="Escribe tus notas de la sesión…"
                    className="w-full bg-transparent border-0 outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 resize-none leading-relaxed focus:outline-none"
                  />
                  {/* progress bar */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 dark:bg-sky-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((manualNotes.length / 2000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-300 dark:text-gray-600 tabular-nums shrink-0">{manualNotes.length}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  {transcriptState === 'idle'       && <TranscriptIdle />}
                  {transcriptState === 'processing' && <TranscriptProcessing />}
                  {transcriptState === 'ready'      && <TranscriptReady text={transcript} onChange={handleTranscriptChange} edited={transcriptEdited} />}
                  {transcriptState === 'error'      && <TranscriptError />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

export default SessionSummary
