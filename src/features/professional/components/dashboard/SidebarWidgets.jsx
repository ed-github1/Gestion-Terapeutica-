import { MessageSquare, BookOpen } from 'lucide-react'

/**
 * Sidebar widgets shown only below the xl breakpoint.
 * Includes: WeeklyProgress, CPD hours, Messages, Quick Notes,
 *           Crisis Resources, and Self-Care nudge.
 *
 * @param {object}   props
 * @param {object}   props.stats        - Dashboard stats from useDashboardData
 * @param {Array}    props.mockMessages - List of recent message previews
 * @param {object}   props.mockCPD      - CPD hours data { completed, required, deadline, supervised, supervisedRequired }
 */
const SidebarWidgets = ({ stats, mockMessages, mockCPD }) => {
    return (
        <div className="xl:hidden mt-6 space-y-4">

            {/* Progreso semanal + CPD – side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Weekly Progress */}
                <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-4">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        Progreso Semanal
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">Sesiones Completadas</span>
                                <span className="font-bold text-emerald-600">{stats.completedThisWeek || 0}/12</span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full"
                                    style={{ width: `${((stats.completedThisWeek || 0) / 12) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">Metas de Tratamiento</span>
                                <span className="font-bold text-blue-600">8/10</span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div className="h-full bg-linear-to-r from-blue-500 to-sky-500 rounded-full" style={{ width: '80%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CPD Hours */}
                <div className="bg-linear-to-br from-sky-50 to-sky-50 rounded-2xl p-5 border border-sky-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-4">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        Horas CPD
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">Formación</span>
                                <span className="font-bold text-sky-600">
                                    {mockCPD.completed}/{mockCPD.required} h
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-sky-500 to-sky-400 rounded-full"
                                    style={{ width: `${Math.min((mockCPD.completed / mockCPD.required) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">Supervisión</span>
                                <span className="font-bold text-blue-700">
                                    {mockCPD.supervised}/{mockCPD.supervisedRequired} h
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-sky-500 to-blue-500 rounded-full"
                                    style={{ width: `${Math.min((mockCPD.supervised / mockCPD.supervisedRequired) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Renovación: <span className="font-semibold text-gray-600">{mockCPD.deadline}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        Mensajes
                    </h4>
                    <div className="flex items-center gap-2">
                        {stats.unreadMessages > 0 && (
                            <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {stats.unreadMessages}
                            </span>
                        )}
                        <button className="text-xs text-blue-600 font-semibold">Ver Todo</button>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3 px-5 py-3.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                msg.unread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {msg.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className={`text-sm truncate ${msg.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {msg.name}
                                    </p>
                                    {msg.unread && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{msg.preview}</p>
                            </div>
                            <p className="text-[10px] text-gray-400 shrink-0">{msg.time}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Notes + Crisis – side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Quick Notes */}
                <div className="bg-linear-to-br from-sky-50 to-blue-50 rounded-2xl p-5 border border-sky-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-3">
                        <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        Notas Rápidas
                    </h4>
                    <textarea
                        placeholder="Anota observaciones de la sesión..."
                        className="w-full h-28 p-3 bg-white rounded-xl border border-sky-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button className="w-full mt-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                        Guardar Nota
                    </button>
                </div>

                {/* Crisis Resources */}
                <div className="bg-linear-to-br from-rose-50 to-red-50 rounded-2xl p-5 border border-rose-200">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm mb-3">
                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        Recursos de Crisis
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                            <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Línea de Crisis</p>
                                <p className="text-sm font-bold text-rose-600">988</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Apoyo por Texto</p>
                                <p className="text-xs text-gray-600">Envía CASA al 741741</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Self-Care nudge */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">Toma un Descanso</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Has tenido 3 sesiones hoy. Considera un breve descanso de atención plena antes de tu próxima cita.
                        </p>
                        <button className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
                            Iniciar ejercicio de respiración 5-min →
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default SidebarWidgets
