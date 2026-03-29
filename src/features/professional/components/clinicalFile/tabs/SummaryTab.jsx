import { motion } from 'motion/react'
import {
  AlertCircle, Calendar, CheckCircle2, BookOpen, Target, User, Mail, Phone,
  Clock, ChevronRight,
} from 'lucide-react'
import { rel } from '../constants'
import DiaryCard from '../cards/DiaryCard'

const SummaryTab = ({
  p, pConcern, pPhone,
  error, setError, fetchData,
  sessionHistory, hwTasks, completedHW, totalHW,
  diaryEntries, clinicalNotes,
  patientId, authorName, handleEntryUpdate, setTab,
}) => (
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
          label: 'Sesiones totales', value: p.totalSessions ?? sessionHistory.length,
          sub: p.lastSession ? `Última: ${rel(p.lastSession)}` : null,
          Icon: Calendar, bg: 'bg-sky-50', color: 'text-blue-700',
        },
        {
          label: 'Tareas completas', value: hwTasks.length ? `${completedHW}/${hwTasks.length}` : '—',
          sub: hwTasks.length ? `${Math.round((completedHW / totalHW) * 100)}% adherencia` : 'Sin tareas',
          Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600',
        },
        {
          label: 'Entradas diario', value: diaryEntries.length || '—',
          sub: clinicalNotes.length ? `${clinicalNotes.length} notas clínicas` : null,
          Icon: BookOpen, bg: 'bg-sky-50', color: 'text-sky-600',
        },
      ].map(({ label, value, sub, Icon, bg, color }) => (
        <div key={label} className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-4 flex flex-col gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-semibold">{label}</p>
            {sub && <p className={`text-[10px] mt-0.5 font-medium ${color}`}>{sub}</p>}
          </div>
        </div>
      ))}
    </div>

    {/* Treatment goal + contact */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-sky-500" />
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Objetivo terapéutico</h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {pConcern || 'No definido aún.'}
        </p>
      </div>
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-sky-500" />
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Datos de contacto</h3>
        </div>
        <div className="space-y-2">
          {p.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" /> {p.email}
            </div>
          )}
          {pPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" /> {pPhone}
            </div>
          )}
          {p.nextSession && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" /> {new Date(p.nextSession).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Latest diary highlight */}
    {diaryEntries[0] && (
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Última entrada del diario</h3>
          </div>
          <button onClick={() => setTab('diary')} className="text-xs text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5">
            Ver todo <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <DiaryCard entry={diaryEntries[0]} patientId={patientId} authorName={authorName} onUpdate={handleEntryUpdate} />
      </div>
    )}
  </div>
)

export default SummaryTab
