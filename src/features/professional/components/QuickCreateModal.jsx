import { AnimatePresence, motion } from 'motion/react'
import { appointmentsService } from '@shared/services/appointmentsService'

const QuickCreateModal = ({
    quickCreate,
    setQuickCreate,
    quickForm,
    setQuickForm,
    onCreated,
}) => {
    return (
        <AnimatePresence>
            {quickCreate && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setQuickCreate(null)}
                >
                    <motion.div
                        initial={{ scale: 0.93, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.93, opacity: 0, y: 8 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-sm p-5"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 leading-none">
                                    {quickCreate.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">Nueva cita</p>
                            </div>
                            <button
                                onClick={() => setQuickCreate(null)}
                                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Paciente</label>
                                <input
                                    type="text"
                                    placeholder="Nombre del paciente"
                                    value={quickForm.patientName}
                                    onChange={e => setQuickForm(f => ({ ...f, patientName: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        value={quickForm.time}
                                        onChange={e => setQuickForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Duración</label>
                                    <select
                                        value={quickForm.duration}
                                        onChange={e => setQuickForm(f => ({ ...f, duration: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition outline-none"
                                    >
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">1 hora</option>
                                        <option value="90">1.5 h</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Modalidad</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuickForm(f => ({ ...f, mode: 'consultorio' }))}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold border transition ${
                                            quickForm.mode !== 'videollamada'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        🏥 Consultorio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickForm(f => ({ ...f, mode: 'videollamada' }))}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold border transition ${
                                            quickForm.mode === 'videollamada'
                                                ? 'border-sky-500 bg-sky-50 text-sky-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        📹 Videollamada
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setQuickCreate(null)}
                                className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={!quickForm.patientName.trim()}
                                onClick={async () => {
                                    try {
                                        const [h, m] = quickForm.time.split(':').map(Number)
                                        const start  = new Date(quickCreate.date)
                                        start.setHours(h, m, 0, 0)
                                        const localDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
                                        await appointmentsService.create({
                                            patientName: quickForm.patientName.trim(),
                                            date:        localDate,
                                            time:        quickForm.time,
                                            duration:    Number(quickForm.duration),
                                            mode:        quickForm.mode ?? 'consultorio',
                                            isVideoCall: quickForm.mode === 'videollamada',
                                            type:        'therapy',
                                            status:      'reserved',
                                        })
                                        onCreated?.()
                                    } catch { /* ignore */ }
                                    setQuickCreate(null)
                                }}
                                className="flex-1 px-3 py-2 text-sm bg-sky-600 hover:bg-sky-600 disabled:opacity-40 text-white rounded-lg transition-colors font-semibold"
                            >
                                Crear cita
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default QuickCreateModal
