import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2, Clock, ArrowLeft, Calendar,
  Edit3, Mic, Copy, AlertCircle, MessageSquare,
  Video, MapPin, Save, Check, RefreshCw,
} from 'lucide-react'
import { appointmentsService } from '@shared/services/appointmentsService'
import { ROUTES } from '@shared/constants/routes'
import { resolvePatientName } from '../utils/dashboardUtils'

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

/** Sidebar metadata row with icon, label, and value */
const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-8 h-8 rounded-lg bg-gray-700/50 dark:bg-gray-700/80 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500 dark:text-gray-500 leading-tight">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{value}</p>
    </div>
  </div>
)

/** Underline-style tab button */
const TabBtn = ({ active, onClick, icon: Icon, label, indicator }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex items-center gap-1.5 px-0.5 pt-3 pb-2.75 text-xs font-semibold border-b-2 transition-all ${
      active
        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
        : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    {indicator === 'processing' && (
      <span className="relative flex w-2 h-2 ml-0.5" aria-label="Procesando">
        <span className="absolute inset-0 rounded-full bg-sky-400 opacity-75 animate-ping" />
        <span className="relative w-2 h-2 rounded-full bg-sky-500" />
      </span>
    )}
    {indicator === 'ready' && !active && (
      <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" aria-label="Lista" />
    )}
  </button>
)

/* ═══════════════════════════════════════════════════════════════
   3. TRANSCRIPT SUB-STATES
═══════════════════════════════════════════════════════════════ */
const TranscriptIdle = () => (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center">
      <Mic className="w-6 h-6 text-gray-300 dark:text-gray-500" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Sin transcripción</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
        Esta sesión no tiene audio grabado. Activa la grabación automática para futuras consultas.
      </p>
    </div>
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

const TranscriptError = ({ variant = 'failed' }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center max-w-sm mx-auto">
    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-1">
      <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
    </div>
    {variant === 'empty' ? (
      <>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transcripción vacía</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
          El servicio marcó la transcripción como lista pero no devolvió texto.
          Es posible que el audio no contenga voz reconocible o que falle el
          guardado en el servidor. Revisa los logs del backend del trabajo
          indicado en <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">transcriptJobId</code>.
        </p>
      </>
    ) : (
      <>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No se pudo procesar el audio</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">Intenta de nuevo desde una próxima sesión grabada.</p>
      </>
    )}
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
  const [errorVariant, setErrorVariant] = useState('failed')
  const pollRef    = useRef(null)
  const idlePollRef = useRef(null)
  const userPickedTabRef = useRef(false)

  // Auto-focus the Transcripción tab the first time it has content
  // (processing or ready). Does NOT override a manual tab selection.
  useEffect(() => {
    if (userPickedTabRef.current) return
    if (transcriptState === 'ready' || transcriptState === 'processing') {
      setActiveTab('transcript')
    }
  }, [transcriptState])

  const handleTabChange = (tab) => {
    userPickedTabRef.current = true
    setActiveTab(tab)
  }

  /* ── transcript loader ── */
  const applyTranscriptFromData = (data) => {
    // Accept several possible field names from different backend versions.
    const status = data?.transcriptStatus ?? data?.transcription?.status
    const text =
      data?.transcript ||
      data?.transcriptText ||
      data?.transcription?.text ||
      data?.transcription ||
      ''
    // eslint-disable-next-line no-console
    console.debug('[SessionSummary] transcript fields', {
      transcriptStatus: status,
      hasTranscript: !!text,
      transcriptLength: typeof text === 'string' ? text.length : null,
      keys: data ? Object.keys(data) : [],
    })
    if (typeof text === 'string' && text.trim()) {
      setTranscript(text)
      setOriginalTranscript(text)
      setTranscriptState('ready')
    } else if (status === 'processing' || status === 'pending' || status === 'submitted') {
      setTranscriptState('processing')
    } else if (status === 'failed' || status === 'error') {
      setErrorVariant('failed')
      setTranscriptState('error')
    } else if (status === 'completed' || status === 'done' || status === 'ready') {
      // Backend finished but the transcript text is missing/empty.
      // Surface as a distinct error so the user isn't stuck on "processing".
      console.warn('[SessionSummary] Transcription marked', status, 'but transcript text is empty. Response keys:', data ? Object.keys(data) : [])
      setErrorVariant('empty')
      setTranscriptState('error')
    } else {
      setTranscriptState('idle')
    }
  }

  const reloadAppointment = async () => {
    try {
      const res = await appointmentsService.getById(appointmentId)
      const d = res.data?.data ?? res.data ?? res
      setAppointment(d)
      applyTranscriptFromData(d)
    } catch {
      /* ignore */
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
  const startDate   = fmtDate(appointment?.callStartedAt ?? appointment?.fechaHora)
  const startTime   = fmtTime(appointment?.callStartedAt ?? appointment?.fechaHora)
  const endTime     = fmtTime(appointment?.callEndedAt)
  const hasEndTime  = !!appointment?.callEndedAt
  const duration    = fmtDuration(appointment?.callDuration)
  const patientName = resolvePatientName(appointment)
  const avatar      = patientName.charAt(0).toUpperCase()
  const timeRange   = hasEndTime ? `${startTime} – ${endTime}` : startTime

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-full">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">

        {/* ── LEFT SIDEBAR ── */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28 }}
          className="w-full md:w-72 lg:w-80 shrink-0 bg-white dark:bg-gray-800/60 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/60 p-5 md:p-6"
        >
          {/* Back link */}
          <button
            onClick={() => navigate(ROUTES.PROFESSIONAL_DASHBOARD)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Sesiones
          </button>

          {/* Avatar + name + status */}
          <div className="flex flex-col items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
              <span className="text-lg font-bold text-white">{avatar}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1.5">{patientName}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isCompleted ? 'Completada' : (appointment?.status ?? '—')}
            </span>
          </div>

          {/* Metadata */}
          <div className="space-y-1 border-t border-gray-100 dark:border-gray-700/50 pt-4">
            <MetaRow icon={Clock} label="Duración" value={duration} />
            <MetaRow icon={Calendar} label="Fecha" value={startDate} />
            <MetaRow icon={MessageSquare} label="Horario" value={timeRange} />
          </div>
        </motion.aside>

        {/* ── RIGHT CONTENT ── */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.28 }}
          className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900/50"
        >
          {/* Tab bar */}
          <div className="px-6 flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
            <TabBtn active={activeTab === 'manual'} onClick={() => handleTabChange('manual')} icon={Edit3} label="Notas" />
            <TabBtn
              active={activeTab === 'transcript'}
              onClick={() => handleTabChange('transcript')}
              icon={Mic}
              label="Transcripción"
              indicator={transcriptState === 'processing' ? 'processing' : transcriptState === 'ready' ? 'ready' : null}
            />
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
            {activeTab === 'transcript' && transcriptState !== 'ready' && (
              <div className="ml-auto py-2">
                <button
                  type="button"
                  onClick={reloadAppointment}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Volver a comprobar"
                >
                  <RefreshCw className="w-3 h-3" />
                  Actualizar
                </button>
              </div>
            )}
          </div>

          {/* Content body */}
          <div className="px-6 pt-5 pb-6">
            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <textarea
                    rows={20}
                    value={manualNotes}
                    onChange={(e) => { setManualNotes(e.target.value); setNotesSaved(false) }}
                    placeholder="Escribe tus notas de la sesión…"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 resize-none leading-relaxed focus:border-sky-400 dark:focus:border-sky-500 transition-colors"
                  />
                  {/* progress bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 dark:bg-sky-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((manualNotes.length / 2000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-gray-600 tabular-nums shrink-0">{manualNotes.length}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  {transcriptState === 'idle'       && <TranscriptIdle />}
                  {transcriptState === 'processing' && <TranscriptProcessing />}
                  {transcriptState === 'ready'      && <TranscriptReady text={transcript} onChange={handleTranscriptChange} edited={transcriptEdited} />}
                  {transcriptState === 'error'      && <TranscriptError variant={errorVariant} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.main>

      </div>
    </div>
  )
}

export default SessionSummary
