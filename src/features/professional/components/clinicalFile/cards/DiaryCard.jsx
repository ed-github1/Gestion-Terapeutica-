import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Zap, Moon, Star } from 'lucide-react'
import { MOOD_META, rel } from '../constants'
import { diaryService } from '@shared/services/diaryService'

// ─── MoodBar ──────────────────────────────────────────────────────────────────
const MoodBar = ({ value, max = 10 }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0f1623] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          value >= 7 ? 'bg-emerald-400' : value >= 4 ? 'bg-amber-400' : 'bg-rose-400'
        }`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium w-4 text-right">{value}</span>
  </div>
)

// ─── StarRating ───────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && onChange?.(n)}
        className={`transition-colors ${
          readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        }`}
      >
        <Star
          className={`w-4 h-4 ${
            n <= (value || 0)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200 dark:text-gray-600'
          }`}
        />
      </button>
    ))}
  </div>
)

// ─── EvaluationPanel ─────────────────────────────────────────────────────────
const EvaluationPanel = ({ entry, patientId, authorName, onSaved }) => {
  const existing = entry.evaluation
  const [open, setOpen]       = useState(false)
  const [rating, setRating]   = useState(existing?.rating || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!rating) return
    setSaving(true)
    try {
      const res = await diaryService.evaluateNote(
        patientId,
        entry._id || entry.id,
        { rating, comment: comment.trim(), evaluatedBy: authorName }
      )
      const updated = res?.data?.data ?? res?.data ?? entry
      onSaved?.(updated)
      setOpen(false)
    } catch (e) {
      console.error('evaluateNote error:', e)
    } finally {
      setSaving(false)
    }
  }

  if (existing?.rating && !open) {
    return (
      <div className="flex items-start justify-between gap-3 pt-3 border-t border-gray-50 dark:border-[#2d3748]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={existing.rating} readOnly />
            <span className="text-[10px] text-gray-400">{existing.evaluatedBy}</span>
          </div>
          {existing.comment && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">"{existing.comment}"</p>
          )}
        </div>
        <button
          onClick={() => { setOpen(true); setRating(existing.rating); setComment(existing.comment || '') }}
          className="text-[10px] text-blue-600 hover:underline shrink-0"
        >
          Editar
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="pt-3 border-t border-gray-50 dark:border-[#2d3748]">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Star className="w-3.5 h-3.5" /> Evaluar esta entrada
        </button>
      </div>
    )
  }

  return (
    <div className="pt-3 border-t border-gray-50 dark:border-[#2d3748] space-y-2">
      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Evaluación clínica</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Observación clínica (opcional)…"
        rows={2}
        className="w-full text-xs border border-gray-200 dark:border-[#2d3748] rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-[#0f1623] dark:text-gray-100 dark:placeholder-gray-500"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!rating || saving}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[11px] font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── DiaryCard ────────────────────────────────────────────────────────────────
const DiaryCard = ({ entry, index = 0, expanded = false, patientId, authorName, onUpdate }) => {
  const meta = MOOD_META[entry.mood] || MOOD_META['😐']
  const [open, setOpen] = useState(expanded)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index, 3) * 0.04 }}
      className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2d3748] overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/60 dark:hover:bg-[#2d3748]/50 transition-colors"
      >
        <span className="text-2xl">{meta.icon ?? entry.mood}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            {entry.evaluation?.rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {entry.evaluation.rating}/5
              </span>
            )}
            {entry.symptoms && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                {entry.symptoms}
              </span>
            )}
          </div>
          {entry.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate leading-relaxed">{entry.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-400">{rel(entry.createdAt || entry.date)}</p>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-[#2d3748] pt-3">
              {entry.notes && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{entry.notes}</p>
              )}
              {(entry.energy != null || entry.sleep != null) && (
                <div className="grid grid-cols-2 gap-3">
                  {entry.energy != null && (
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Energía
                      </p>
                      <MoodBar value={entry.energy} />
                    </div>
                  )}
                  {entry.sleep != null && (
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Moon className="w-3 h-3" /> Sueño
                      </p>
                      <MoodBar value={entry.sleep} />
                    </div>
                  )}
                </div>
              )}
              {patientId && (
                <EvaluationPanel
                  entry={entry}
                  patientId={patientId}
                  authorName={authorName}
                  onSaved={onUpdate}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default DiaryCard
