import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertCircle, Circle } from 'lucide-react'
import { useClinicalFileData } from './useClinicalFileData'
import { BRAND_GRAD, getInitials, TABS, getAvatarColor } from './constants'
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
    sessionHistory, completedHW, totalHW, totalSessions, authorName, initials,
    fetchData, handleAddNote, handleEntryUpdate,
    handleAssignHomework, handleToggleHomework, handleDeleteHomework,
  } = data

  return (
    <div className="h-full bg-gray-50 dark:bg-[#0f1623] flex flex-col overflow-hidden">
      {/* ── Top header ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-[#1a2234] border-b border-gray-100 dark:border-[#2d3748]">

        {/* Identity row */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${getAvatarColor(patientId || p.id)}`}>
            {initials || '?'}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
              {pFirstName} {pLastName}
            </h2>
            {patientId && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                {`Exp. #${String(patientId).slice(-5).padStart(5, '0')}`}
              </p>
            )}
            {(() => {
              const s = (p.status || '').toLowerCase()
              const isActive = s === 'active' || s === 'activo'
              const isPending = s === 'pending' || s === 'pendiente'
              const color = isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isPending
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              const label = isActive ? 'Activo' : isPending ? 'Pendiente' : p.status || 'Inactivo'
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${color}`}>
                  <Circle className="w-1.5 h-1.5 fill-current" />
                  {label}
                </span>
              )
            })()}
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-5 shrink-0">
            {[
              { value: totalSessions, label: 'SESIONES' },
              { value: `${completedHW}/${totalHW}`, label: 'TAREAS' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Close button */}
          {onClose && (
            <button onClick={onClose}
              className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 rounded-full transition-colors ml-1">
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar pl-4 sm:pl-6 pr-4 pb-2.5 gap-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-lg ${tab === key
                ? 'text-[#0075C9] dark:text-sky-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              {tab === key && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-[#0075C9]/10 dark:bg-sky-400/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{label}</span>
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
            className="p-4 sm:p-5 md:p-6"
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



            {tab === 'tareas' && !isLoading && (
              <HomeworkTab
                hwTasks={hwTasks}
                completedHW={completedHW}
                totalHW={totalHW}
                patientId={patientId}
                onAssign={handleAssignHomework}
                onToggle={handleToggleHomework}
                onDelete={handleDeleteHomework}
              />
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
