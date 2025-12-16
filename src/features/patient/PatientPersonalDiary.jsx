import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../auth'

const PatientPersonalDiary = ({ onClose }) => {
  const { user } = useAuth()
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: new Date().toISOString(),
      mood: '😊',
      symptoms: 'Me siento mucho mejor hoy',
      activities: 'Caminé 30 minutos',
      notes: 'El dolor de rodilla ha disminuido considerablemente. Continúo con los ejercicios recomendados.',
    },
    {
      id: 2,
      date: new Date(Date.now() - 86400000).toISOString(),
      mood: '😐',
      symptoms: 'Dolor leve en la rodilla',
      activities: 'Ejercicios de fisioterapia',
      notes: 'Realicé los ejercicios pero sentí algo de incomodidad.',
    }
  ])
  const [newEntry, setNewEntry] = useState({
    mood: '😊',
    symptoms: '',
    activities: '',
    notes: ''
  })
  const [isAddingEntry, setIsAddingEntry] = useState(false)

  const moodOptions = ['😊', '😐', '😔', '😣', '😴', '😰']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newEntry.notes.trim()) return

    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...newEntry
    }

    setEntries([entry, ...entries])
    setNewEntry({ mood: '😊', symptoms: '', activities: '', notes: '' })
    setIsAddingEntry(false)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hoy a las ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Ayer a las ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} días atrás`
    } else {
      return date.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold">📖 Mi Diario Personal de Salud</h2>
            <p className="text-purple-100 text-sm">Registra cómo te sientes cada día</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Entry Button */}
          {!isAddingEntry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingEntry(true)}
              className="w-full mb-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 transition flex items-center justify-center gap-2 text-purple-600 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Entrada
            </motion.button>
          )}

          {/* New Entry Form */}
          <AnimatePresence>
            {isAddingEntry && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mb-6 p-6 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Entrada</h3>
                
                {/* Mood Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cómo te sientes hoy?
                  </label>
                  <div className="flex gap-3">
                    {moodOptions.map((mood) => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setNewEntry({ ...newEntry, mood })}
                        className={`text-3xl p-3 rounded-lg transition ${
                          newEntry.mood === mood 
                            ? 'bg-purple-100 ring-2 ring-purple-500' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Síntomas (opcional)
                  </label>
                  <input
                    type="text"
                    value={newEntry.symptoms}
                    onChange={(e) => setNewEntry({ ...newEntry, symptoms: e.target.value })}
                    placeholder="Ej: Dolor de cabeza, cansancio..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Activities */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actividades (opcional)
                  </label>
                  <input
                    type="text"
                    value={newEntry.activities}
                    onChange={(e) => setNewEntry({ ...newEntry, activities: e.target.value })}
                    placeholder="Ej: Ejercicio, medicación tomada..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas *
                  </label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    placeholder="Escribe cómo te has sentido hoy, cualquier cambio o cosa importante..."
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Guardar Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingEntry(false)
                      setNewEntry({ mood: '😊', symptoms: '', activities: '', notes: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Entries List */}
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entradas todavía</h3>
                <p className="text-gray-600">Comienza a registrar tus síntomas y progreso diario</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{entry.mood}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</p>
                        {entry.symptoms && (
                          <p className="text-xs text-orange-600 mt-1">
                            <span className="font-medium">Síntomas:</span> {entry.symptoms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {entry.activities && (
                    <div className="mb-2 flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Actividades:</span> {entry.activities}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{entry.notes}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            💡 <span className="font-medium">Consejo:</span> Llevar un diario de salud te ayuda a ti y a tu profesional a entender mejor tu progreso
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PatientPersonalDiary
