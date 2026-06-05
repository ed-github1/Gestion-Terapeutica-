import { useState, useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { motion } from 'motion/react'
import {
  PenLine, Save, FileDown, Trash2, CheckCircle2,
  User, Hash, UserCheck, AlertCircle,
} from 'lucide-react'
import { useAuth } from '@features/auth'
import { professionalsService } from '@shared/services/professionalsService'

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSENT_SECTIONS = [
  {
    title: '1. Naturaleza del servicio',
    body:
      'Los servicios de salud mental proporcionados a través de esta plataforma incluyen ' +
      'psicoterapia individual, orientación psicológica y seguimiento clínico mediante ' +
      'teleconsulta. El profesional tratante cuenta con cédula profesional vigente y está ' +
      'habilitado para ejercer en el territorio nacional.',
  },
  {
    title: '2. Limitaciones',
    body:
      'La teleconsulta no sustituye la atención presencial en situaciones de emergencia. ' +
      'En caso de crisis, el paciente debe acudir al servicio de urgencias más cercano o ' +
      'llamar a los servicios de emergencia. El profesional no podrá garantizar ' +
      'disponibilidad inmediata fuera del horario acordado.',
  },
  {
    title: '3. Confidencialidad',
    body:
      'Toda la información compartida en sesión es estrictamente confidencial y está ' +
      'protegida por el secreto profesional, de conformidad con la Ley General de Salud ' +
      'y la normativa vigente en materia de protección de datos personales. Solo podrá ' +
      'revelarse información ante requerimiento legal o riesgo inminente para la vida.',
  },
  {
    title: '4. Consentimiento',
    body:
      'El suscrito declara haber leído y comprendido la información anterior, acepta ' +
      'voluntariamente recibir los servicios de salud mental en modalidad de teleconsulta ' +
      'y autoriza al profesional a crear y conservar un expediente clínico de conformidad ' +
      'con la normativa aplicable.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
        {Icon && <Icon className="inline w-3 h-3 mr-1 -mt-0.5" />}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200
                   dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400
                   focus:ring-2 focus:ring-teal-400 focus:border-transparent transition outline-none"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConsentSigner() {
  const { user } = useAuth()
  const userId = user?._id || user?.id || user?.userId || 'unknown'
  const sigCanvasRef = useRef(null)

  const [doctorName, setDoctorName] = useState(
    user?.name || user?.nombre || '',
  )
  const [cedula, setCedula] = useState(
    user?.licenseNumber || user?.cedula || user?.numeroLicencia || '',
  )
  const [patientName, setPatientName] = useState('')

  const [savedSignature, setSavedSignature] = useState(null)
  const [canvasEmpty, setCanvasEmpty] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadError, setUploadError]   = useState(null)
  const [isSigned, setIsSigned]         = useState(false)
  const [signedSigData, setSignedSigData] = useState(null)

  // Load saved signature into canvas once the ref is ready
  useEffect(() => {
    if (savedSignature && sigCanvasRef.current) {
      sigCanvasRef.current.fromDataURL(savedSignature)
      setCanvasEmpty(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = sigCanvasRef.current?.getCanvas()
    if (!canvas) return
    const sync = () => {
      const w = canvas.offsetWidth
      if (w && w !== canvas.width) {
        canvas.width = w
        sigCanvasRef.current?.clear()
        setCanvasEmpty(true)
      }
    }
    requestAnimationFrame(sync)
    const ro = new ResizeObserver(sync)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const handleCanvasEnd = () => {
    setCanvasEmpty(sigCanvasRef.current?.isEmpty() ?? true)
  }

  const handleClear = () => {
    sigCanvasRef.current?.clear()
    setCanvasEmpty(true)
  }

  const handleSaveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.getCanvas().toDataURL('image/png')
      setSavedSignature(dataUrl)
    }
  }

  const canSign = !canvasEmpty && doctorName.trim() && cedula.trim() && patientName.trim()

  const handleSignDocument = async () => {
    if (!canSign) return
    setIsGenerating(true)
    setUploadError(null)

    try {
      const sigDataUrl = sigCanvasRef.current.getCanvas().toDataURL('image/png')

      const res = await professionalsService.signConsent(sigDataUrl, patientName.trim(), cedula.trim())

      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `consentimiento_${patientName.replace(/\s+/g, '_')}_firmado.pdf`
      a.click()
      URL.revokeObjectURL(url)

      setSignedSigData(sigDataUrl)
      setIsSigned(true)
    } catch {
      setUploadError('No se pudo generar el consentimiento. Por favor inténtalo de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Formatted date for preview ─────────────────────────────────────────────
  const todayDisplay = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl  text-gray-400 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Firmar Consentimiento
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
            Genera y descarga el consentimiento informado firmado digitalmente
          </p>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: document preview ─────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Vista previa del documento
              </span>
            </div>

            <div className="p-6 overflow-y-auto max-h-175 custom-scrollbar text-left">
              {/* Clinic header */}
              <div className="rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 px-5 py-4 mb-5">
                <p className="text-white font-bold text-sm">TotalMente Gestión Terapéutica</p>
                <p className="text-teal-100 text-[11px] mt-0.5">Plataforma de Salud Mental Digital</p>
              </div>

              {/* Title */}
              <h2 className="text-center text-sm font-bold text-teal-700 dark:text-teal-400 mb-1.5 tracking-wide">
                CONSENTIMIENTO INFORMADO
              </h2>
              <div className="h-px bg-teal-400/30 mb-4" />

              {/* Patient / date band */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2 mb-5 flex flex-wrap justify-between gap-1 text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Paciente:{' '}
                  <span className="font-normal text-gray-900 dark:text-gray-100">
                    {patientName || <span className="text-gray-400 italic">sin especificar</span>}
                  </span>
                </span>
                <span className="text-gray-400">{todayDisplay}</span>
              </div>

              {/* Consent sections */}
              <div className="space-y-4">
                {CONSENT_SECTIONS.map((s) => (
                  <div key={s.title}>
                    <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-1">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Signature area in preview */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                {isSigned && signedSigData ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <img
                      src={signedSigData}
                      alt="Firma del médico"
                      className="max-h-16 max-w-50 mb-2"
                    />
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                      Dr./Dra. {doctorName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Cédula Profesional: {cedula}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{todayDisplay}</p>
                  </motion.div>
                ) : (
                  <div className="h-14 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                    <span className="text-xs text-gray-400">La firma aparecerá aquí tras firmar</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 text-center">
                  {isSigned
                    ? `Firmado digitalmente el ${todayDisplay} · TotalMente Gestión Terapéutica`
                    : 'Pendiente de firma · TotalMente Gestión Terapéutica'}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: form + canvas + actions ─────────────────────────── */}
          <div className="space-y-4">

            {/* Form fields */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Datos del documento
              </h3>
              <div className="space-y-3">
                <Field
                  icon={User}
                  label="Nombre completo del médico"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Juan Pérez García"
                />
                <Field
                  icon={Hash}
                  label="Cédula profesional"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="12345678"
                />
                <Field
                  icon={UserCheck}
                  label="Nombre del paciente"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="María López Hernández"
                />
              </div>
            </div>

            {/* Signature canvas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Firma digital
                </h3>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              </div>

              {savedSignature && (
                <div className="mb-3 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400
                                bg-teal-50 dark:bg-teal-900/20 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Firma guardada cargada — puedes redibujarla si lo deseas
                </div>
              )}

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl
                              overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#0d9488"
                  minWidth={1}
                  maxWidth={3}
                  velocityFilterWeight={0.5}
                  canvasProps={{
                    height: 150,
                    style: { width: '100%', display: 'block' },
                    className: 'touch-none',
                  }}
                  onEnd={handleCanvasEnd}
                />
              </div>
              <p className="mt-2 text-[10px] text-gray-400 text-center">
                Dibuja tu firma con el ratón o el dedo
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveSignature}
                disabled={canvasEmpty}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700
                           text-gray-700 dark:text-gray-200 rounded-2xl font-semibold text-sm
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition
                           disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                Guardar firma
              </button>

              <button
                type="button"
                onClick={handleSignDocument}
                disabled={!canSign || isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3
                           bg-linear-to-r from-teal-500 to-cyan-500 text-white rounded-2xl
                           font-bold text-sm hover:from-teal-600 hover:to-cyan-600
                           transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Generando…
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Firmar documento
                  </>
                )}
              </button>
            </div>

            {/* Incomplete-fields hint */}
            {(!doctorName.trim() || !cedula.trim() || !patientName.trim()) && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400
                              bg-amber-50 dark:bg-amber-900/20 border border-amber-200
                              dark:border-amber-700/40 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Completa los tres campos y dibuja tu firma para habilitar el botón de firma
              </div>
            )}

            {/* Upload error warning */}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700
                           rounded-2xl px-4 py-3 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">{uploadError}</p>
              </motion.div>
            )}

            {/* Success banner */}
            {isSigned && !uploadError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700
                           rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                    Documento firmado, descargado y enviado al servidor
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-400">
                    consentimiento_{patientName.replace(/\s+/g, '_')}_firmado.pdf
                  </p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
