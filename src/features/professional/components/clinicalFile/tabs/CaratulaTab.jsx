import { FileText, ChevronRight } from 'lucide-react'
import { rel } from '../constants'

const CaratulaTab = ({
  p, pFirstName, pLastName, pAge, pPhone, pConcern, pEmergency,
  clinicalNotes, mockClinicalNotes, setTab,
}) => (
  <div className="space-y-5">
    {/* Datos del paciente */}
    <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5">
      <div className="mb-5">
        <h3 className="font-bold text-gray-900 dark:text-white">Datos del paciente</h3>
      </div>
      <div className="space-y-3 divide-y divide-gray-50 dark:divide-[#2d3748]">
        {[
          { label: 'Nombre',                 value: `${pFirstName} ${pLastName}`.trim() || '—' },
          { label: 'Edad',                   value: pAge ? `${pAge} años` : '—' },
          { label: 'Género',                 value: p.gender || '—' },
          { label: 'Email',                  value: p.email || '—' },
          { label: 'Teléfono',               value: pPhone || '—' },
          { label: 'Contacto de emergencia', value: pEmergency || '—' },
          { label: 'Motivo de consulta',     value: pConcern || '—' },
          { label: 'Diagnóstico',            value: p.diagnosis && p.diagnosis !== 'Pendiente' ? p.diagnosis : '—' },
        ].filter(({ value }) => value !== '—' || true).map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[160px_1fr] gap-3 items-baseline pt-2.5 first:pt-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">{label}:</span>
            <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Notas recientes */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white">Notas recientes</h3>
        <button
          onClick={() => setTab('notes')}
          className="text-xs text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
        >
          Ver todas <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {(clinicalNotes.length > 0 ? clinicalNotes : mockClinicalNotes).slice(0, 3).map((note, i) => {
        const dateStr = note.date || note.createdAt
        return (
          <div key={note._id || note.id || i} className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4 mb-3 last:mb-0">
            {dateStr && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
                {new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.text || note.notes}</p>
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
          <FileText className="w-8 h-8 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Sin notas clínicas aún</p>
        </div>
      )}
    </div>
  </div>
)

export default CaratulaTab
