import { User, Mail, Phone, AlertTriangle, Calendar, Video, MessageSquare, FileText, ChevronRight, ClipboardList, Plus, Clock, Circle, CheckCircle2 } from 'lucide-react'
import { rel } from '../constants'

/* ── compact field ─────────────────────────────────────────────────────── */
const Field = ({ label, value, isLink }) => (
  <div>
    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none">{label}</p>
    {isLink && value && value !== '—' ? (
      <a href={`mailto:${value}`} className="text-[13px] text-sky-500 hover:text-sky-600 dark:text-sky-400 break-all mt-0.5 block">{value}</a>
    ) : (
      <p className={`text-[13px] mt-0.5 leading-snug break-all ${value === '—' || value === 'Sin especificar' || value === 'Sin registrar' ? 'text-gray-400 dark:text-gray-500 italic' : 'font-medium text-gray-800 dark:text-gray-100'}`}>
        {value}
      </p>
    )}
  </div>
)

/* ── section card ──────────────────────────────────────────────────────── */
const Card = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4 sm:p-5 ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
)

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
  const genderMap = { male: 'Masculino', female: 'Femenino', other: 'Otro', 'no-binary': 'No binario' }
  const gender = genderMap[(p.gender || '').toLowerCase()] || p.gender || 'Sin especificar'
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <Field label="Nombre completo" value={fullName} />
            </div>
            <Field label="Edad" value={pAge ? `${pAge} años` : '—'} />
            <Field label="Género" value={gender} />
            <div className="col-span-2">
              <Field label="Fecha de nacimiento" value={dob} />
            </div>
          </div>
        </Card>

        <Card icon={Mail} title="Contacto">
          <div className="space-y-3">
            <Field label="Correo electrónico" value={email} isLink />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Teléfono" value={phone} />
              <Field label="Contacto de emergencia" value={emergency} />
            </div>
          </div>
        </Card>
      </div>

    </div>
  )
}

export default CaratulaTab
