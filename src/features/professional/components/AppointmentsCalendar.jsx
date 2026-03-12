import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CheckCircle2, Plus, CalendarCheck } from 'lucide-react'
import AvailabilityManager from './AvailabilityManager'
import ModernAppointmentsCalendar from './ModernAppointmentsCalendar'
import AppointmentModal from './AppointmentModal'
import { useCalendarAppointments } from '../hooks'
import { KpiChip, KpiChipSkeleton } from './dashboard'

const AppointmentsCalendar = () => {
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false)
  const [density, setDensity] = useState('spacious')

  const {
    stats, loading, selectedAppointment, isModalOpen, selectedSlot,
    handleSelectSlot, handleSelectEvent, handleEventDrop,
    handleSaveAppointment, handleDeleteAppointment, closeModal,
  } = useCalendarAppointments()

  const kpis = [
    { value: stats.upcomingAppointments, label: 'Próximas',    Icon: Calendar,      iconColor: 'text-sky-400'     },
    { value: stats.completedSessions,    label: 'Completadas', Icon: CheckCircle2,  iconColor: 'text-emerald-400' },
    { value: stats.todaySessions,        label: 'Hoy',         Icon: CalendarCheck, iconColor: 'text-violet-400'  },
    { value: stats.totalAppointments,    label: 'Total citas', Icon: Clock,         iconColor: 'text-violet-400'  },
  ]

  return (
    <div className="bg-transparent">
      <div className="p-3 md:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-4">

        {/* ── Row 1: Page title + action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Agenda de Sesiones</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDensity(d => d === 'compact' ? 'spacious' : 'compact')}
              title={density === 'compact' ? 'Vista espaciosa' : 'Vista compacta'}
              className="p-2 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {density === 'compact' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16" /></svg>
              )}
            </button>
            <button
              onClick={() => handleSelectSlot(new Date())}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva sesión</span>
            </button>
            <button
              onClick={() => setShowAvailabilityManager(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Disponibilidad</span>
            </button>
          </div>
        </motion.div>

        {/* ── Row 2: KPI chips ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
            : kpis.map((k) => <KpiChip key={k.label} {...k} />)
          }
        </motion.div>

        {/* ── Calendar ── */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-gray-900 dark:border-gray-100 border-t-transparent mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-semibold">Cargando agenda…</p>
            </div>
          </div>
        ) : (
          <ModernAppointmentsCalendar
            onSelectEvent={handleSelectEvent}
            onDateClick={handleSelectSlot}
            onEventDrop={handleEventDrop}
            density={density}
          />
        )}

        <AnimatePresence>
          {isModalOpen && (
            <AppointmentModal
              appointment={selectedAppointment ?? selectedSlot}
              onClose={closeModal}
              onSave={handleSaveAppointment}
              onDelete={handleDeleteAppointment}
            />
          )}
          {showAvailabilityManager && (
            <AvailabilityManager
              onClose={() => setShowAvailabilityManager(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AppointmentsCalendar
