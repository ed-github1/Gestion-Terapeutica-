import {
  BookOpen, ClipboardList, FileText, Calendar, User, BarChart2, Dumbbell,
  Star, Pencil, Wind,
} from 'lucide-react'

// ─── Palette helpers ──────────────────────────────────────────────────────────
export const BRAND_GRAD = 'from-[#54C0E8] to-[#0075C9]'
export const getInitials = (nombre, apellido) =>
  `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()

// ─── Relative date ────────────────────────────────────────────────────────────
export const rel = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return `Hace ${diff}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export const TABS = [
  { key: 'caratula',   label: 'Carátula',  icon: User },
  { key: 'diary',      label: 'Diario',    icon: BookOpen },
  { key: 'historial',  label: 'Historial', icon: Calendar },
]

// ─── Mood metadata ────────────────────────────────────────────────────────────
export const MOOD_META = {
  '😊': { label: 'Bien',      bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '😊' },
  '😄': { label: 'Excelente', bg: 'bg-green-100',   text: 'text-green-700',   icon: '😄' },
  '😐': { label: 'Regular',   bg: 'bg-yellow-100',  text: 'text-yellow-700',  icon: '😐' },
  '😔': { label: 'Triste',    bg: 'bg-blue-100',    text: 'text-blue-700',    icon: '😔' },
  '😣': { label: 'Dolor',     bg: 'bg-red-100',     text: 'text-red-700',     icon: '😣' },
  '😴': { label: 'Cansado',   bg: 'bg-sky-100',     text: 'text-sky-600',     icon: '😴' },
  '😰': { label: 'Ansioso',   bg: 'bg-orange-100',  text: 'text-orange-700',  icon: '😰' },
  bien:    { label: 'Bien',    bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '😊' },
  regular: { label: 'Regular', bg: 'bg-yellow-100',  text: 'text-yellow-700',  icon: '😐' },
  triste:  { label: 'Triste',  bg: 'bg-blue-100',    text: 'text-blue-700',    icon: '😔' },
  dolor:   { label: 'Dolor',   bg: 'bg-red-100',     text: 'text-red-700',     icon: '😣' },
  cansado: { label: 'Cansado', bg: 'bg-sky-100',     text: 'text-sky-600',     icon: '😴' },
  ansioso: { label: 'Ansioso', bg: 'bg-orange-100',  text: 'text-orange-700',  icon: '😰' },
}

// ─── Homework types ───────────────────────────────────────────────────────────
export const HOMEWORK_TYPES = {
  exercise:   { label: 'Ejercicio',   icon: Dumbbell,      bg: 'bg-emerald-100 text-emerald-700' },
  reading:    { label: 'Lectura',     icon: BookOpen,      bg: 'bg-blue-100 text-blue-700' },
  journaling: { label: 'Diario',      icon: Pencil,        bg: 'bg-sky-100 text-sky-600' },
  reflection: { label: 'Reflexión',   icon: Star,          bg: 'bg-amber-100 text-amber-700' },
  breathing:  { label: 'Respiración', icon: Wind,          bg: 'bg-cyan-100 text-cyan-700' },
  other:      { label: 'Otro',        icon: ClipboardList, bg: 'bg-gray-100 text-gray-700' },
}
