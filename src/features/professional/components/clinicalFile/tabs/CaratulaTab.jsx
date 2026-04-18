import { User, Mail, Phone, AlertTriangle, Calendar, Video, MessageSquare, FileText, ChevronRight, ClipboardList, Plus, Clock, Circle, CheckCircle2, HeartPulse } from 'lucide-react'
import { rel } from '../constants'

/* ── compact field ─────────────────────────────────────────────────────── */
const Field = ({ label, value, isLink }) => (
  <div>
    <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{label}</p>
    {isLink && value && value !== '—' ? (
      <a href={`mailto:${value}`} className="text-sm text-sky-500 hover:text-sky-600 dark:text-sky-400 break-all mt-1 block">{value}</a>
    ) : (
      <p className={`text-sm mt-1 leading-snug break-all ${value === '—' || value === 'Sin especificar' || value === 'Sin registrar' ? 'text-gray-400 dark:text-gray-500 italic' : 'font-medium text-gray-800 dark:text-gray-100'}`}>
        {value}
      </p>
    )}
  </div>
)

/* ── section card ──────────────────────────────────────────────────────── */
const Card = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5 sm:p-6 ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
)

/* ── medical history row ───────────────────────────────────────────────── */
const MedRow = ({ label, val, detail }) => {
  const answered = val === 'yes' || val === 'no'
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 dark:border-[#2d3748] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{label}</p>
        {val === 'yes' && detail && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic truncate">└ {detail}</p>
        )}
      </div>
      {answered ? (
        <span className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full ${
          val === 'yes'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
        }`}>
          {val === 'yes' ? 'Sí' : 'No'}
        </span>
      ) : (
        <span className="shrink-0 text-xs text-gray-300 dark:text-gray-600 italic">—</span>
      )}
    </div>
  )
}

const CaratulaTab = ({
  p, pFirstName, pLastName, pAge, pPhone, pConcern, pEmergency,
  clinicalNotes,
  hwTasks = [], completedHW = 0, totalHW = 1,
  sessionHistory = [],
  newNote = '', setNewNote, isSubmitting, handleAddNote, error, setError,
  setTab,
}) => {
  const fullName = `${pFirstName} ${pLastName}`.trim() || '—'
  const dob = p.dateOfBirth
    ? new Date(p.dateOfBirth).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Sin registrar'
  const genderMap = { male: 'Masculino', female: 'Femenino', other: 'Otro', 'non-binary': 'No binario' }
  const gender = genderMap[(p.gender || '').toLowerCase()] || p.gender || 'Sin especificar'
  const genderDisplay = p.gender === 'other' && p.genderOther ? p.genderOther : gender

  const yesNo = (val) => val === 'yes' ? 'Sí' : val === 'no' ? 'No' : '—'
  const email = p.email || '—'
  const phone = pPhone || '—'
  const emergency = pEmergency || 'Sin registrar'
  const preferredMode = p.preferredMode || p.modalidad
  const nextSession = p.nextSession
    ? new Date(p.nextSession).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : null
  const pendingTasks = hwTasks.filter(t => !t.completed)
  const allNotes = clinicalNotes

  return (
    <div className="space-y-4">
      {/* Row 1: Personal info + Contact — 2-col grid of compact fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card icon={User} title="Información personal">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2">
              <Field label="Nombre completo" value={fullName} />
            </div>
            <Field label="Edad" value={pAge ? `${pAge} años` : '—'} />
            <Field label="Género" value={genderDisplay} />
            <div className="col-span-2">
              <Field label="Fecha de nacimiento" value={dob} />
            </div>
          </div>
        </Card>

        <Card icon={Mail} title="Contacto">
          <div className="space-y-4">
            <Field label="Correo electrónico" value={email} isLink />
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Teléfono" value={phone} />
              <Field label="Contacto de emergencia" value={emergency} />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Motivo de consulta */}
      {pConcern && (
        <Card icon={MessageSquare} title="Motivo de consulta">
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{pConcern}</p>
        </Card>
      )}

      {/* Row 3: Historial médico */}
      <Card icon={HeartPulse} title="Historial médico">
        <div className="divide-y divide-gray-100 dark:divide-[#2d3748]">
          <MedRow label="¿Ha tomado terapia anteriormente?" val={p.previousTherapy} />
          <MedRow label="¿Tratamiento médico por salud mental?" val={p.previousMentalHealthTreatment} />
          <MedRow label="¿Operación / intervención quirúrgica?" val={p.previousSurgery} detail={p.previousSurgeryDetail} />
          <MedRow label="¿Enfermedad actual?" val={p.currentIllness} detail={p.currentIllnessDetail} />
          <MedRow label="¿Medicamento actual?" val={p.currentMedication} detail={p.currentMedicationDetail} />
          <div className="flex items-center justify-between gap-3 py-3">
            <p className="text-sm text-gray-700 dark:text-gray-200">Nº registro sistema de salud</p>
            <span className={`text-sm font-medium shrink-0 ${p.healthSystemNumber ? 'text-gray-800 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600 italic'}`}>
              {p.healthSystemNumber || '—'}
            </span>
          </div>
        </div>
      </Card>

    </div>
  )
}

export default CaratulaTab
