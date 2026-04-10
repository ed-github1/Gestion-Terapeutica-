import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertCircle, ArrowLeft, Circle } from 'lucide-react'
import { useClinicalFileData } from './useClinicalFileData'
import { BRAND_GRAD, getInitials, TABS } from './constants'
import CaratulaTab from './tabs/CaratulaTab'
import SummaryTab from './tabs/SummaryTab'
import DiaryTab from './tabs/DiaryTab'
import HomeworkTab from './tabs/HomeworkTab'
import HistorialTab from './tabs/HistorialTab'

const PatientClinicalFile = ({ patient, onClose }) => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('caratula')
  const data = useClinicalFileData(patient)

  const {
    isLoading, error, setError,
    newNote, setNewNote, isSubmitting,
    sessionSummaries,
    p, pFirstName, pLastName, pPhone, pConcern, pEmergency, pAge,
    patientId, diaryEntries, clinicalNotes, hwTasks,
    sessionHistory, completedHW, totalHW, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
  } = data

  return (
    <div className="h-full bg-gray-50 dark:bg-[#0f1623] flex flex-col overflow-hidden">
      {/* ── Top header ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-[#1a2234] border-b border-gray-100 dark:border-[#2d3748]">

        {/* Identity row */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4">
          {/* Back — icon-only, no wasted label */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#0f1623] hover:text-gray-600 dark:hover:text-gray-300 transition shrink-0"
            aria-label="Volver a pacientes"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>

          {/* Avatar */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-linear-to-br ${BRAND_GRAD} flex items-center justify-center text-white text-sm sm:text-base font-black shrink-0 ring-2 ring-white/10`}>
            {getInitials(pFirstName, pLastName)}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
                {pFirstName} {pLastName}
              </h2>
              {(() => {
                const s = (p.status || '').toLowerCase()
                const isActive = s === 'active' || s === 'activo'
                const isPending = s === 'pending' || s === 'pendiente'
                const color = isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : isPending
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                const label = isActive ? 'Activo' : isPending ? 'Pendiente' : p.status || 'Inactivo'
                return (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${color}`}>
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {label}
                  </span>
                )
              })()}
              {p.riskLevel === 'high' && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full shrink-0">
                  <ShieldAlert className="w-3 h-3" /> Alto riesgo
                </span>
              )}
              {p.riskLevel === 'medium' && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                  <AlertCircle className="w-3 h-3" /> Riesgo medio
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
              {pAge ? `${pAge} años` : ''}{pAge && patientId ? ' · ' : ''}{patientId ? `Exp. #${String(patientId).slice(-5).padStart(5, '0')}` : ''}
            </p>
          </div>

          {/* Quick stats — right-aligned, tighter */}
          <div className="flex items-center gap-5 sm:gap-6 shrink-0 pl-2">
            {[
              { value: p.totalSessions ?? sessionHistory.length, label: 'SESIONES' },
              { value: `${completedHW}/${totalHW}`, label: 'TAREAS' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center min-w-10">
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar pl-4 sm:pl-6 pr-4 -mb-px">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${tab === key
                  ? 'text-[#0075C9] dark:text-sky-400 border-[#0075C9] dark:border-sky-400'
                  : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto dark:bg-[#0f1623] custom-scrollbar">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="p-3 sm:p-5 md:p-7"
          >
            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] p-5 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-[#2d3748]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-[#2d3748] rounded w-1/3" />
                        <div className="h-3 bg-gray-100 dark:bg-[#0f1623] rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'caratula' && !isLoading && (
              <CaratulaTab
                p={p} pFirstName={pFirstName} pLastName={pLastName} pAge={pAge}
                pPhone={pPhone} pConcern={pConcern} pEmergency={pEmergency}
                clinicalNotes={clinicalNotes}
                hwTasks={hwTasks} completedHW={completedHW} totalHW={totalHW}
                sessionHistory={sessionHistory}
                newNote={newNote} setNewNote={setNewNote} isSubmitting={isSubmitting}
                handleAddNote={handleAddNote} error={error} setError={setError}
                setTab={setTab}
              />
            )}

        
            {tab === 'diary' && !isLoading && (
              <DiaryTab diaryEntries={diaryEntries} patientId={patientId} authorName={authorName} handleEntryUpdate={handleEntryUpdate} />
            )}

         

            {tab === 'historial' && !isLoading && (
              <HistorialTab
                clinicalNotes={clinicalNotes}
                sessionSummaries={sessionSummaries} navigate={navigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PatientClinicalFile
