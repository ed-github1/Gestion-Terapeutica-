import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, CheckCircle2, CalendarCheck } from 'lucide-react'
import AvailabilityManager from './AvailabilityManager'
import ModernAppointmentsCalendar from './ModernAppointmentsCalendar'
import AddEventPanel from './calendar/AddEventPanel'
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

        {/* ── KPI chips ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiChipSkeleton key={i} />)
            : kpis.map((k) => <KpiChip key={k.label} {...k} />)
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

        {/* ── Add/Edit Event Panel (slide-in) ── */}
        <AnimatePresence>
          {isModalOpen && (
            <AddEventPanel
              appointment={selectedAppointment}
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
    </div>
  )
}

export default AppointmentsCalendar
