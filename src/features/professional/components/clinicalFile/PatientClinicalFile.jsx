import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertCircle, ChevronLeft } from 'lucide-react'
import { useClinicalFileData } from './useClinicalFileData'
import { BRAND_GRAD, getInitials, TABS } from './constants'
import CaratulaTab from './tabs/CaratulaTab'
import SummaryTab from './tabs/SummaryTab'
import DiaryTab from './tabs/DiaryTab'
import HomeworkTab from './tabs/HomeworkTab'
import NotesTab from './tabs/NotesTab'
import SummariesTab from './tabs/SummariesTab'
import SessionsTab from './tabs/SessionsTab'

const PatientClinicalFile = ({ patient, onClose }) => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('caratula')
  const data = useClinicalFileData(patient)

  const {
    isLoading, error, setError,
    newNote, setNewNote, isSubmitting,
    sessionSummaries,
    p, pFirstName, pLastName, pPhone, pConcern, pEmergency, pAge,
    patientId, diaryEntries, clinicalNotes, mockClinicalNotes, hwTasks,
    sessionHistory, completedHW, totalHW, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
  } = data

  return (
    <div className="h-full bg-gray-50 dark:bg-[#0f1623] flex flex-col overflow-hidden">
        {/* ── Top header ─────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white dark:bg-[#1a2234] border-b border-gray-100 dark:border-[#2d3748]">
          {/* Brand accent bar */}
          <div className={`h-1 bg-linear-to-r ${BRAND_GRAD}`} />

          {/* Back */}
          <div className="px-6 pt-4 mb-4">
            <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition">
              <ChevronLeft className="w-4 h-4" /> Volver a pacientes
            </button>
          </div>

          {/* Patient identity */}
          <div className="flex items-center gap-4 px-6 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${BRAND_GRAD} flex items-center justify-center text-white text-lg font-black shrink-0`}>
              {getInitials(pFirstName, pLastName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-gray-900 dark:text-white truncate">
                {pFirstName} {pLastName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {pAge && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{pAge} años</span>
                )}
                {p.diagnosis && p.diagnosis !== 'Pendiente' && (
                  <span className="text-xs font-semibold text-blue-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full">
                    {p.diagnosis}
                  </span>
                )}
                {p.riskLevel === 'high' && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                    <ShieldAlert className="w-3 h-3" /> Alto riesgo
                  </span>
                )}
                {p.riskLevel === 'medium' && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Riesgo medio
                  </span>
                )}
              </div>
            </div>
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              {[
                { value: p.totalSessions ?? sessionHistory.length, label: 'Sesiones' },
                { value: `${completedHW}/${totalHW}`, label: 'Tareas' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 overflow-x-auto no-scrollbar px-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  tab === key
                    ? 'text-[#0075C9] dark:text-sky-400 border-b-2 border-[#0075C9] dark:border-sky-400 bg-sky-50/50 dark:bg-sky-900/10'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0f1623]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
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
              className="p-5 md:p-7"
            >
              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-3 p-5">
                  {[1,2,3].map(i => (
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
                  clinicalNotes={clinicalNotes} mockClinicalNotes={mockClinicalNotes}
                  setTab={setTab}
                />
              )}

              {tab === 'summary' && !isLoading && (
                <SummaryTab
                  p={p} pConcern={pConcern} pPhone={pPhone}
                  error={error} setError={setError} fetchData={fetchData}
                  sessionHistory={sessionHistory} hwTasks={hwTasks}
                  completedHW={completedHW} totalHW={totalHW}
                  diaryEntries={diaryEntries} clinicalNotes={clinicalNotes}
                  patientId={patientId} authorName={authorName}
                  handleEntryUpdate={handleEntryUpdate} setTab={setTab}
                />
              )}

              {tab === 'diary' && !isLoading && (
                <DiaryTab diaryEntries={diaryEntries} patientId={patientId} authorName={authorName} handleEntryUpdate={handleEntryUpdate} />
              )}

              {tab === 'homework' && !isLoading && (
                <HomeworkTab hwTasks={hwTasks} completedHW={completedHW} totalHW={totalHW} />
              )}

              {tab === 'notes' && !isLoading && (
                <NotesTab
                  pFirstName={pFirstName} clinicalNotes={clinicalNotes}
                  newNote={newNote} setNewNote={setNewNote} isSubmitting={isSubmitting}
                  handleAddNote={handleAddNote} error={error} setError={setError}
                />
              )}

              {tab === 'summaries' && !isLoading && (
                <SummariesTab sessionSummaries={sessionSummaries} navigate={navigate} />
              )}

              {tab === 'sessions' && !isLoading && (
                <SessionsTab sessionHistory={sessionHistory} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
  )
}

export default PatientClinicalFile
