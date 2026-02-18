import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { diaryService } from '@shared/services/diaryService'
import { useAuth } from '../../auth'

const PatientDiary = ({ patientId, patientName, onClose }) => {
    const { user } = useAuth()
    const [notes, setNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchNotes()
    }, [patientId])

    const fetchNotes = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await diaryService.getNotes(patientId)
            setNotes(response.data || [])
        } catch (error) {
            console.error('Error fetching notes:', error)
            setError('Error al cargar las notas del diario')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newNote.trim()) return

        setIsSubmitting(true)
        try {
            const noteData = {
                text: newNote,
                author: user?.name || user?.email || 'Professional'
            }

            const response = await diaryService.addNote(patientId, noteData)
            setNotes(prev => [response.data, ...prev])
            setNewNote('')
        } catch (error) {
            console.error('Error adding note:', error)
            alert('Error al agregar la nota')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

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
                <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                    <div>
                        <h2 className="text-2xl font-bold">📔 Diario del Paciente</h2>
                        <p className="text-purple-100 text-sm">{patientName}</p>
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
                    {/* New Note Form */}
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 focus-within:border-purple-500 transition">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Escribe una nueva nota sobre el paciente..."
                                rows={4}
                                className="w-full bg-transparent resize-none focus:outline-none text-gray-700 placeholder-gray-400"
                            />
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {user?.name || 'Usuario'}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newNote.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Agregar Nota
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Notes List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
                                <p className="text-gray-500">Cargando notas...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchNotes}
                                className="mt-2 text-red-700 hover:text-red-800 text-sm underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">No hay notas en el diario</p>
                            <p className="text-gray-400 text-sm mt-1">Agrega la primera nota del paciente</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Historial de Notas ({notes.length})
                            </h3>
                            <AnimatePresence>
                                {notes.map((note, index) => (
                                    <motion.div
                                        key={note._id || note.id || index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-purple-600 font-semibold text-sm">
                                                        {note.author?.charAt(0)?.toUpperCase() || 'P'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{note.author || 'Profesional'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {note.createdAt ? formatDate(note.createdAt) : 'Fecha desconocida'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed ml-13">
                                            {note.text}
                                        </p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Las notas se guardan automáticamente
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default PatientDiary
