import { useState } from 'react'

/**
 * Lightweight class-based dark mode toggle scoped to a container.
 * Persists preference to localStorage under `storageKey`.
 */
export function useDarkMode(storageKey = 'dark-mode') {
  const [dark, setDark] = useState(() => localStorage.getItem(storageKey) === 'true')

  const toggle = () =>
    setDark(prev => {
      const next = !prev
      localStorage.setItem(storageKey, String(next))
      return next
    })

  return [dark, toggle]
}
