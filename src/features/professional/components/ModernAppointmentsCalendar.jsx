import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { format, startOfMonth, getDaysInMonth, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, List, CalendarOff, Sparkles } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const TYPE_COLORS = {
  consultation: { bg: '#EEF2FF', border: '#6366F1', text: '#6366F1', label: 'Consulta' },
  therapy: { bg: '#FAF5FF', border: '#A855F7', text: '#A855F7', label: 'Terapia' },
  followup: { bg: '#ECFDF5', border: '#10B981', text: '#10B981', label: 'Seguimiento' },
  emergency: { bg: '#FEF2F2', border: '#EF4444', text: '#EF4444', label: 'Emergencia' }
}

export default function ModernAppointmentsCalendar({ 
  appointments = [], 
  onSelectAppointment,
  onAddNew 
}) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState('calendar') // 'calendar' | 'list'

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayOfMonth = getDay(startOfMonth(currentDate))

  // Build calendar grid
  const cells = []
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getAppointmentsForDay = (day) => {
    if (!day) return []
    const targetDate = new Date(year, month, day)
    return appointments.filter(apt => isSameDay(new Date(apt.start), targetDate))
  }

  const selectedDayAppointments = getAppointmentsForDay(selectedDate.getDate())
    .sort((a, b) => new Date(a.start) - new Date(b.start))

  const allUpcoming = appointments
    .filter(apt => new Date(apt.start) >= today)
    .sort((a, b) => new Date(a.start) - new Date(b.start))

  const hasAppointments = (day) => getAppointmentsForDay(day).length > 0

  const isDayToday = (day) => {
    if (!day) return false
    return isToday(new Date(year, month, day))
  }

  const isDaySelected = (day) => {
    if (!day) return false
    return isSameDay(new Date(year, month, day), selectedDate)
  }

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDate(new Date(year, month, day))
    }
  }

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Agenda</div>
          <div className="text-2xl font-bold text-gray-900">Mis Citas</div>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              view === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendario</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              view === 'list' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddNew}
          className="w-11 h-11 rounded-full bg-indigo-600 text-white text-2xl font-light flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:bg-indigo-700 transition"
        >
          +
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevMonth}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition"
              >
                ‹
              </motion.button>
              
              <div className="text-base font-bold text-gray-900">
                {MONTHS[month]} {year}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextMonth}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition"
              >
                ›
              </motion.button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-400 tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {cells.map((day, idx) => {
                const hasApts = hasAppointments(day)
                const isSelectedDay = isDaySelected(day)
                const isTodayDay = isDayToday(day)

                return (
                  <motion.div
                    key={idx}
                    whileHover={day ? { scale: 1.05 } : {}}
                    whileTap={day ? { scale: 0.95 } : {}}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                      ${day ? 'hover:shadow-md' : ''}
                      ${isSelectedDay 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' 
                        : 'bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    {day && (
                      <>
                        <div className={`
                          text-sm font-semibold
                          ${isSelectedDay 
                            ? 'text-white' 
                            : isTodayDay 
                              ? 'text-indigo-600 font-bold' 
                              : 'text-gray-700'
                          }
                        `}>
                          {day}
                        </div>
                        {hasApts && (
                          <div className={`
                            w-1 h-1 rounded-full mt-1
                            ${isSelectedDay ? 'bg-white' : 'bg-indigo-600'}
                          `} />
                        )}
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Selected Day Appointments */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-600">
                  {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedDayAppointments.length} cita{selectedDayAppointments.length !== 1 ? 's' : ''}
                </div>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <CalendarOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <div className="text-sm text-gray-500">Sin citas este día</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayAppointments.map(apt => (
                    <AppointmentCard 
                      key={apt.id} 
                      appointment={apt} 
                      onClick={() => onSelectAppointment(apt)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6"
          >
            <div className="text-sm font-semibold text-gray-600 mb-4">Próximas citas</div>
            
            {allUpcoming.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-sm text-gray-500">No tienes citas próximas</div>
              </div>
            ) : (
              <div className="space-y-4">
                {allUpcoming.map((apt, idx) => {
                  const aptDate = new Date(apt.start)
                  const prevDate = idx > 0 ? new Date(allUpcoming[idx - 1].start) : null
                  const showDateHeader = !prevDate || !isSameDay(aptDate, prevDate)

                  return (
                    <div key={apt.id}>
                      {showDateHeader && (
                        <div className="text-xs font-bold text-gray-400 mt-4 mb-2">
                          {format(aptDate, 'd MMMM yyyy', { locale: es })}
                        </div>
                      )}
                      <AppointmentCard 
                        appointment={apt} 
                        onClick={() => onSelectAppointment(apt)}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AppointmentCard({ appointment, onClick }) {
  const typeInfo = TYPE_COLORS[appointment.type] || TYPE_COLORS.consultation
  const time = format(new Date(appointment.start), 'HH:mm')

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 bg-white border-2 border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
      style={{ borderLeftColor: typeInfo.border, borderLeftWidth: '4px' }}
    >
      <div className="text-center min-w-12.5">
        <div className="text-base font-bold" style={{ color: typeInfo.text }}>
          {time}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
          {appointment.patientName}
        </div>
        <div 
          className="inline-block text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide"
          style={{ 
            backgroundColor: typeInfo.bg, 
            color: typeInfo.text 
          }}
        >
          {typeInfo.label}
        </div>
      </div>

      {appointment.isVideoCall && (
        <div className="text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}
