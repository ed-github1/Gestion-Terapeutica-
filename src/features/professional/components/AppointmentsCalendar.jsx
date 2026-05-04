import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CheckCircle2, CalendarCheck, Plus } from 'lucide-react'
import AvailabilityManager from './AvailabilityManager'
import ModernAppointmentsCalendar from './ModernAppointmentsCalendar'
import AddEventPanel from './calendar/AddEventPanel'
import AppointmentDetailPanel from './calendar/AppointmentDetailPanel'
import RatesPanel from './calendar/RatesPanel'
import { useCalendarAppointments } from '../hooks'
import { KpiChip, KpiChipSkeleton } from './dashboard'

const AppointmentsCalendar = () => {
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false)
  const [showRatesPanel, setShowRatesPanel] = useState(false)
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

        {/* ── KPI chips — horizontal scroll on mobile, grid on sm+ ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 overflow-x-auto pb-0.5 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-37 sm:min-w-0 shrink-0 sm:shrink">
                  <KpiChipSkeleton />
                </div>
              ))
            : kpis.map((k) => (
                <div key={k.label} className="min-w-37 sm:min-w-0 shrink-0 sm:shrink">
                  <KpiChip {...k} />
                </div>
              ))
          }
        </motion.div>

        {/* ── Calendar (includes custom toolbar) ── */}
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
            onAddEvent={() => handleSelectSlot(new Date())}
            onToggleAvailability={() => setShowAvailabilityManager(true)}
            onToggleRates={() => setShowRatesPanel(true)}
            density={density}
          />
        )}

        {/* ── Panels ── */}
        <AnimatePresence>
          {/* Existing event → read-only detail */}
          {isModalOpen && selectedAppointment && !selectedSlot && (
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              onClose={closeModal}
            />
          )}
          {/* Empty slot → create form */}
          {isModalOpen && selectedSlot && !selectedAppointment && (
            <AddEventPanel
              slotDate={selectedSlot?.start}
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
          {showRatesPanel && (
            <RatesPanel
              onClose={() => setShowRatesPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── FAB — Nueva Sesión (mobile only, above bottom nav) ── */}
      {/* <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.15 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => handleSelectSlot(new Date())}
        className="sm:hidden fixed bottom-21 right-4 z-40 flex items-center gap-2 pl-4 pr-5 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-full shadow-lg shadow-blue-600/40 transition-colors"
        aria-label="Nueva Sesión"
      >
        <Plus className="w-4 h-4 shrink-0" />
        Nueva Sesión
      </motion.button> */}
    </div>
  )
}

export default AppointmentsCalendar
