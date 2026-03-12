import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, User, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { patientsService } from '@shared/services/patientsService'

const avatarPalette = [
    'bg-sky-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
]
const avatarColor = (id) => {
    const n = String(id ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return avatarPalette[n % avatarPalette.length]
}

/**
 * Self-contained patient search bar.
 * Fetches patients internally; optionally calls onSelect(patient) when a result
 * is picked. Falls back to navigating to the patients page if onSelect is omitted.
 */
const DashboardSearchBar = ({ onSelect, className = '' }) => {
    const navigate = useNavigate()
    const [query, setQuery]               = useState('')
    const [results, setResults]           = useState([])
    const [open, setOpen]                 = useState(false)
    const [loading, setLoading]           = useState(false)
    const [focused, setFocused]           = useState(false)
    const inputRef                        = useRef(null)
    const debounceRef                     = useRef(null)

    const search = useCallback(async (q) => {
        if (!q || q.length < 2) { setResults([]); return }
        setLoading(true)
        try {
            const res  = await patientsService.getAll({ search: q, limit: 6 })
            const raw  = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
            const list = (Array.isArray(raw) ? raw : []).map(p => ({
                id:      p._id || p.id,
                name:    `${p.firstName || p.nombre || ''} ${p.lastName || p.apellido || ''}`.trim() || 'Paciente',
                email:   p.email || '',
                status:  p.status || 'active',
            }))
            setResults(list)
            setOpen(list.length > 0)
        } catch {
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        clearTimeout(debounceRef.current)
        if (!query.trim()) { setResults([]); setOpen(false); return }
        debounceRef.current = setTimeout(() => search(query), 280)
        return () => clearTimeout(debounceRef.current)
    }, [query, search])

    const handleSelect = (patient) => {
        setQuery('')
        setResults([])
        setOpen(false)
        if (onSelect) onSelect(patient)
        else navigate('/dashboard/professional/patients')
    }

    const clear = () => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }

    return (
        <div className={`relative ${className}`}>
            {/* Input pill */}
            <div className={`
                flex items-center gap-2 px-3 h-9 rounded-xl transition-all duration-200
                bg-gray-100/80 dark:bg-gray-700/60
                border border-transparent
                ${focused
                    ? 'border-[#0075C9]/40 dark:border-sky-500/40 bg-white dark:bg-gray-700 shadow-sm shadow-[#0075C9]/10'
                    : 'hover:bg-gray-200/70 dark:hover:bg-gray-700/80'}
            `}>
                <Search
                    size={14}
                    className={`shrink-0 transition-colors ${focused ? 'text-[#0075C9] dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    placeholder="Buscar paciente..."
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { setFocused(true); if (results.length) setOpen(true) }}
                    onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 160) }}
                    className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                />
                {query ? (
                    <button onClick={clear} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={13} />
                    </button>
                ) : (
                    <span className="shrink-0 hidden lg:flex items-center gap-0.5 text-[10px] text-gray-300 dark:text-gray-600 font-mono select-none">
                        <kbd className="px-1 py-0.5 rounded bg-gray-200/80 dark:bg-gray-600/60 text-gray-400 dark:text-gray-500">⌘</kbd>
                        <kbd className="px-1 py-0.5 rounded bg-gray-200/80 dark:bg-gray-600/60 text-gray-400 dark:text-gray-500">K</kbd>
                    </span>
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="search-dropdown"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-999"
                    >
                        {/* Header row */}
                        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Resultados
                            </span>
                            {loading && (
                                <span className="w-3 h-3 border-2 border-[#0075C9]/30 border-t-[#0075C9] rounded-full animate-spin" />
                            )}
                        </div>

                        <div className="pb-2">
                            {results.map((p) => {
                                const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                return (
                                    <button
                                        key={p.id}
                                        onMouseDown={() => handleSelect(p)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors group"
                                    >
                                        <div className={`w-8 h-8 rounded-xl ${avatarColor(p.id)} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">{p.name}</p>
                                            {p.email && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">{p.email}</p>}
                                        </div>
                                        <ArrowRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-[#0075C9] dark:group-hover:text-sky-400 transition-colors shrink-0" />
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DashboardSearchBar
